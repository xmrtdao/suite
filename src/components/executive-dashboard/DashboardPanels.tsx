import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ExecutiveCard, EXECUTIVES } from "./ExecutiveCard";
import { useInterval, formatUptime, generateSparklineData } from "./DashboardUtils";
import {
  Activity,
  Box,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  FileText,
  Layers,
  Loader2,
  PauseCircle,
  PlayCircle,
  Server,
  Shield,
  Zap,
  Wifi,
  WifiOff,
} from "lucide-react";

// ─── Live Activity Feed ───
interface ActivityItem {
  id: string;
  timestamp: Date;
  executive: string;
  action: string;
  target: string;
  status: "running" | "completed" | "checkpoint" | "failed";
  color: string;
}

const INITIAL_ACTIVITIES: ActivityItem[] = [
  { id: "1", timestamp: new Date(Date.now() - 1000 * 30), executive: "CFO", action: "Signed contract PDF", target: "mining-agreement-v2.pdf", status: "completed", color: "#ffd700" },
  { id: "2", timestamp: new Date(Date.now() - 1000 * 45), executive: "COO", action: "Registered worker", target: "worker-xmrt-089", status: "completed", color: "#39ff14" },
  { id: "3", timestamp: new Date(Date.now() - 1000 * 60), executive: "CTO", action: "Configured MESHNET", target: "node-san-jose-01", status: "running", color: "#00e5ff" },
  { id: "4", timestamp: new Date(Date.now() - 1000 * 90), executive: "CMO", action: "Generated viral content", target: "twitter-thread-42", status: "completed", color: "#ff0080" },
  { id: "5", timestamp: new Date(Date.now() - 1000 * 120), executive: "CPO", action: "Validated PoP reward", target: "wallet-0x7730...", status: "checkpoint", color: "#bf00ff" },
  { id: "6", timestamp: new Date(Date.now() - 1000 * 150), executive: "CFO", action: "Watermarked NDA", target: "nda-supplier-b.pdf", status: "completed", color: "#ffd700" },
  { id: "7", timestamp: new Date(Date.now() - 1000 * 180), executive: "CTO", action: "Relayed share via MESHNET", target: "bridge-node-03", status: "running", color: "#00e5ff" },
  { id: "8", timestamp: new Date(Date.now() - 1000 * 210), executive: "COO", action: "Compressed document archive", target: "q3-reports.zip", status: "completed", color: "#39ff14" },
];

