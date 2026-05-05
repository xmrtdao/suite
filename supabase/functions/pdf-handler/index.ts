import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb, degrees } from "https://esm.sh/pdf-lib@1.17.1";

/**
 * PDF Handler Edge Function — MCP Native
 *
 * Accepts MCP-formatted payloads from xmrt-mcp-server via Supabase functions.invoke().
 * The incoming payload always contains an `action` field that determines the operation.
 *
 * Supported actions: merge, split, sign, watermark, metadata, compress
 * All PDFs are read from / written to Supabase Storage "documents" bucket.
 */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BUCKET = "documents";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

async function getPdfFromStorage(supabase: ReturnType<typeof createClient>, path: string): Promise<Uint8Array> {
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error || !data) throw new Error(`Download failed: ${error?.message || "unknown"}`);
  return new Uint8Array(await data.arrayBuffer());
}

async function savePdfToStorage(
  supabase: ReturnType<typeof createClient>,
  path: string,
  bytes: Uint8Array
): Promise<string> {
  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  let result: unknown;

  try {
    const body = await req.json();

    // Support both direct invocation and MCP-routed payloads
    // MCP payloads have `action` at the top level (transformed by xmrt-mcp-server)
    // Direct payloads have action nested differently
    const action = body.action as string;
    const payload = body;

    if (!action) {
      return new Response(JSON.stringify({ error: "Missing action field" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    switch (action) {
      case "merge": {
        const sources: string[] = payload.sources || [];
        if (sources.length < 2) throw new Error("At least 2 PDF sources required");

        const merged = await PDFDocument.create();
        for (const src of sources) {
          const bytes = await getPdfFromStorage(supabase, src);
          const doc = await PDFDocument.load(bytes);
          const pages = await merged.copyPages(doc, doc.getPageIndices());
          for (const p of pages) merged.addPage(p);
        }

        const outBytes = await merged.save();
        const outPath = `merged/${Date.now()}-${payload.output_name || "merged.pdf"}`;
        const outUrl = await savePdfToStorage(supabase, outPath, outBytes);
        result = { pages: merged.getPageCount(), url: outUrl, path: outPath, size: outBytes.length };
        break;
      }

      case "split": {
        const { source, ranges } = payload;
        if (!source || !ranges) throw new Error("source and ranges required");

        const bytes = await getPdfFromStorage(supabase, source);
        const doc = await PDFDocument.load(bytes);
        const totalPages = doc.getPageCount();

        const outputs: Array<{ name: string; pages: number; url: string; path: string }> = [];

        for (const range of ranges) {
          const start = Math.max(0, (range.start || 1) - 1);
          const end = Math.min(totalPages, range.end || totalPages);
          if (start >= end) continue;

          const newDoc = await PDFDocument.create();
          const indices = Array.from({ length: end - start }, (_, i) => start + i);
          const copied = await newDoc.copyPages(doc, indices);
          for (const p of copied) newDoc.addPage(p);

          const outBytes = await newDoc.save();
          const name = range.name || `pages-${start + 1}-${end}.pdf`;
          const outPath = `split/${Date.now()}-${name}`;
          const outUrl = await savePdfToStorage(supabase, outPath, outBytes);
          outputs.push({ name, pages: newDoc.getPageCount(), url: outUrl, path: outPath });
        }

        result = { totalPages, outputs };
        break;
      }

      case "sign": {
        const { source, text, position, reason } = payload;
        if (!source) throw new Error("source required");

        const bytes = await getPdfFromStorage(supabase, source);
        const doc = await PDFDocument.load(bytes);
        const pageIndex = Math.max(0, (position?.page || 1) - 1);
        const page = doc.getPage(pageIndex);
        const { width, height } = page.getSize();

        const sx = position?.x ?? width * 0.1;
        const sy = position?.y ?? height * 0.1;
        const sw = position?.width ?? 200;
        const sh = position?.height ?? 60;

        page.drawRectangle({
          x: sx, y: sy, width: sw, height: sh,
          borderColor: rgb(0, 0.5, 0.8), borderWidth: 2, color: rgb(0.95, 0.98, 1),
        });

        const font = await doc.embedFont(StandardFonts.Helvetica);
        page.drawText(text || "Signed", { x: sx + 10, y: sy + sh / 2 + 5, size: 12, font, color: rgb(0, 0, 0) });
        page.drawText(reason || "XMRT DAO Digital Signature", { x: sx + 10, y: sy + 10, size: 8, font, color: rgb(0.4, 0.4, 0.4) });

        const outBytes = await doc.save();
        const outPath = `signed/${Date.now()}-signed.pdf`;
        const outUrl = await savePdfToStorage(supabase, outPath, outBytes);
        result = { url: outUrl, path: outPath, size: outBytes.length };
        break;
      }

      case "watermark": {
        const { source, text, opacity } = payload;
        if (!source) throw new Error("source required");

        const bytes = await getPdfFromStorage(supabase, source);
        const doc = await PDFDocument.load(bytes);
        const font = await doc.embedFont(StandardFonts.HelveticaBold);
        const wmText = text || "XMRT DAO Confidential";
        const wmOpacity = opacity ?? 0.3;

        for (const page of doc.getPages()) {
          const { width, height } = page.getSize();
          page.drawText(wmText, {
            x: width * 0.1, y: height * 0.5, size: 48, font,
            color: rgb(0.8, 0.8, 0.8), opacity: wmOpacity, rotate: degrees(-45),
          });
        }

        const outBytes = await doc.save();
        const outPath = `watermarked/${Date.now()}-wm.pdf`;
        const outUrl = await savePdfToStorage(supabase, outPath, outBytes);
        result = { pages: doc.getPageCount(), url: outUrl, path: outPath, size: outBytes.length };
        break;
      }

      case "metadata": {
        const { source, metadata } = payload;
        if (!source) throw new Error("source required");

        const bytes = await getPdfFromStorage(supabase, source);
        const doc = await PDFDocument.load(bytes);
        const prev = {
          title: doc.getTitle(), author: doc.getAuthor(),
          subject: doc.getSubject(), keywords: doc.getKeywords(),
        };

        if (metadata?.title) doc.setTitle(metadata.title);
        if (metadata?.author) doc.setAuthor(metadata.author);
        if (metadata?.subject) doc.setSubject(metadata.subject);
        if (metadata?.keywords) doc.setKeywords(metadata.keywords);
        doc.setProducer("XMRT DAO PDF Handler");

        const outBytes = await doc.save();
        const outPath = `metadata/${Date.now()}-meta.pdf`;
        const outUrl = await savePdfToStorage(supabase, outPath, outBytes);
        result = { previous: prev, url: outUrl, path: outPath };
        break;
      }

      case "compress": {
        const { source, quality } = payload;
        if (!source) throw new Error("source required");

        const bytes = await getPdfFromStorage(supabase, source);
        const doc = await PDFDocument.load(bytes);
        const originalSize = bytes.length;

        if (quality === "low") {
          doc.setTitle(""); doc.setAuthor(""); doc.setSubject(""); doc.setKeywords([]);
        }

        const outBytes = await doc.save({ useObjectStreams: true, addDefaultPage: false, updateFieldAppearances: false });
        const outPath = `compressed/${Date.now()}-compressed.pdf`;
        const outUrl = await savePdfToStorage(supabase, outPath, outBytes);
        const savings = originalSize - outBytes.length;

        result = {
          originalSize, compressedSize: outBytes.length,
          savings, savingsPercent: `${((savings / originalSize) * 100).toFixed(1)}%`,
          url: outUrl, path: outPath,
        };
        break;
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
    }

    return new Response(JSON.stringify({ success: true, action, result }, null, 2), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[PDFHandler] Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
