import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Globe, Image as ImageIcon, Video, X, Zap, RefreshCw, ExternalLink, Palette, Download, CheckCircle } from 'lucide-react';
import { relayAuthHeaders } from '@/integrations/relay-auth';

/**
 * AsidePanel — the Suite dashboard's dynamic side panel.
 */

export type AsideState =
  | { kind: 'visual'; config?: any; src?: string; title?: string }
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
  visual: { label: 'Visual Designer', icon: Palette },
  web: { label: 'Web', icon: Globe },
  image: { label: 'Image', icon: ImageIcon },
  video: { label: 'Video', icon: Video },
  ops: { label: 'Ops', icon: Zap },
} as const;

// ── Visual Designer Workbench ─────────────────────────────────────────────
const VisualDesigner = ({ config }: { config?: any }) => {
  const [loading, setLoading] = useState(false);
  const [proof, setProof] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    style: 'art_deco_gold',
    line1: config?.line1 || '',
    line2: config?.line2 || '',
    line3: config?.line3 || '',
    logoUrl: config?.logoUrl || '',
  });

  const generateProof = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/visual/generate', {
        method: 'POST',
        headers: relayAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(formData),
      });
      const data = await r.json();
      if (data.success) setProof(data.url);
    } catch (e) {
      console.error("Proof generation failed", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollArea className="flex-1 min-h-0">
      <div className="p-4 space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-muted-foreground">Design Style</label>
            <select 
              className="w-full h-8 text-xs rounded-md border border-border bg-background px-2"
              value={formData.style}
              onChange={(e) => setFormData({...formData, style: e.target.value})}
            >
              <option value="art_deco_gold">Art Deco Gold</option>
              <option value="corporate_modern">Corporate Modern</option>
              <option value="holiday_festive">Holiday Festive</option>
              <option value="enchanted_forest">Enchanted Forest</option>
              <option value="wedding_classic">Wedding Classic</option>
              <option value="graduation_prestige">Graduation Prestige</option>
              <option value="hoco_prom_glamour">Hoco & Prom Glamour</option>
              <option value="birthday_quince_celebration">Birthday/Quince</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-muted-foreground">Client Logo URL</label>
            <Input 
              className="h-8 text-xs" 
              value={formData.logoUrl} 
              onChange={(e) => setFormData({...formData, logoUrl: e.target.value})}
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-1 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Line 1 (Name)</label>
              <Input className="h-8 text-xs" value={formData.line1} onChange={(e) => setFormData({...formData, line1: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Line 2 (Date)</label>
              <Input className="h-8 text-xs" value={formData.line2} onChange={(e) => setFormData({...formData, line2: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Line 3 (Event)</label>
              <Input className="h-8 text-xs" value={formData.line3} onChange={(e) => setFormData({...formData, line3: e.target.value})} />
            </div>
          </div>

          <Button className="w-full h-9 text-xs font-bold" onClick={generateProof} disabled={loading}>
            {loading ? <RefreshCw className="w-3 h-3 mr-2 animate-spin" /> : <Palette className="w-3 h-3 mr-2" />}
            Generate Production Proof
          </Button>
        </div>

        {proof && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
            <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden border-2 border-primary/20 bg-muted">
              <img src={proof} alt="Design Proof" className="w-full h-full object-contain" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 h-8 text-xs" onClick={() => setProof(null)}>
                Reset
              </Button>
              <Button className="flex-1 h-8 text-xs" onClick={() => window.open(proof, '_blank')}>
                <Download className="w-3 h-3 mr-2" /> Download 300DPI
              </Button>
            </div>
            <div className="flex items-center justify-center gap-1 text-emerald-500 text-[10px] font-medium">
              <CheckCircle className="w-3 h-3" /> Production Ready (1200x1800px)
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

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
  const meta = KIND_META[aside.kind] || KIND_META.visual;
  const Icon = meta.icon;

  const title =
    aside.kind === 'web' && aside.url ? aside.url
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
        {/* ── Visual Designer mode (Replaces Documents) ────────────────── */}
        {aside.kind === 'visual' && <VisualDesigner config={aside.config} />}

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
