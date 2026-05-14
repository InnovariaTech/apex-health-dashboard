// @ts-nocheck
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { formatDistanceToNow } from "date-fns";
import { Sparkles, Brain, ArrowRight, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEnvironment } from "@/lib/EnvironmentContext";
import { createPageUrl } from "@/utils";
import { useAllPatientSummaries } from "@/hooks/ai-agent/useaiSummary";
import HealthScoreGauge from "./HealthScoreGauge";

const PREVIEW_CHAR_LIMIT = 360;

function buildPreview(summaryText: string) {
  if (!summaryText) return "";
  const paragraphs = summaryText.split(/\n{2,}/).filter(Boolean);
  let out = "";
  for (const p of paragraphs) {
    if (out.length + p.length > PREVIEW_CHAR_LIMIT) {
      const remaining = PREVIEW_CHAR_LIMIT - out.length;
      if (remaining > 80) {
        out += (out ? "\n\n" : "") + p.slice(0, remaining).trimEnd() + "…";
      } else if (!out) {
        out = p.slice(0, PREVIEW_CHAR_LIMIT).trimEnd() + "…";
      }
      break;
    }
    out += (out ? "\n\n" : "") + p;
  }
  return out;
}

function formatRelative(iso?: string) {
  if (!iso) return "";
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return "";
  }
}

export default function LatestSummaryPreview() {
  const { environment } = useEnvironment();
  const navigate = useNavigate();
  const accent = environment.primaryColor;
  const summaries = useAllPatientSummaries();

  const latest = useMemo(() => {
    const items = summaries.data?.items ?? [];
    return [...items].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
  }, [summaries.data?.items]);

  if (summaries.isLoading) {
    return <Skeleton className="h-full min-h-[280px] rounded-[14px]" />;
  }

  if (!latest || !latest.summaryText) {
    return (
      <Card className="border-dashed shadow-none h-full">
        <CardContent className="p-6 md:p-7 h-full flex flex-col items-center justify-center text-center">
          <div
            className="w-12 h-12 rounded-[12px] flex items-center justify-center mb-3"
            style={{ backgroundColor: "var(--apex-accent-soft)" }}
          >
            <Brain className="w-6 h-6" style={{ color: "var(--apex-accent)" }} />
          </div>
          <h3 className="font-serif text-lg font-medium text-foreground mb-1">No summary yet</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Run your first AI health analysis to see your score and a preview of your summary here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const preview = buildPreview(latest.summaryText);
  const hasScore = typeof latest.healthScore === "number";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="h-full"
    >
      <Card className="h-full">
        <CardContent className="p-6 md:p-7">
          {/* Header badge */}
          <div className="apex-eyebrow flex items-center gap-1.5 mb-4">
            <Sparkles className="w-3 h-3" style={{ color: "var(--apex-accent)" }} />
            AI health analysis
          </div>

          {/* Score block */}
          {hasScore && (
            <>
              <p className="apex-eyebrow mb-3">Your latest health score</p>
              <div className="flex items-center gap-5 mb-5">
                <HealthScoreGauge score={latest.healthScore} size={140} strokeWidth={11} />
                <div className="min-w-0">
                  <h2 className="font-serif text-2xl font-medium text-foreground leading-tight mb-1 tracking-[-0.015em]">
                    Analysis ready
                  </h2>
                  <p className="text-sm text-muted-foreground mb-2">
                    Based on your most recent biomarkers and longitudinal trends.
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Updated {formatRelative(latest.createdAt)}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Summary preview */}
          <div className="border-t border-border pt-4 mb-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4" style={{ color: "var(--apex-accent)" }} />
                <h3 className="text-sm font-medium text-foreground">Summary preview</h3>
              </div>
              {!hasScore && (
                <span className="text-xs text-muted-foreground">
                  {formatRelative(latest.createdAt)}
                </span>
              )}
            </div>
            <div className="prose prose-sm max-w-none prose-headings:text-foreground prose-headings:text-base prose-headings:mt-0 prose-headings:mb-2 prose-strong:text-foreground prose-p:text-foreground/80 prose-p:my-2 prose-li:text-foreground/80 prose-li:my-0.5">
              <ReactMarkdown>{preview}</ReactMarkdown>
            </div>
          </div>

          {/* Action */}
          <Button
            variant="dark"
            onClick={() => navigate(createPageUrl("HealthAnalysis"))}
          >
            View full analysis
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
