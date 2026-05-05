import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ActivityBar, Sparkline, StatusIndicator, useInterval, generateSparklineData } from "./DashboardUtils";
import { Brain, TrendingUp, Clock, Layers, Zap, ChevronRight } from "lucide-react";

export interface Executive {
  id: string;
  name: string;
  role: string;
  initials: string;
  color: string;
  colorClass: string;
  borderClass: string;
  bgClass: string;
  icon: React.ReactNode;
  description: string;
}

export const EXECUTIVES: Executive[] = [
  {
    id: "sharma",
    name: "Dr. Anya Sharma",
    role: "CTO",
    initials: "AS",
    color: "#00e5ff",
    colorClass: "text-[#00e5ff]",
    borderClass: "border-[#00e5ff]/30",
    bgClass: "bg-[#00e5ff]/5",
    icon: <Brain className="w-5 h-5" />,
    description: "AI/ML Strategy & Infrastructure",
  },
  {
    id: "al-farsi",
    name: "Mr. Omar Al-Farsi",
    role: "CFO",
    initials: "OA",
    color: "#ffd700",
    colorClass: "text-[#ffd700]",
    borderClass: "border-[#ffd700]/30",
    bgClass: "bg-[#ffd700]/5",
    icon: <TrendingUp className="w-5 h-5" />,
    description: "Treasury, Markets & Tokenomics",
  },
  {
    id: "rodriguez",
    name: "Ms. Isabella Rodriguez",
    role: "CMO",
    initials: "IR",
    color: "#ff0080",
    colorClass: "text-[#ff0080]",
    borderClass: "border-[#ff0080]/30",
    bgClass: "bg-[#ff0080]/5",
    icon: <Zap className="w-5 h-5" />,
    description: "Brand, Growth & Content",
  },
  {
    id: "richter",
    name: "Mr. Klaus Richter",
    role: "COO",
    initials: "KR",
    color: "#39ff14",
    colorClass: "text-[#39ff14]",
    borderClass: "border-[#39ff14]/30",
    bgClass: "bg-[#39ff14]/5",
    icon: <Layers className="w-5 h-5" />,
    description: "Operations, Pipelines & Execution",
  },
  {
    id: "tanaka",
    name: "Ms. Akari Tanaka",
    role: "CPO",
    initials: "AT",
    color: "#bf00ff",
    colorClass: "text-[#bf00ff]",
    borderClass: "border-[#bf00ff]/30",
    bgClass: "bg-[#bf00ff]/5",
    icon: <Clock className="w-5 h-5" />,
    description: "People, Culture & Governance",
  },
];

interface ExecutiveCardProps {
  executive: Executive;
}

export function ExecutiveCard({ executive }: ExecutiveCardProps) {
  const [status, setStatus] = useState<"active" | "idle" | "busy">("active");
  const [currentTask, setCurrentTask] = useState("Analyzing infrastructure metrics...");
  const [queueDepth, setQueueDepth] = useState(3);
  const [operationsCompleted, setOperationsCompleted] = useState(147);
  const [sparklineData, setSparklineData] = useState<number[]>(generateSparklineData(20, 10, 90));
  const [recentOps, setRecentOps] = useState<string[]>([
    "Validated mining job #8921",
    "Updated worker configuration",
    "Relayed share to pool",
  ]);

  useInterval(() => {
    // Simulate live activity
    setSparklineData(prev => [...prev.slice(1), 10 + Math.random() * 80]);
    setQueueDepth(Math.max(0, Math.floor(Math.random() * 8)));
    setOperationsCompleted(prev => prev + Math.floor(Math.random() * 3));

    const tasks = [
      "Analyzing infrastructure metrics...",
      "Optimizing agent pipelines...",
      "Monitoring worker heartbeats...",
      "Processing reward distribution...",
      "Signing contract PDF...",
      "Coordinating MESHNET peers...",
      "Compressing document archive...",
      "Validating PoP events...",
    ];
    if (Math.random() > 0.7) {
      setCurrentTask(tasks[Math.floor(Math.random() * tasks.length)]);
      setStatus(Math.random() > 0.3 ? "active" : "busy");
    }
  }, 2000);

  return (
    <Card
      className={`
        relative overflow-hidden border backdrop-blur-xl
        ${executive.borderClass}
        bg-black/40
        hover:bg-black/50
        transition-all duration-500
        group
      `}
    >
      {/* Ambient glow */}
      <div
        className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-700"
        style={{ backgroundColor: executive.color }}
      />

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold border"
              style={{
                backgroundColor: `${executive.color}15`,
                borderColor: `${executive.color}40`,
                color: executive.color,
              }}
            >
              {executive.initials}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">{executive.name}</span>
                <Badge
                  variant="outline"
                  className="text-xs px-1.5 py-0 h-5"
                  style={{
                    borderColor: `${executive.color}50`,
                    color: executive.color,
                    backgroundColor: `${executive.color}10`,
                  }}
                >
                  {executive.role}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{executive.description}</p>
            </div>
          </div>

          <StatusIndicator status={status} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current task */}
        <div className="flex items-center gap-2 text-sm">
          <ChevronRight className="w-4 h-4 animate-pulse" style={{ color: executive.color }} />
          <span className="text-white/90 font-mono text-xs truncate">{currentTask}</span>
        </div>

        {/* Sparkline + stats */}
        <div className="flex items-end justify-between">
          <div className="space-y-2 flex-1">
            <ActivityBar
              label="Queue"
              value={queueDepth}
              max={10}
              color={executive.color}
            />
            <ActivityBar
              label="Completed"
              value={operationsCompleted % 50}
              max={50}
              color={executive.color}
            />
          </div>
          <div className="ml-4">
            <Sparkline data={sparklineData} color={executive.color} />
          </div>
        </div>

        {/* Recent operations */}
        <ScrollArea className="h-20 w-full">
          <div className="space-y-1 pr-4">
            {recentOps.map((op, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <div
                  className="w-1 h-1 rounded-full"
                  style={{ backgroundColor: executive.color }}
                />
                <span className="truncate">{op}</span>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Footer stats */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <span className="text-xs text-muted-foreground">
            Total ops: <span className="text-white font-mono">{operationsCompleted}</span>
          </span>
          <span className="text-xs text-muted-foreground">
            Uptime: <span className="text-white font-mono">99.9%</span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
