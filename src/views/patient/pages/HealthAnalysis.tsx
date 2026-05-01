// @ts-nocheck
import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import ReactMarkdown from "react-markdown";
import {
  Sparkles,
  Activity,
  Brain,
  Clock,
  RefreshCw,
  History,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEnvironment } from "@/lib/EnvironmentContext";
import {
  useAllPatientSummaries,
  useGeneratePatientSummary,
} from "@/hooks/ai-agent/useaiSummary";
import HealthScoreGauge from "@/views/patient/components/health-analysis/HealthScoreGauge";

function formatDate(iso?: string) {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "MMM d, yyyy · h:mm a");
  } catch {
    return iso;
  }
}

function formatRelative(iso?: string) {
  if (!iso) return "";
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return "";
  }
}

export default function HealthAnalysis() {
  const { environment } = useEnvironment();
  const accent = environment.primaryColor;

  const history = useAllPatientSummaries();
  const generate = useGeneratePatientSummary();

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const sortedItems = useMemo(() => {
    const items = history.data?.items ?? [];
    return [...items].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [history.data?.items]);

  const latestSummary = sortedItems[0] ?? null;
  const activeSummary = useMemo(() => {
    if (selectedId) return sortedItems.find((s) => s.id === selectedId) ?? latestSummary;
    return latestSummary;
  }, [selectedId, sortedItems, latestSummary]);

  const score = activeSummary?.healthScore ?? 0;
  const isLoading = history.isLoading;
  const isEmpty = !isLoading && !activeSummary;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-background text-foreground">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-2 border"
            style={{ borderColor: `${accent}66`, color: accent, backgroundColor: `${accent}14` }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI HEALTH ANALYSIS
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Health Analysis
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Personalized longitudinal insights from your latest lab work.
          </p>
        </div>

        <Button
          onClick={() => generate.mutate()}
          disabled={generate.isPending}
          className="font-bold shadow-md"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${generate.isPending ? "animate-spin" : ""}`} />
          {generate.isPending ? "Analysing..." : "Run new analysis"}
        </Button>
      </div>

      {/* Empty state */}
      {isEmpty && (
        <Card
          className="border-2"
          style={{
            borderColor: `${accent}40`,
            background: `linear-gradient(135deg, ${accent}10 0%, transparent 60%)`,
          }}
        >
          <CardContent className="p-10 text-center">
            <Brain className="w-12 h-12 mx-auto mb-4" style={{ color: accent }} />
            <h2 className="text-xl font-bold mb-2 text-foreground">No analysis yet</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Run your first AI health analysis to see your overall score, key trends and a
              personalized narrative summary of your biomarkers.
            </p>
            <Button
              onClick={() => generate.mutate()}
              disabled={generate.isPending}
              className="font-bold"
            >
              <Activity className="w-4 h-4 mr-2" />
              {generate.isPending ? "Analysing..." : "Generate first analysis"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl lg:col-span-2" />
        </div>
      )}

      {/* Main content */}
      {!isLoading && activeSummary && (
        <>
          <div className="grid lg:grid-cols-3 gap-6 mb-6">
            {/* Score gauge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card
                className="border-2 shadow-md h-full"
                style={{
                  borderColor: `${accent}40`,
                  background: `linear-gradient(135deg, ${accent}10 0%, transparent 60%)`,
                }}
              >
                <CardContent className="p-6 flex flex-col items-center justify-center h-full">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
                    Overall Health Score
                  </p>
                  <HealthScoreGauge score={score} size={200} />
                  <div className="mt-5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatRelative(activeSummary.createdAt)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(activeSummary.createdAt)}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Score explanation + meta */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-2"
            >
              <Card className="border-2 shadow-md h-full" style={{ borderColor: `${accent}30` }}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertCircle className="w-5 h-5" style={{ color: accent }} />
                    <h2 className="text-lg font-bold text-foreground">Why this score</h2>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
                    {activeSummary.metadata?.scoreExplanation ||
                      "No detailed explanation was provided for this analysis."}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Narrative summary + history */}
          <div className="grid lg:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-2"
            >
              <Card className="border-2 shadow-md" style={{ borderColor: `${accent}30` }}>
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Brain className="w-5 h-5" style={{ color: accent }} />
                    <h2 className="text-lg font-bold text-foreground">Narrative summary</h2>
                  </div>
                  <div className="prose prose-sm md:prose-base max-w-none prose-headings:text-foreground prose-strong:text-foreground prose-p:text-foreground/80 prose-li:text-foreground/80">
                    <ReactMarkdown>
                      {activeSummary.summaryText || "_No narrative provided._"}
                    </ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="border-2 shadow-md h-full" style={{ borderColor: `${accent}30` }}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <History className="w-5 h-5" style={{ color: accent }} />
                    <h2 className="text-lg font-bold text-foreground">History</h2>
                  </div>

                  {history.isLoading && (
                    <div className="space-y-2">
                      {[0, 1, 2].map((i) => (
                        <Skeleton key={i} className="h-14 rounded-lg" />
                      ))}
                    </div>
                  )}

                  {!history.isLoading && sortedItems.length === 0 && (
                    <p className="text-sm text-muted-foreground">No previous analyses yet.</p>
                  )}

                  <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
                    {sortedItems.map((s) => {
                      const isActive = (selectedId ?? latestSummary?.id) === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSelectedId(s.id)}
                          className="w-full text-left px-3 py-3 rounded-lg border transition-all hover:shadow-sm"
                          style={{
                            borderColor: isActive ? accent : "hsl(var(--border))",
                            backgroundColor: isActive ? `${accent}10` : "transparent",
                          }}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-foreground truncate">
                                {formatDate(s.createdAt)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatRelative(s.createdAt)}
                              </p>
                            </div>
                            <div
                              className="px-2 py-1 rounded-md text-sm font-bold"
                              style={{
                                backgroundColor: `${accent}20`,
                                color: accent,
                                minWidth: 44,
                                textAlign: "center",
                              }}
                            >
                              {s.healthScore ?? "—"}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}

