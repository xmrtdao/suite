
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, CheckCircle2, Info, FileText, ChevronRight, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Finding {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'suggestion';
  finding: string;
  cite: string;
  statute: string;
}

interface AuditResult {
  documentType: string;
  jurisdiction: { code: string; state: string };
  riskScore: number;
  findings: Finding[];
}

interface DocViewerProps {
  text: string;
  audit: AuditResult;
  onApplyFix: (findingId: string, newText: string) => void;
}

export const DocViewer = ({ text, audit, onApplyFix }: DocViewerProps) => {
  const [activeFindingId, setActiveFindingId] = useState<string | null>(null);

  const severityColors = {
    critical: 'bg-rose-100 text-rose-700 border-rose-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    suggestion: 'bg-blue-100 text-blue-700 border-blue-200',
  };

  const severityIcons = {
    critical: <AlertCircle className="w-3 h-3" />,
    high: <AlertCircle className="w-3 h-3" />,
    medium: <Info className="w-3 h-3" />,
    suggestion: <Info className="w-3 h-3" />,
  };

  return (
    <div className="flex h-full w-full gap-4 overflow-hidden bg-background p-4 rounded-xl border border-border/60 shadow-inner">
      {/* Left: The Document Canvas */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        <Card className="flex-1 overflow-hidden border-none shadow-none bg-white rounded-lg">
          <CardHeader className="border-b py-3 px-4 bg-gray-50/50">
            <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
              <FileText className="w-3 h-3" />
              DOCUMENT VIEW: {audit.documentType.replace('_', ' ').toUpperCase()}
            </CardTitle>
          </CardHeader>
          <ScrollArea className="h-full p-8">
            <div className="max-w-3xl mx-auto font-serif text-gray-900 leading-relaxed whitespace-pre-wrap">
              {/* In a real implementation, we would use a marked-up text 
                  where findings are wrapped in <span> tags for highlighting */}
              {text}
            </div>
          </ScrollArea>
        </Card>
      </div>

      {/* Right: Intelligence Panel */}
      <div className="w-80 flex flex-col gap-4 overflow-hidden">
        <Card className="p-4 bg-indigo-50/30 border-indigo-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Audit Summary</span>
            <Badge variant="outline" className="bg-white">{audit.jurisdiction.state}</Badge>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-indigo-600">{audit.riskScore}</span>
            <span className="text-xs text-indigo-400 mb-1">Risk Score</span>
          </div>
        </Card>

        <ScrollArea className="flex-1 pr-2">
          <div className="space-y-3">
            {audit.findings.map((f) => (
              <div
                key={f.id}
                onClick={() => setActiveFindingId(f.id)}
                className={cn(
                  "p-3 rounded-lg border cursor-pointer transition-all group",
                  activeFindingId === f.id ? "ring-2 ring-indigo-500 border-transparent shadow-md" : "hover:border-indigo-300 bg-white"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn("p-1 rounded-full border", severityColors[f.severity])}>
                    {severityIcons[f.severity]}
                  </span>
                  <span className="text-[10px] font-bold uppercase opacity-60">{f.severity}</span>
                </div>
                <h4 className="text-xs font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">{f.title}</h4>
                <p className="text-[11px] text-gray-600 leading-snug line-clamp-2">{f.finding}</p>
                <div className="mt-2 flex items-center gap-1 text-[9px] font-mono text-muted-foreground">
                  <ChevronRight className="w-2 h-2" /> {f.statute}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {activeFindingId && (
          <Card className="p-4 border-indigo-200 bg-indigo-50/50 animate-in slide-in-from-bottom-4">
            <h5 className="text-xs font-bold text-indigo-900 mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3" />
              Suggested Correction
            </h5>
            <p className="text-[11px] text-gray-700 mb-3 italic">
              "Check the provided statute for full context."
            </p>
            <Button 
              size="sm" 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8"
              onClick={() => onApplyFix(activeFindingId, "CORRECTED_TEXT_PLACEHOLDER")}
            >
              <Save className="w-3 h-3 mr-2" /> Apply Redline
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};
