import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface SparklineProps {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}

export function Sparkline({ data, color, width = 120, height = 40 }: SparklineProps) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.8}
      />
      <circle
        cx={width}
        cy={height - ((data[data.length - 1] - min) / range) * height}
        r={3}
        fill={color}
      />
    </svg>
  );
}

interface StatusIndicatorProps {
  status: "active" | "idle" | "busy" | "error";
  pulse?: boolean;
}

export function StatusIndicator({ status, pulse = true }: StatusIndicatorProps) {
  const colors = {
    active: "bg-emerald-500",
    idle: "bg-amber-500",
    busy: "bg-sky-500",
    error: "bg-rose-500",
  };

  return (
    <span className="relative flex h-3 w-3">
      {pulse && status === "active" && (
        <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", colors[status])} />
      )}
      <span className={cn("relative inline-flex rounded-full h-3 w-3", colors[status])} />
    </span>
  );
}

interface ActivityBarProps {
  label: string;
  value: number;
  max: number;
  color: string;
}

export function ActivityBar({ label, value, max, color }: ActivityBarProps) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-20 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-mono w-8 text-right" style={{ color }}>{value}</span>
    </div>
  );
}

export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);
  useEffect(() => { savedCallback.current = callback; }, [callback]);
  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

export function generateSparklineData(length: number, min: number, max: number): number[] {
  return Array.from({ length }, () => min + Math.random() * (max - min));
}

export function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
