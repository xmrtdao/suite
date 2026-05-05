import { useState, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ExecutiveCard, EXECUTIVES } from "@/components/executive-dashboard/ExecutiveCard";
import { ActivityFeed, DenoClawPipeline, SystemMetrics, MeshnetStatus } from "@/components/executive-dashboard/DashboardPanels";
import { useInterval, formatUptime } from "@/components/executive-dashboard/DashboardUtils";
import {
  Cpu,
  Globe,
  Layers,
  Server,
  Shield,
  Zap,
} from "lucide-react";

export default function ExecutiveDashboard() {
  const [uptime, setUptime] = useState(0);
  const [totalInvocations, setTotalInvocations] = useState(124_391);
  const [systemHealth, setSystemHealth] = useState(99.97);

  useEffect(() => {
    const start = Date.now() - 1_234_567_000; // Simulate startup time
    const timer = setInterval(() => {
      setUptime(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useInterval(() => {
    setTotalInvocations(prev => prev + Math.floor(Math.random() * 15));
    setSystemHealth(prev => Math.min(100, Math.max(99.5, prev + (Math.random() - 0.5) * 0.05)));
  }, 2000);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      {/* Subtle grid background */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 max-w-[1600px] mx-auto px-4 py-6">
        {/* ─── Header ─── */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex items-center gap-2">
                <Layers className="w-6 h-6 text-sky-400" />
                <h1 className="text-2xl font-bold tracking-tight">SupaClaw</h1>
              </div>
              <Badge
                variant="outline"
                className="text-xs border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
              >
                LIVE
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Autonomous AI executive team operating entirely within Supabase Deno runtime
            </p>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-sky-400" />
              <span className="text-muted-foreground">Invocations:</span>
              <span className="font-mono text-white">{totalInvocations.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-muted-foreground">Health:</span>
              <span className="font-mono text-emerald-400">{systemHealth.toFixed(2)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-amber-400" />
              <span className="text-muted-foreground">Uptime:</span>
              <span className="font-mono text-white">{formatUptime(uptime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-violet-400" />
              <span className="text-muted-foreground">MESHNET:</span>
              <span className="font-mono text-violet-400">47 peers</span>
            </div>
          </div>
        </header>

        <Separator className="bg-white/10 mb-6" />

        {/* ─── Executive Grid ─── */}
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
              AI Executive Team
            </h2>
            <span className="text-xs text-muted-foreground ml-2">
              5 autonomous agents · $0 server cost · 24/7 operations
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            {EXECUTIVES.map((exec) => (
              <ExecutiveCard key={exec.id} executive={exec} />
            ))}
          </div>
        </section>

        <Separator className="bg-white/10 mb-6" />

        {/* ─── Main Dashboard Grid ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left column: Activity + Pipeline */}
          <div className="lg:col-span-2 space-y-4">
            <SystemMetrics />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DenoClawPipeline />
              <MeshnetStatus />
            </div>
          </div>

          {/* Right column: Activity Feed */}
          <div className="space-y-4">
            <ActivityFeed />
          </div>
        </div>

        {/* ─── Footer ─── */}
        <footer className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-xs text-muted-foreground">
            SupaClaw · Autonomous business operations via Supabase Edge Functions ·
            All agents run in 60-second Deno bursts chained into infinite workflows ·
            Zero external servers required
          </p>
        </footer>
      </div>
    </div>
  );
}
