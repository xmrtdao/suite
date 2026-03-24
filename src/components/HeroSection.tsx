import { useState, useEffect } from 'react';
import { AnimatedCounter } from './AnimatedCounter';
import { supabase } from '@/integrations/supabase/client';
import {
  Zap,
  Bot,
  Activity,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Workflow,
  BrainCircuit,
  Network,
  Database,
  Cpu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

export interface Stats {
  totalExecutions: number;
  activeAgents: number;
  activeTasks: number;
  healthScore: number;
  healthStatus: 'healthy' | 'degraded' | 'critical';
  healthIssues: string[];
  knowledgeEntities: number;
  registeredEdgeFunctions: number;
}

interface HeroSectionProps {
  stats: Stats;
}

interface EcosystemEndpoint {
  id: string;
  name: string;
  path: string;
  status: 'healthy' | 'degraded' | 'error' | 'unknown';
  metric: string;
}

export const HeroSection = ({ stats }: HeroSectionProps) => {
  const { t } = useLanguage();
  const [currentBanner, setCurrentBanner] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [ecosystemEndpoints, setEcosystemEndpoints] = useState<EcosystemEndpoint[]>([
    {
      id: 'system-status',
      name: 'System status',
      path: 'system-status',
      status: 'unknown',
      metric: 'Syncing...',
    },
    {
      id: 'edge-functions',
      name: 'Edge functions',
      path: 'edge_functions',
      status: 'unknown',
      metric: `${stats.registeredEdgeFunctions} registered`,
    },
    {
      id: 'activity-log',
      name: 'Activity stream',
      path: 'activity_log',
      status: 'unknown',
      metric: 'Awaiting telemetry',
    },
    {
      id: 'database',
      name: 'Database',
      path: 'database',
      status: 'unknown',
      metric: 'Awaiting response',
    },
  ]);

  const marketingBanners = [
    {
      title: t('hero.banner.enterprise.title'),
      subtitle: t('hero.banner.enterprise.subtitle'),
      gradient: 'from-primary/20 to-primary/5',
    },
    {
      title: t('hero.banner.functions.title'),
      subtitle: t('hero.banner.functions.subtitle'),
      gradient: 'from-emerald-500/20 to-emerald-500/5',
    },
    {
      title: t('hero.banner.monitoring.title'),
      subtitle: t('hero.banner.monitoring.subtitle'),
      gradient: 'from-violet-500/20 to-violet-500/5',
    },
    {
      title: t('hero.banner.council.title'),
      subtitle: t('hero.banner.council.subtitle'),
      gradient: 'from-amber-500/20 to-amber-500/5',
    },
  ];

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % marketingBanners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isPaused, marketingBanners.length]);

  useEffect(() => {
    const fetchEcosystemSnapshot = async () => {
      const { data, error } = await supabase.functions.invoke('system-status', {
        body: {},
      });

      if (error || !data?.success || !data.status) {
        setEcosystemEndpoints((prev) =>
          prev.map((endpoint) => ({
            ...endpoint,
            status: endpoint.status === 'healthy' ? endpoint.status : 'degraded',
          }))
        );
        return;
      }

      const status = data.status;
      const edgeFunctions = status.components?.edge_functions;
      const activityLog = status.components?.activity_log;
      const database = status.components?.database;
      const agents = status.components?.agents;
      const mining = status.components?.mining;

      const nextEndpoints: EcosystemEndpoint[] = [
        {
          id: 'system-status',
          name: 'System status',
          path: 'system-status',
          status: status.overall_status === 'unhealthy' ? 'error' : status.overall_status,
          metric: `${status.health_score}% health`,
        },
        {
          id: 'edge-functions',
          name: 'Edge functions',
          path: 'edge_functions',
          status: edgeFunctions?.status || 'unknown',
          metric: `${edgeFunctions?.total_active_24h ?? 0} active / 24h`,
        },
        {
          id: 'activity-log',
          name: 'Activity stream',
          path: 'activity_log',
          status: activityLog?.status || 'unknown',
          metric: `${activityLog?.stats?.total_24h ?? 0} events / 24h`,
        },
        {
          id: 'database',
          name: 'Database',
          path: 'database',
          status: database?.status || 'unknown',
          metric: `${database?.response_time_ms ?? 0}ms latency`,
        },
        {
          id: 'agent-runtime',
          name: 'Agent runtime',
          path: 'agents',
          status: agents?.status || 'unknown',
          metric: `${agents?.stats?.working ?? 0} agents working`,
        },
        {
          id: 'mining-telemetry',
          name: 'Mining telemetry',
          path: 'mining',
          status: mining?.status || 'unknown',
          metric: `${mining?.active_workers ?? 0} active workers`,
        },
      ];

      setEcosystemEndpoints(nextEndpoints);
    };

    fetchEcosystemSnapshot();
    const interval = setInterval(fetchEcosystemSnapshot, 60000);

    return () => clearInterval(interval);
  }, []);

  const banner = marketingBanners[currentBanner];
  const registeredEdgeFunctions = stats.registeredEdgeFunctions;

  return (
    <section className="relative w-full overflow-hidden rounded-2xl border border-border/60 bg-card/70 shadow-sm">
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br transition-all duration-1000',
          banner.gradient
        )}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.12),transparent_35%),linear-gradient(hsl(var(--background)/0.45),hsl(var(--background)/0.7))]" />

      <div className="relative space-y-2 p-2 md:p-2.5">
        <div
          className="flex items-center gap-2 rounded-xl border border-border/50 bg-background/55 px-2 py-1.5 backdrop-blur"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <button
            onClick={() =>
              setCurrentBanner(
                (prev) =>
                  (prev - 1 + marketingBanners.length) % marketingBanners.length
              )
            }
            className="rounded-full bg-background/70 p-1 transition-colors hover:bg-background"
            aria-label="Previous banner"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          <div className="min-w-0 flex-1 text-center">
            <p
              className="truncate text-xs font-medium text-foreground md:text-sm"
              key={currentBanner}
            >
              <span className="font-semibold">{banner.title}</span>
              <span className="mx-2 text-muted-foreground">—</span>
              <span className="text-muted-foreground">{banner.subtitle}</span>
            </p>
          </div>

          <div className="hidden items-center gap-1 sm:flex">
            {marketingBanners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentBanner(i)}
                className={cn(
                  'h-1 w-1 rounded-full transition-all duration-300',
                  i === currentBanner
                    ? 'w-3 bg-primary'
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                )}
                aria-label={`Go to banner ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={() =>
              setCurrentBanner((prev) => (prev + 1) % marketingBanners.length)
            }
            className="rounded-full bg-background/70 p-1 transition-colors hover:bg-background"
            aria-label="Next banner"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid gap-2 xl:grid-cols-[minmax(0,1.8fr)_minmax(240px,0.9fr)]">
          <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
            <StatCard
              icon={<Zap className="h-3 w-3 text-primary" />}
              label={t('hero.stats.executions')}
              value={stats.totalExecutions}
              suffix="+"
            />
            <StatCard
              icon={<Bot className="h-3 w-3 text-emerald-500" />}
              label={t('hero.stats.agents')}
              value={stats.activeAgents}
            />
            <HealthStatCard
              healthScore={stats.healthScore}
              healthStatus={stats.healthStatus}
              healthIssues={stats.healthIssues}
              label={t('hero.stats.health')}
            />
            <StatCard
              icon={<Activity className="h-3 w-3 text-amber-500" />}
              label={t('hero.stats.tasks')}
              value={stats.activeTasks}
            />
            <StatCard
              icon={<Workflow className="h-3 w-3 text-sky-500" />}
              label="Edge functions (system)"
              value={registeredEdgeFunctions}
            />
            <StatCard
              icon={<BrainCircuit className="h-3 w-3 text-violet-500" />}
              label="Knowledge entities"
              value={stats.knowledgeEntities}
            />
          </div>

          <div className="glass-card flex min-h-[112px] flex-col rounded-xl border border-primary/15 bg-background/65 p-2 shadow-lg shadow-primary/5">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Network className="h-3 w-3 text-primary" />
                  Ecosystem endpoints
                </div>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  Live endpoint telemetry across core services.
                </p>
              </div>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-2 gap-1 overflow-hidden">
              {ecosystemEndpoints.slice(0, 6).map((endpoint) => (
                <EndpointCard key={endpoint.id} endpoint={endpoint} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
}

const StatCard = ({ icon, label, value, suffix = '' }: StatCardProps) => (
  <div className="glass-card rounded-xl border border-border/50 bg-background/60 p-1.5 text-center backdrop-blur-sm transition-transform hover:-translate-y-0.5">
    <div className="mb-1 flex justify-center">{icon}</div>
    <div className="text-sm font-bold text-foreground md:text-base">
      <AnimatedCounter end={value} suffix={suffix} />
    </div>
    <p className="mt-0.5 text-[9px] leading-tight text-muted-foreground">{label}</p>
  </div>
);

const EndpointCard = ({ endpoint }: { endpoint: EcosystemEndpoint }) => {
  const statusClass =
    endpoint.status === 'healthy'
      ? 'bg-emerald-500'
      : endpoint.status === 'degraded'
        ? 'bg-amber-500'
        : endpoint.status === 'error'
          ? 'bg-destructive'
          : 'bg-muted-foreground';

  const icon =
    endpoint.id === 'database' ? (
      <Database className="h-2.5 w-2.5" />
    ) : endpoint.id === 'agent-runtime' ? (
      <Cpu className="h-2.5 w-2.5" />
    ) : (
      <Workflow className="h-2.5 w-2.5" />
    );

  return (
    <div className="rounded-md border border-border/50 bg-background/50 px-1.5 py-1 text-[9px]">
      <div className="flex items-center justify-between gap-1">
        <div className="inline-flex items-center gap-1 truncate font-medium text-foreground">
          {icon}
          <span className="truncate">{endpoint.name}</span>
        </div>
        <span className={cn('h-1.5 w-1.5 rounded-full', statusClass)} />
      </div>
      <p className="truncate text-[8px] text-muted-foreground">/{endpoint.path}</p>
      <p className="truncate text-[9px] text-foreground">{endpoint.metric}</p>
    </div>
  );
};

interface HealthStatCardProps {
  healthScore: number;
  healthStatus: 'healthy' | 'degraded' | 'critical';
  healthIssues: string[];
  label: string;
}

const HealthStatCard = ({
  healthScore,
  healthIssues,
  label,
}: HealthStatCardProps) => {
  const getHealthColor = () => {
    if (healthScore >= 95) return 'text-emerald-500';
    if (healthScore >= 80) return 'text-amber-500';
    return 'text-destructive';
  };

  const getHealthIcon = () => {
    if (healthScore >= 95)
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    if (healthScore >= 80)
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    return <AlertTriangle className="h-4 w-4 text-destructive" />;
  };

  const getBorderClass = () => {
    if (healthScore >= 95) return '';
    if (healthScore >= 80) return 'ring-1 ring-amber-500/40';
    return 'ring-1 ring-destructive/50';
  };

  return (
    <div
      className={cn(
        'glass-card rounded-xl border border-border/50 bg-background/60 p-1.5 text-center backdrop-blur-sm transition-transform hover:-translate-y-0.5',
        getBorderClass()
      )}
    >
      <div className="mb-1 flex justify-center">{getHealthIcon()}</div>
      <div className={cn('text-sm font-bold md:text-base', getHealthColor())}>
        <AnimatedCounter end={healthScore} suffix="%" />
      </div>
      <p className="mt-0.5 text-[9px] leading-tight text-muted-foreground">
        {label}
      </p>
      {healthIssues.length > 0 && (
        <p className="mt-0.5 truncate text-[9px] text-amber-500">
          {healthIssues[0]}
        </p>
      )}
    </div>
  );
};