export function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>(INITIAL_ACTIVITIES);

  useInterval(() => {
    const execs = ["CTO", "CFO", "CMO", "COO", "CPO"];
    const colors: Record<string, string> = {
      CTO: "#00e5ff", CFO: "#ffd700", CMO: "#ff0080", COO: "#39ff14", CPO: "#bf00ff",
    };
    const actions = [
      "Processed PDF signature", "Validated mining share", "Updated worker config",
      "Relayed MESHNET message", "Compressed document", "Generated report",
      "Monitored pool metrics", "Synced node state", "Orchestrated task",
    ];
    const targets = [
      "contract-001.pdf", "worker-node-12", "pool.supportxmr.com",
      "mesh-peer-7f3a", "docs-archive.zip", "daily-metrics.json",
      "bridge-node-02", "agent-task-4821", "supabase-edge-fn",
    ];
    const statuses: ActivityItem["status"][] = ["running", "completed", "checkpoint"];

    const exec = execs[Math.floor(Math.random() * execs.length)];
    const newActivity: ActivityItem = {
      id: Math.random().toString(36).slice(2),
      timestamp: new Date(),
      executive: exec,
      action: actions[Math.floor(Math.random() * actions.length)],
      target: targets[Math.floor(Math.random() * targets.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      color: colors[exec],
    };

    setActivities(prev => [newActivity, ...prev].slice(0, 50));
  }, 3000);

  return (
    <Card className="border border-white/10 bg-black/40 backdrop-blur-xl overflow-hidden">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-semibold text-white">Live Activity Feed</span>
        </div>
        <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
          Real-time
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[320px]">
          <div className="space-y-0">
            {activities.map((activity, i) => (
              <div key={activity.id} className="flex items-start gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                <div className="mt-0.5">
                  <StatusIcon status={activity.status} color={activity.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold" style={{ color: activity.color }}>{activity.executive}</span>
                    <span className="text-muted-foreground">{activity.action}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-white/70 font-mono truncate">{activity.target}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {timeAgo(activity.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function StatusIcon({ status, color }: { status: ActivityItem["status"]; color: string }) {
  if (status === "completed") return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
  if (status === "failed") return <PauseCircle className="w-3.5 h-3.5 text-rose-400" />;
  if (status === "checkpoint") return <PauseCircle className="w-3.5 h-3.5" style={{ color }} />;
  return <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color }} />;
}

function timeAgo(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

// ─── DenoClaw Pipeline ───
interface PipelineStage {
  name: string;
  status: "pending" | "running" | "completed" | "checkpoint";
  duration: number;
  ops: number;
}

export function DenoClawPipeline() {
  const [stages, setStages] = useState<PipelineStage[]>([
    { name: "Contract Ingest", status: "completed", duration: 3.2, ops: 1 },
    { name: "PDF Signature", status: "completed", duration: 4.7, ops: 1 },
    { name: "Watermark & Stamp", status: "completed", duration: 2.1, ops: 1 },
    { name: "Worker Registration", status: "running", duration: 5.8, ops: 2 },
    { name: "MESHNET Sync", status: "checkpoint", duration: 0, ops: 0 },
    { name: "Pool Connection", status: "pending", duration: 0, ops: 0 },
  ]);

  const [elapsed, setElapsed] = useState(0);

  useInterval(() => setElapsed(e => e + 1), 1000);

  return (
    <Card className="border border-white/10 bg-black/40 backdrop-blur-xl">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-sky-400" />
          <span className="text-sm font-semibold text-white">DenoClaw Pipeline</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-sky-500/30 text-sky-400 bg-sky-500/10">
            60s Bursts
          </Badge>
          <span className="text-xs font-mono text-muted-foreground">{formatTime(elapsed)}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stages.map((stage, i) => (
            <div key={stage.name} className="flex items-center gap-3">
              {/* Stage indicator */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                    stage.status === "completed"
                      ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-400"
                      : stage.status === "running"
                      ? "border-sky-500/50 bg-sky-500/20 text-sky-400 animate-pulse"
                      : stage.status === "checkpoint"
                      ? "border-amber-500/50 bg-amber-500/20 text-amber-400"
                      : "border-white/10 bg-white/5 text-muted-foreground"
                  }`}
                >
                  {stage.status === "completed" ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : stage.status === "running" ? (
                    <PlayCircle className="w-4 h-4" />
                  ) : stage.status === "checkpoint" ? (
                    <PauseCircle className="w-4 h-4" />
                  ) : (
                    <Box className="w-4 h-4" />
                  )}
                </div>
                {i < stages.length - 1 && (
                  <div className={`w-0.5 h-6 ${stage.status === "completed" ? "bg-emerald-500/40" : "bg-white/10"}`} />
                )}
              </div>

              {/* Stage info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white">{stage.name}</span>
                  <Badge
                    variant="outline"
                    className="text-xs h-5"
                    style={{
                      borderColor:
                        stage.status === "completed"
                          ? "rgba(16,185,129,0.3)"
                          : stage.status === "running"
                          ? "rgba(56,189,248,0.3)"
                          : stage.status === "checkpoint"
                          ? "rgba(245,158,11,0.3)"
                          : "rgba(255,255,255,0.1)",
                      color:
                        stage.status === "completed"
                          ? "#10b981"
                          : stage.status === "running"
                          ? "#38bdf8"
                          : stage.status === "checkpoint"
                          ? "#f59e0b"
                          : "#6b7280",
                      backgroundColor:
                        stage.status === "completed"
                          ? "rgba(16,185,129,0.1)"
                          : stage.status === "running"
                          ? "rgba(56,189,248,0.1)"
                          : stage.status === "checkpoint"
                          ? "rgba(245,158,11,0.1)"
                          : "transparent",
                    }}
                  >
                    {stage.status}
                  </Badge>
                </div>
                {stage.duration > 0 && (
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {stage.duration}s · {stage.ops} op{stage.ops !== 1 ? "s" : ""}
                  </div>
                )}
                {stage.status === "checkpoint" && (
                  <div className="text-xs text-amber-400/80 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Resumes in next 60s burst via Supabase cron
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

// ─── System Metrics ───
export function SystemMetrics() {
  const [costSaved, setCostSaved] = useState(2847.32);
  const [tasksCompleted, setTasksCompleted] = useState(8942);
  const [edgeInvocations, setEdgeInvocations] = useState(124_391);
  const [meshPeers, setMeshPeers] = useState(47);
  const [activeWorkers, setActiveWorkers] = useState(312);

  useInterval(() => {
    setCostSaved(prev => prev + Math.random() * 0.15);
    setTasksCompleted(prev => prev + Math.floor(Math.random() * 3));
    setEdgeInvocations(prev => prev + Math.floor(Math.random() * 12));
    setMeshPeers(prev => Math.max(30, prev + Math.floor(Math.random() * 5 - 2)));
    setActiveWorkers(prev => Math.max(200, prev + Math.floor(Math.random() * 8 - 3)));
  }, 1500);

  const metrics = [
    {
      label: "Cost Saved",
      value: `$${costSaved.toFixed(2)}`,
      delta: "vs AWS Lambda + Vercel Pro",
      icon: <Zap className="w-5 h-5 text-amber-400" />,
      sparkline: generateSparklineData(15, 2000, 3000),
      color: "#f59e0b",
    },
    {
      label: "Tasks Completed",
      value: tasksCompleted.toLocaleString(),
      delta: "Total DenoClaw operations",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
      sparkline: generateSparklineData(15, 8000, 9000),
      color: "#10b981",
    },
    {
      label: "Edge Invocations",
      value: edgeInvocations.toLocaleString(),
      delta: "60-second bursts this month",
      icon: <Cpu className="w-5 h-5 text-sky-400" />,
      sparkline: generateSparklineData(15, 100_000, 130_000),
      color: "#38bdf8",
    },
    {
      label: "MESHNET Peers",
      value: meshPeers.toString(),
      delta: "Active offline nodes",
      icon: <Wifi className="w-5 h-5 text-violet-400" />,
      sparkline: generateSparklineData(15, 30, 60),
      color: "#a78bfa",
    },
    {
      label: "Active Workers",
      value: activeWorkers.toString(),
      delta: "Mining on XMRT pools",
      icon: <Database className="w-5 h-5 text-rose-400" />,
      sparkline: generateSparklineData(15, 180, 350),
      color: "#fb7185",
    },
    {
      label: "System Uptime",
      value: "99.97%",
      delta: "Last 30 days",
      icon: <Shield className="w-5 h-5 text-cyan-400" />,
      sparkline: generateSparklineData(15, 99.5, 100),
      color: "#22d3ee",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      {metrics.map((m) => (
        <Card
          key={m.label}
          className="border border-white/10 bg-black/40 backdrop-blur-xl hover:bg-black/50 transition-all duration-300"
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              {m.icon}
              <svg width="60" height="20">
                <polyline
                  points={m.sparkline.map((v, i) => `${(i / (m.sparkline.length - 1)) * 60},${20 - (v - Math.min(...m.sparkline)) / (Math.max(...m.sparkline) - Math.min(...m.sparkline)) * 20}`).join(" ")}
                  fill="none"
                  stroke={m.color}
                  strokeWidth={1.5}
                  opacity={0.6}
                />
              </svg>
            </div>
            <div className="text-2xl font-bold text-white font-mono">{m.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{m.delta}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── MESHNET Status ───
export function MeshnetStatus() {
  const [online, setOnline] = useState(true);
  const [peers, setPeers] = useState([
    { id: "peer-sj-01", latency: 23, role: "bridge", status: "online" },
    { id: "peer-sj-02", latency: 45, role: "miner", status: "online" },
    { id: "peer-la-01", latency: 67, role: "validator", status: "online" },
    { id: "peer-mx-01", latency: 89, role: "miner", status: "online" },
    { id: "peer-cr-01", latency: 112, role: "relay", status: "offline" },
  ]);

  useInterval(() => {
    setPeers(prev => prev.map(p => ({
      ...p,
      latency: Math.max(10, p.latency + Math.floor(Math.random() * 20 - 10)),
    })));
  }, 2000);

  return (
    <Card className="border border-white/10 bg-black/40 backdrop-blur-xl">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          {online ? (
            <Wifi className="w-4 h-4 text-emerald-400" />
          ) : (
            <WifiOff className="w-4 h-4 text-amber-400" />
          )}
          <span className="text-sm font-semibold text-white">MESHNET Mesh</span>
        </div>
        <Badge
          variant="outline"
          className={`text-xs ${
            online
              ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
              : "border-amber-500/30 text-amber-400 bg-amber-500/10"
          }`}
        >
          {online ? "Online" : "Offline Mode"}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {peers.map((peer) => (
            <div
              key={peer.id}
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${
                    peer.status === "online" ? "bg-emerald-400" : "bg-rose-400"
                  }`}
                />
                <div>
                  <div className="text-xs text-white font-mono">{peer.id}</div>
                  <div className="text-xs text-muted-foreground capitalize">{peer.role}</div>
                </div>
              </div>
              <div className="text-xs font-mono text-muted-foreground">
                {peer.latency}ms
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <FileText className="w-3 h-3" />
          <span>Jobs distributed even without internet connectivity</span>
        </div>
      </CardContent>
    </Card>
  );
}
