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
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
  const scoreExplanation = activeSummary?.metadata?.scoreExplanation?.trim();
  const hasScoreExplanation = Boolean(scoreExplanation);

  return (
    <div className="p-4 md:p-9 max-w-[1480px] mx-auto bg-background text-foreground">
      {/* Page head */}
      <div className="mb-6 pb-5 border-b border-border flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="apex-eyebrow flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3 h-3" style={{ color: "var(--apex-accent)" }} />
            AI health analysis
          </div>
          <h1 className="apex-page-title">
            Health <em>analysis</em>
          </h1>
          <p className="text-[13px] text-ink-2 mt-2">
            Personalized longitudinal insights from your latest lab work.
          </p>
        </div>

        <Button
          variant="dark"
          onClick={() => generate.mutate()}
          disabled={generate.isPending}
        >
          <RefreshCw className={`w-4 h-4 ${generate.isPending ? "animate-spin" : ""}`} />
          {generate.isPending ? "Analysing..." : "Run new analysis"}
        </Button>
      </div>

      {/* Empty state */}
      {isEmpty && (
        <Card className="border-dashed">
          <CardContent className="p-10 text-center">
            <div
              className="w-14 h-14 rounded-[14px] grid place-items-center mx-auto mb-4"
              style={{ backgroundColor: "var(--apex-accent-soft)" }}
            >
              <Brain className="w-7 h-7" style={{ color: "var(--apex-accent)" }} />
            </div>
            <h2 className="font-serif text-2xl font-medium mb-2 text-foreground tracking-[-0.02em]">
              No analysis yet
            </h2>
            <p className="text-[13px] text-muted-foreground mb-6 max-w-md mx-auto">
              Run your first AI health analysis to see your overall score, key trends and a
              personalized narrative summary of your biomarkers.
            </p>
            <Button onClick={() => generate.mutate()} disabled={generate.isPending}>
              <Activity className="w-4 h-4" />
              {generate.isPending ? "Analysing..." : "Generate first analysis"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid lg:grid-cols-3 gap-3.5">
          <Skeleton className="h-64 rounded-[14px]" />
          <Skeleton className="h-64 rounded-[14px] lg:col-span-2" />
        </div>
      )}

      {/* Main content */}
      {!isLoading && activeSummary && (
        <>
          <div
            className={`grid gap-3.5 mb-3.5 ${
              hasScoreExplanation ? "lg:grid-cols-3" : "lg:grid-cols-1"
            }`}
          >
            {/* Score gauge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              <Card className="h-full">
                <CardContent className="p-6 flex flex-col items-center justify-center h-full">
                  <p className="apex-eyebrow mb-4">Overall health score</p>
                  <HealthScoreGauge score={score} size={200} />
                  <div className="mt-5 flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatRelative(activeSummary.createdAt)}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 font-mono">
                    {formatDate(activeSummary.createdAt)}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Score explanation */}
            {hasScoreExplanation && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.1 }}
                className="lg:col-span-2"
              >
                <Card className="h-full">
                  <CardContent className="p-6 md:p-7">
                    <div className="apex-eyebrow flex items-center gap-1.5 mb-3.5">
                      <AlertCircle className="w-3 h-3" style={{ color: "var(--apex-accent)" }} />
                      Why this score
                    </div>
                    <p className="text-[13.5px] text-ink-2 leading-[1.65] whitespace-pre-line">
                      {scoreExplanation}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Narrative summary + history */}
          <div className="grid lg:grid-cols-3 gap-3.5">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.2 }}
              className="lg:col-span-2"
            >
              <Card>
                <CardContent className="p-6 md:p-8">
                  <div className="apex-eyebrow flex items-center gap-1.5 mb-3.5">
                    <Brain className="w-3 h-3" style={{ color: "var(--apex-accent)" }} />
                    Narrative summary
                  </div>
                  <div className="prose prose-sm md:prose-base max-w-none prose-headings:font-serif prose-headings:font-medium prose-headings:text-foreground prose-strong:text-foreground prose-p:text-ink-2 prose-li:text-ink-2">
                    <ReactMarkdown>
                      {activeSummary.summaryText || "_No narrative provided._"}
                    </ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.3 }}
            >
              <Card className="h-full">
                <CardContent className="p-6">
                  <div className="apex-eyebrow flex items-center gap-1.5 mb-3.5">
                    <History className="w-3 h-3" style={{ color: "var(--apex-accent)" }} />
                    History
                  </div>

                  {history.isLoading && (
                    <div className="space-y-2">
                      {[0, 1, 2].map((i) => (
                        <Skeleton key={i} className="h-14 rounded-[10px]" />
                      ))}
                    </div>
                  )}

                  {!history.isLoading && sortedItems.length === 0 && (
                    <p className="text-[13px] text-muted-foreground">
                      No previous analyses yet.
                    </p>
                  )}

                  <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
                    {sortedItems.map((s) => {
                      const isActive = (selectedId ?? latestSummary?.id) === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSelectedId(s.id)}
                          className={`w-full text-left px-3 py-3 rounded-[10px] border transition-colors ${
                            isActive
                              ? "border-foreground bg-secondary"
                              : "border-border hover:bg-secondary/60"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[13px] font-medium text-foreground truncate">
                                {formatDate(s.createdAt)}
                              </p>
                              <p className="text-[11px] text-muted-foreground font-mono">
                                {formatRelative(s.createdAt)}
                              </p>
                            </div>
                            <div className="px-2 py-1 rounded-[7px] font-mono text-[13px] font-medium bg-primary/10 text-primary text-center min-w-[44px]">
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

          {/* Status bar */}
          <div className="apex-status-bar mt-6">
            <div className="section">
              <ShieldCheck className="w-3 h-3" />
              <strong>End-to-end encrypted</strong>
            </div>
            <div className="section">
              <Clock className="w-3 h-3" />
              {sortedItems.length} {sortedItems.length === 1 ? "analysis" : "analyses"} on record
            </div>
            <div className="flex-1" />
            <div className="section">
              latest score <strong>{latestSummary?.healthScore ?? "—"}</strong>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
