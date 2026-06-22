import { useEffect, useState } from 'react';
import UnifiedChat from '@/components/UnifiedChat';
import AgentTaskVisualizer from '@/components/AgentTaskVisualizer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot } from 'lucide-react';
import { HeroSection, Stats } from '@/components/HeroSection';
import { SEOHead } from '@/components/SEOHead';
import { useAudio } from '@/contexts/AudioContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { fetchDashboardStats } from '@/integrations/local-api';

const DASHBOARD_EDGE_FUNCTION_TOTAL = 293;

const Index = () => {
  const { playWelcomeOnce } = useAudio();
  const { t } = useLanguage();
  const [stats, setStats] = useState<Stats>({
    totalExecutions: 0,
    activeAgents: 0,
    activeTasks: 0,
    healthScore: 100,
    healthStatus: 'healthy',
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
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6">
          {/* 1. Hero Section with Marketing Banners (Carousel) - Now at TOP */}
          <HeroSection stats={stats} />

          {/* 2. Chat Interface */}
          <Card className="glass-card overflow-hidden">
            <CardContent className="p-0">
              <UnifiedChat enableMiningStats={false} />
            </CardContent>
          </Card>

          {/* 2. Agent & Task Visualizer */}
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
      </div>
    </>
  );
};

export default Index;
