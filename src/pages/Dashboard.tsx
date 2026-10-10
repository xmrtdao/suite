import { useEffect, useState } from 'react';
import UnifiedChat from '@/components/UnifiedChat';
import AgentTaskVisualizer from '@/components/AgentTaskVisualizer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, Paperclip, Globe, Activity } from 'lucide-react';
import { HeroSection, Stats } from '@/components/HeroSection';
import { SEOHead } from '@/components/SEOHead';
import { useAudio } from '@/contexts/AudioContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { fetchDashboardStats } from '@/integrations/local-api';
import { AsidePanel, AsideState } from '@/components/AsidePanel';

const DASHBOARD_EDGE_FUNCTION_TOTAL = 293;

const Index = () => {
  const { playWelcomeOnce } = useAudio();
  const { t } = useLanguage();

  // The document / web / media pane is a DYNAMIC ASIDE, not a permanent
  // split. It only exists while there is something to show: a document the
  // user attached, a page the chat wants to display, or an image/video a
  // tool just generated. Closed -> chat owns the full width.
  const [aside, setAside] = useState<AsideState | null>(null);

  const [stats, setStats] = useState<Stats>({
    totalExecutions: 0,
    totalExecutionsIsEstimate: false,
    executionsLast24h: 0,
    activeAgents: 0,
    activeTasks: 0,
    // Not 100. The old default made an unmeasured system look perfect, which is
    // the worst possible default for a health figure.
    healthScore: 0,
    healthStatus: 'unknown',
    healthIssues: [],
    knowledgeEntitiesTotal: 0,
    userContextKnowledge: 0,
    userWorkflows: 0,
    registeredEdgeFunctions: DASHBOARD_EDGE_FUNCTION_TOTAL,
  });

  // Play welcome audio once per session when dashboard loads (handles post-login)
  useEffect(() => {
    playWelcomeOnce();
  }, [playWelcomeOnce]);

  // Chat and tools open the aside by dispatching:
  //   window.dispatchEvent(new CustomEvent('suite:aside', { detail }))
  // where detail is an AsideState, e.g. { kind: 'image', src, title } or
  // { kind: 'web', url } or { kind: 'doc' }.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<AsideState>).detail;
      if (detail && typeof detail === 'object' && 'kind' in detail) {
        setAside(detail);
      }
    };
    window.addEventListener('suite:aside', handler);
    return () => window.removeEventListener('suite:aside', handler);
  }, []);

  // Fetch stats from local relay API
  useEffect(() => {
    const fetchStats = async () => {
      const result = await fetchDashboardStats();
      setStats(prev => ({
        ...prev,
        ...result,
      }));
    };
    fetchStats();
    // Refresh every 30 seconds
    const id = setInterval(fetchStats, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <SEOHead
        title="AI Council of Executives at Your Fingertips | Suite"
        description="293 edge functions, 5 AI executives, real-time orchestration. Chat with CSO, CTO, CIO, CAO, COO and review live system operations instantly."
        image="/og-image-home.svg"
        url="/"
        keywords="AI executives, AI council, autonomous AI, real-time orchestration, multi-agent system"
        twitterLabel1="🤖 AI Executives"
        twitterData1="4"
        twitterLabel2="⚡ Functions"
        twitterData2="293"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Main grid: chat column is 100% when the aside is closed,
            66% (8/12) when the aside is open; the aside takes 33% (4/12). */}
        <div className={aside ? 'grid grid-cols-1 lg:grid-cols-12 gap-6' : ''}>
          <div className={aside ? 'lg:col-span-8 space-y-6' : 'space-y-6'}>
            <HeroSection stats={stats} />
            <Card className="glass-card overflow-hidden">
              <CardHeader className="border-b border-border/60 py-3 px-5">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    title="Open a document in the side panel"
                    onClick={() => setAside({ kind: 'doc' })}
                  >
                    <Paperclip className="w-4 h-4 mr-1" /> Document
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    title="Open a web page in the side panel"
                    onClick={() => setAside({ kind: 'web' })}
                  >
                    <Globe className="w-4 h-4 mr-1" /> Web
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    title="Automation services and task pipeline status"
                    onClick={() => setAside({ kind: 'ops' })}
                  >
                    <Activity className="w-4 h-4 mr-1" /> Ops
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <UnifiedChat enableMiningStats={false} />
              </CardContent>
            </Card>
            <Card className="glass-card overflow-hidden">
              <CardHeader className="border-b border-border/60 py-4 px-5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Bot className="w-4 h-4 text-primary" />
                    {t('dashboard.visualizer.title')}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <AgentTaskVisualizer />
              </CardContent>
            </Card>
          </div>

          {aside && (
            <div className="lg:col-span-4">
              <AsidePanel
                aside={aside}
                onChange={setAside}
                onClose={() => setAside(null)}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Index;
