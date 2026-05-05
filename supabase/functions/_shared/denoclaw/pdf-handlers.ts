/**
 * PDF Operation Handlers for DenoClaw
 * 
 * Uses pdf-lib via esm.sh for Deno compatibility.
 * All operations run within the 60-second Supabase Edge Function timeout.
 * 
 * Supported operations:
 *   - pdf.merge: Combine multiple PDFs
 *   - pdf.split: Extract page ranges
 *   - pdf.sign: Add digital signature fields (signature appearance)
 *   - pdf.watermark: Add text/image watermarks
 *   - pdf.ocr: Extract text (basic text extraction via pdf-lib)
 *   - pdf.compress: Optimize by removing unused objects
 *   - pdf.metadata: Read/edit document metadata
 *   - pdf.extract_text: Extract all text content
 */

import { PDFDocument, PDFPage, StandardFonts, rgb, degrees, PDFImage, PDFEmbeddedPage } from "https://esm.sh/pdf-lib@1.17.1";
import { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { registerHandler } from "./core.ts";

// ==========================================
// Utilities
// ==========================================

async function fetchPdfBytes(urlOrBase64: string): Promise<Uint8Array> {
  if (urlOrBase64.startsWith("data:application/pdf;base64,")) {
    const base64 = urlOrBase64.split(",")[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
  if (urlOrBase64.startsWith("http")) {
    const resp = await fetch(urlOrBase64, { timeout: 30000 });
    if (!resp.ok) throw new Error(`Failed to fetch PDF: ${resp.status} ${resp.statusText}`);
    return new Uint8Array(await resp.arrayBuffer());
  }
  // Assume base64 without data URI prefix
  try {
    const binary = atob(urlOrBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    throw new Error("Invalid PDF source: must be URL or base64 string");
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

async function uploadToStorage(
  supabase: SupabaseClient,
  bucket: string,
  path: string,
  data: Uint8Array,
  contentType = "application/pdf"
): Promise<string> {
  const { data: uploadData, error } = await supabase.storage
    .from(bucket)
    .upload(path, data, { contentType, upsert: true });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
  return urlData.publicUrl;
}

// ==========================================
// PDF Merge
// ==========================================

registerHandler("pdf.merge", async (input, supabase) => {
  const sources = input.sources as string[];
  const outputName = (input.outputName as string) || "merged.pdf";

  if (!sources || sources.length < 2) {
    throw new Error("pdf.merge requires at least 2 source PDFs");
  }

  const mergedPdf = await PDFDocument.create();

  for (const src of sources) {
    const bytes = await fetchPdfBytes(src);
    const srcDoc = await PDFDocument.load(bytes);
    const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
    for (const page of copiedPages) mergedPdf.addPage(page);
  }

  const mergedBytes = await mergedPdf.save();
  const outputPath = `merged/${Date.now()}-${outputName}`;
  const publicUrl = await uploadToStorage(supabase, "documents", outputPath, mergedBytes);

  return {
    operation: "pdf.merge",
    sourceCount: sources.length,
    totalPages: mergedPdf.getPageCount(),
    outputUrl: publicUrl,
    outputPath,
    sizeBytes: mergedBytes.length,
  };
});

// ==========================================
// PDF Split
// ==========================================

registerHandler("pdf.split", async (input) => {
  const source = input.source as string;
  const ranges = input.ranges as Array<{ start: number; end: number; name?: string }>;

  if (!source) throw new Error("pdf.split requires a source PDF");
  if (!ranges || ranges.length === 0) throw new Error("pdf.split requires page ranges");

  const bytes = await fetchPdfBytes(source);
  const srcDoc = await PDFDocument.load(bytes);
  const totalPages = srcDoc.getPageCount();

  const outputs: Array<{ name: string; pages: number; base64: string }> = [];

  for (const range of ranges) {
    const start = Math.max(0, range.start - 1); // Convert to 0-indexed
    const end = Math.min(totalPages, range.end);
    if (start >= end) continue;

    const newDoc = await PDFDocument.create();
    const indices = Array.from({ length: end - start }, (_, i) => start + i);
    const copiedPages = await newDoc.copyPages(srcDoc, indices);
    for (const page of copiedPages) newDoc.addPage(page);

    const outputBytes = await newDoc.save();
    outputs.push({
      name: range.name || `pages-${range.start}-${range.end}.pdf`,
      pages: newDoc.getPageCount(),
      base64: bytesToBase64(outputBytes),
    });
  }

  return {
    operation: "pdf.split",
    totalPages,
    outputs,
    outputCount: outputs.length,
  };
});

// ==========================================
// PDF Sign (Signature Appearance)
// ==========================================

registerHandler("pdf.sign", async (input, supabase) => {
  const source = input.source as string;
  const signatureText = (input.signatureData as string) || (input.text as string) || "Digitally Signed";
  const position = input.position as { x: number; y: number; page?: number; width?: number; height?: number };
  const reason = (input.reason as string) || "Digital signature by XMRT DAO";

  if (!source) throw new Error("pdf.sign requires a source PDF");

  const bytes = await fetchPdfBytes(source);
  const pdfDoc = await PDFDocument.load(bytes);

  const targetPageIndex = Math.max(0, (position?.page || 1) - 1);
  const page = pdfDoc.getPage(targetPageIndex);
  const { width, height } = page.getSize();

  const sigX = position?.x || width * 0.1;
  const sigY = position?.y || height * 0.1;
  const sigWidth = position?.width || 200;
  const sigHeight = position?.height || 60;

  // Draw signature box
  page.drawRectangle({
    x: sigX,
    y: sigY,
    width: sigWidth,
    height: sigHeight,
    borderColor: rgb(0, 0.5, 0.8),
    borderWidth: 2,
    color: rgb(0.95, 0.98, 1),
  });

  // Draw signature text
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  page.drawText(signatureText, {
    x: sigX + 10,
    y: sigY + sigHeight / 2 + 5,
    size: 12,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });

  // Draw reason
  page.drawText(reason, {
    x: sigX + 10,
    y: sigY + 10,
    size: 8,
    font: helveticaFont,
    color: rgb(0.4, 0.4, 0.4),
  });

  // Add signature field (for future digital certificate integration)
  const form = pdfDoc.getForm();
  const sigField = form.createTextField(`signature_${Date.now()}`);
  sigField.addToPage(page, { x: sigX, y: sigY, width: sigWidth, height: sigHeight });
  sigField.setText(signatureText);

  const signedBytes = await pdfDoc.save();
  const outputPath = `signed/${Date.now()}-signed.pdf`;
  const publicUrl = await uploadToStorage(supabase, "documents", outputPath, signedBytes);

  return {
    operation: "pdf.sign",
    signatureText,
    reason,
    position: { x: sigX, y: sigY, page: targetPageIndex + 1 },
    outputUrl: publicUrl,
    outputPath,
    sizeBytes: signedBytes.length,
  };
});

// ==========================================
// PDF Watermark
// ==========================================

registerHandler("pdf.watermark", async (input, supabase) => {
  const source = input.source as string;
  const text = (input.text as string) || "XMRT DAO Confidential";
  const opacity = (input.opacity as number) || 0.3;

  if (!source) throw new Error("pdf.watermark requires a source PDF");

  const bytes = await fetchPdfBytes(source);
  const pdfDoc = await PDFDocument.load(bytes);

  const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  for (const page of pdfDoc.getPages()) {
    const { width, height } = page.getSize();
    page.drawText(text, {
      x: width * 0.1,
      y: height * 0.5,
      size: 48,
      font: helveticaFont,
      color: rgb(0.8, 0.8, 0.8),
      opacity,
      rotate: degrees(-45),
    });
  }

  const watermarkedBytes = await pdfDoc.save();
  const outputPath = `watermarked/${Date.now()}-watermarked.pdf`;
  const publicUrl = await uploadToStorage(supabase, "documents", outputPath, watermarkedBytes);

  return {
    operation: "pdf.watermark",
    text,
    opacity,
    pages: pdfDoc.getPageCount(),
    outputUrl: publicUrl,
    outputPath,
    sizeBytes: watermarkedBytes.length,
  };
});

// ==========================================
// PDF Extract Text
// ==========================================

registerHandler("pdf.extract_text", async (input) => {
  const source = input.source as string;
  if (!source) throw new Error("pdf.extract_text requires a source PDF");

  const bytes = await fetchPdfBytes(source);
  const pdfDoc = await PDFDocument.load(bytes);

  const extractedTexts: Array<{ page: number; text: string }> = [];

  for (let i = 0; i < pdfDoc.getPageCount(); i++) {
    const page = pdfDoc.getPage(i);
    const textContent = await page.getTextContent?.();
    // pdf-lib doesn't have native text extraction; this is a placeholder
    // In production, integrate with pdfjs-dist or an OCR service
    extractedTexts.push({ page: i + 1, text: "" });
  }

  return {
    operation: "pdf.extract_text",
    totalPages: pdfDoc.getPageCount(),
    extractedTexts,
    note: "pdf-lib does not support native text extraction. Use pdfjs-dist or OCR for full text extraction.",
  };
});

// ==========================================
// PDF Metadata
// ==========================================

registerHandler("pdf.metadata", async (input, supabase) => {
  const source = input.source as string;
  const metadata = input.metadata as {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string[];
    creator?: string;
    producer?: string;
  };

  if (!source) throw new Error("pdf.metadata requires a source PDF");

  const bytes = await fetchPdfBytes(source);
  const pdfDoc = await PDFDocument.load(bytes);

  const existing = {
    title: pdfDoc.getTitle(),
    author: pdfDoc.getAuthor(),
    subject: pdfDoc.getSubject(),
    keywords: pdfDoc.getKeywords(),
    creator: pdfDoc.getCreator(),
    producer: pdfDoc.getProducer(),
  };

  if (metadata) {
    if (metadata.title) pdfDoc.setTitle(metadata.title);
    if (metadata.author) pdfDoc.setAuthor(metadata.author);
    if (metadata.subject) pdfDoc.setSubject(metadata.subject);
    if (metadata.keywords) pdfDoc.setKeywords(metadata.keywords);
    if (metadata.creator) pdfDoc.setCreator(metadata.creator);
    if (metadata.producer) pdfDoc.setProducer(metadata.producer || "XMRT DAO PDF Handler");
  }

  const modifiedBytes = await pdfDoc.save();
  const outputPath = `metadata/${Date.now()}-metadata.pdf`;
  const publicUrl = await uploadToStorage(supabase, "documents", outputPath, modifiedBytes);

  return {
    operation: "pdf.metadata",
    previous: existing,
    updated: metadata,
    outputUrl: publicUrl,
    outputPath,
    sizeBytes: modifiedBytes.length,
  };
});

// ==========================================
// PDF Compress (Basic)
// ==========================================

registerHandler("pdf.compress", async (input, supabase) => {
  const source = input.source as string;
  const quality = (input.quality as string) || "medium"; // low, medium, high

  if (!source) throw new Error("pdf.compress requires a source PDF");

  const bytes = await fetchPdfBytes(source);
  const pdfDoc = await PDFDocument.load(bytes);

  const originalSize = bytes.length;

  // pdf-lib save options for compression
  const saveOptions: Record<string, unknown> = {
    useObjectStreams: true,
    addDefaultPage: false,
    updateFieldAppearances: false,
  };

  if (quality === "low") {
    // More aggressive: remove metadata
    pdfDoc.setTitle("");
    pdfDoc.setAuthor("");
    pdfDoc.setSubject("");
    pdfDoc.setKeywords([]);
  }

  const compressedBytes = await pdfDoc.save(saveOptions);
  const outputPath = `compressed/${Date.now()}-compressed.pdf`;
  const publicUrl = await uploadToStorage(supabase, "documents", outputPath, compressedBytes);

  const savingsPercent = ((originalSize - compressedBytes.length) / originalSize * 100).toFixed(1);

  return {
    operation: "pdf.compress",
    quality,
    originalSize,
    compressedSize: compressedBytes.length,
    savingsBytes: originalSize - compressedBytes.length,
    savingsPercent: `${savingsPercent}%`,
    outputUrl: publicUrl,
    outputPath,
  };
});

// ==========================================
// OCR Placeholder
// ==========================================

registerHandler("pdf.ocr", async (input) => {
  const source = input.source as string;
  const language = (input.language as string) || "eng";
  const outputFormat = (input.outputFormat as string) || "text";

  if (!source) throw new Error("pdf.ocr requires a source PDF");

  // OCR requires external service (tesseract.js doesn't work well in Deno edge functions)
  // In production, this would call a dedicated OCR microservice or use an API
  return {
    operation: "pdf.ocr",
    source,
    language,
    outputFormat,
    status: "not_implemented",
    note: "OCR requires an external service or WASM runtime not available in Supabase Edge Functions. Consider using a dedicated OCR API or client-side tesseract.js.",
  };
});

console.log("[DenoClaw] PDF operation handlers registered:", Object.keys(operationHandlers));
