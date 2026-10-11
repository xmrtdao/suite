import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Globe, Image as ImageIcon, Video, X, Zap, RefreshCw, ExternalLink } from 'lucide-react';
import { DocViewer } from '@/components/DocViewer';
import { relayAuthHeaders } from '@/integrations/relay-auth';

/**
 * AsidePanel — the Suite dashboard's dynamic side panel.
 *
 * It is NOT a permanent fixture: Dashboard renders it only when there is
 * something to show. It opens when:
 *   - the user attaches a document (chat header paperclip / drag-drop)
 *   - the user asks for a web view (chat header globe)
 *   - chat or a tool dispatches `window.dispatchEvent(new CustomEvent(
 *       'suite:aside', { detail: { kind: 'image' | 'video' | 'web' | 'doc', ... } }))`
 *     — this is how generated images/videos and tool artifacts surface here,
 *       the same way Kimi Work / Claude Desktop / Manus open their side panel.
 */

export type AsideDoc = { fileName: string; text: string; audit?: any };

export type AsideState =
  | { kind: 'doc'; doc?: AsideDoc }
  | { kind: 'web'; url?: string }
  | { kind: 'image'; src: string; title?: string }
  | { kind: 'video'; src: string; title?: string }
  | { kind: 'ops' };

interface AsidePanelProps {
  aside: AsideState;
  onChange: (next: AsideState) => void;
  onClose: () => void;
}

const KIND_META = {
  doc: { label: 'Document', icon: FileText },
  web: { label: 'Web', icon: Globe },
  image: { label: 'Image', icon: ImageIcon },
  video: { label: 'Video', icon: Video },
  ops: { label: 'Ops', icon: Zap },
} as const;

// Live view of the stack's automation layer: supervised daemons (cron engine,
// campaign scheduler, alice, dsh, ...) from the relay supervisor, plus the
// fleet task pipeline summary. Read-only by design — restarts go through the
// gated /api/supervisor/restart endpoint, not a browser button.
const OpsView = () => {
  const [services, setServices] = useState<any[]>([]);
  const [pipeline, setPipeline] = useState<{ total: number; by_stage: any[]; by_assignee: any[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sup, pipe] = await Promise.all([
        fetch('/api/supervisor/status', { headers: relayAuthHeaders() }).then(r => r.json()),
        fetch('/api/tasks/pipeline-summary', { headers: relayAuthHeaders() }).then(r => r.json()),
      ]);
      setServices(sup.services || []);
      setPipeline(pipe && typeof pipe.total === 'number' ? pipe : null);
    } catch (e: any) {
      setError(e.message || 'Failed to load automation status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  return (
    <ScrollArea className="flex-1 min-h-0">
      <div className="p-3 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Automation services</span>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={refresh} disabled={loading}>
            <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="space-y-1.5">
          {services.map((s) => (
            <div key={s.name} className="flex items-center justify-between rounded-lg border border-border/60 px-2.5 py-1.5">
              <span className="text-xs font-medium truncate">{s.name}</span>
              <span className="flex items-center gap-2 text-[10px] text-muted-foreground flex-none">
                {s.flapping && <span className="text-amber-500 font-semibold">FLAPPING</span>}
                {s.restartCount > 0 && <span>{s.restartCount} restarts</span>}
                <span className={`inline-block w-2 h-2 rounded-full ${s.healthy ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              </span>
            </div>
          ))}
          {services.length === 0 && !error && <p className="text-xs text-muted-foreground">Loading…</p>}
        </div>

        {pipeline && (
          <>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Task pipeline ({pipeline.total})</span>
            <div className="grid grid-cols-2 gap-1.5">
              {pipeline.by_stage.map((s) => (
                <div key={s.stage} className="rounded-lg border border-border/60 px-2.5 py-1.5 flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">{s.stage}</span>
                  <span className="text-xs font-bold">{s.count}</span>
                </div>
              ))}
            </div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">By agent</span>
            <div className="space-y-1">
              {pipeline.by_assignee.map((a) => (
                <div key={a.agent} className="flex items-center justify-between text-xs px-1">
                  <span className="text-muted-foreground">{a.agent}</span>
                  <span className="font-medium">{a.count}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </ScrollArea>
  );
};

// ── In-window web browsing through the stack's own tooling ─────────────────
// Pages are fetched server-side via POST /api/browse (cloud Playwright with a
// fetch fallback; exa-backed web-search for non-URL input) and rendered in a
// sandboxed srcDoc iframe. Link clicks and GET form submits inside the page
// are intercepted and re-browsed through the same endpoint, so browsing never
// throws the user off Suite and X-Frame-Options cannot block us.
const buildSrcDoc = (html: string, baseUrl: string): string => {
  const interceptor = `
    document.addEventListener('click', function (e) {
      var t = e.target;
      var a = t && t.closest ? t.closest('a[href]') : null;
      if (a) {
        e.preventDefault();
        e.stopPropagation();
        parent.postMessage({ __suiteBrowse: a.getAttribute('href') }, '*');
      }
    }, true);
    document.addEventListener('submit', function (e) {
      var f = e.target;
      e.preventDefault();
      if (((f.method || 'get') + '').toLowerCase() === 'get') {
        var q = '';
        try { q = new URLSearchParams(new FormData(f)).toString(); } catch (_) {}
        var u = f.action || '';
        parent.postMessage({ __suiteBrowse: u + (q ? (u.indexOf('?') > -1 ? '&' : '?') + q : '') }, '*');
      }
    }, true);
  `;
  const inject =
    `<base href="${baseUrl.replace(/"/g, '&quot;')}">` +
    `<script>${interceptor}</scr` + `ipt>`;
  if (/<head[^>]*>/i.test(html)) return html.replace(/<head[^>]*>/i, (m) => m + inject);
  return inject + html;
};

const WebView = ({ initialUrl }: { initialUrl?: string }) => {
  const [urlDraft, setUrlDraft] = useState(initialUrl || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<{ url: string; html: string; loadTime: number | null } | null>(null);
  const [results, setResults] = useState<any[] | null>(null);

  const browse = async (target: string) => {
    const t = target.trim();
    if (!t) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/browse', {
        method: 'POST',
        headers: relayAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ url: t }),
      });
      const data = await r.json();
      if (!data.success) { setError(data.error || 'Browse failed'); return; }
      if (data.kind === 'search') {
        setResults(data.results || []);
        setPage(null);
      } else {
        const finalUrl = data.finalUrl || data.url;
        setPage({ url: finalUrl, html: buildSrcDoc(data.content || '', finalUrl), loadTime: data.loadTime ?? null });
        setUrlDraft(finalUrl);
        setResults(null);
      }
    } catch (e: any) {
      setError(e.message || 'Browse failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (initialUrl) browse(initialUrl); }, [initialUrl]);

  // In-page navigation: the srcDoc interceptor posts clicked links up here and
  // we re-browse them through the relay — the user stays inside Suite.
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const href = (e.data as any)?.__suiteBrowse;
      if (!href) return;
      setPage((cur) => {
        if (!cur) return cur;
        try { browse(new URL(href, cur.url).toString()); } catch { /* ignore bad hrefs */ }
        return cur;
      });
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  return (
    <>
      <div className="flex-none flex items-center gap-2 p-2 border-b border-border/60">
        <Input
          value={urlDraft}
          onChange={(e) => setUrlDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && browse(urlDraft)}
          placeholder="Enter a URL or search…"
          className="h-8 text-xs"
        />
        <Button size="sm" className="h-8 text-xs" onClick={() => browse(urlDraft)} disabled={loading}>
          {loading ? '…' : 'Go'}
        </Button>
      </div>
      {error && <p className="flex-none px-3 py-2 text-xs text-destructive">{error}</p>}
      {page ? (
        <div className="flex-1 min-h-0 flex flex-col">
          <iframe
            srcDoc={page.html}
            title="Web view"
            className="flex-1 min-h-0 w-full border-0 bg-white"
            sandbox="allow-scripts allow-forms"
          />
          <div className="flex-none px-2 py-1 border-t border-border/60 flex items-center justify-between gap-2">
            <span className="text-[10px] text-muted-foreground truncate">
              {page.url}{page.loadTime != null ? ` · ${page.loadTime}ms` : ''}
            </span>
            <a href={page.url} target="_blank" rel="noreferrer" className="text-[10px] text-primary flex items-center gap-1 flex-none">
              Open externally <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      ) : results ? (
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-3 space-y-2">
            {results.length === 0 && <p className="text-xs text-muted-foreground text-center">No results.</p>}
            {results.map((r, i) => (
              <button
                key={i}
                className="w-full text-left rounded-lg border border-border/60 px-3 py-2 hover:bg-accent/50 transition-colors"
                onClick={() => r.url && browse(r.url)}
              >
                <span className="block text-xs font-medium text-primary truncate">{r.title || r.url}</span>
                <span className="block text-[10px] text-muted-foreground truncate">{r.url}</span>
                {(r.text || r.snippet || r.description) && (
                  <span className="block text-xs text-muted-foreground mt-1 line-clamp-2">{r.text || r.snippet || r.description}</span>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <p className="p-4 text-xs text-muted-foreground text-center">
          Enter a URL or search above — pages render here, inside Suite. Browsing runs through the relay
          (Playwright + exa), so links keep working without leaving the app.
        </p>
      )}
    </>
  );
};

export const AsidePanel = ({ aside, onChange, onClose }: AsidePanelProps) => {
  const meta = KIND_META[aside.kind] || KIND_META.doc;
  const Icon = meta.icon;

  const title =
    aside.kind === 'doc' && aside.doc ? aside.doc.fileName
    : aside.kind === 'web' && aside.url ? aside.url
    : (aside as any).title || meta.label;

  return (
    <Card className="glass-card overflow-hidden flex flex-col h-[calc(100vh-7rem)] lg:sticky lg:top-6 animate-in slide-in-from-right-4 fade-in">
      <CardHeader className="border-b border-border/60 py-3 px-4 flex-none">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-xs font-semibold flex items-center gap-2 min-w-0">
            <Icon className="w-4 h-4 text-primary flex-none" />
            <span className="truncate">{title}</span>
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 flex-none" onClick={onClose} title="Close panel">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 min-h-0 flex flex-col">
        {/* ── Document mode ─────────────────────────────────────────── */}
        {aside.kind === 'doc' && (
          aside.doc ? (
            <div className="flex-1 min-h-0 p-2">
              <DocViewer
                text={aside.doc.text}
                audit={aside.doc.audit || {
                  documentType: (aside.doc.fileName.split('.').pop() || 'document').toLowerCase(),
                  jurisdiction: { code: '—', state: 'Not audited' },
                  riskScore: 0,
                  findings: [],
                }}
                onApplyFix={() => {}}
              />
            </div>
          ) : (
            <div className="p-4 flex-1 flex flex-col items-center justify-center text-center gap-2">
              <FileText className="w-8 h-8 text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground">
                Attach a document from the chat — the paperclip or drag-and-drop — and it opens here, next to the conversation.
              </p>
            </div>
          )
        )}

        {/* ── Web mode ──────────────────────────────────────────────── */}
        {aside.kind === 'web' && <WebView initialUrl={aside.url} />}

        {/* ── Image mode (generated or uploaded) ────────────────────── */}
        {aside.kind === 'image' && (
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-3">
              <img src={aside.src} alt={aside.title || 'Generated image'} className="w-full rounded-lg border border-border/60" />
              {aside.title && <p className="text-xs text-muted-foreground mt-2">{aside.title}</p>}
            </div>
          </ScrollArea>
        )}

        {/* ── Video mode (generated or uploaded) ────────────────────── */}
        {aside.kind === 'video' && (
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-3">
              <video src={aside.src} controls className="w-full rounded-lg border border-border/60" />
              {aside.title && <p className="text-xs text-muted-foreground mt-2">{aside.title}</p>}
            </div>
          </ScrollArea>
        )}

        {/* ── Ops mode (automation services + task pipeline) ────────── */}
        {aside.kind === 'ops' && <OpsView />}
      </CardContent>
    </Card>
  );
};

export default AsidePanel;
