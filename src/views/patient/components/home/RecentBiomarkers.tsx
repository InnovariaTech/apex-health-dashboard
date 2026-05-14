// @ts-nocheck
import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { createPageUrl } from "@/utils";
import { useBiomarkersSummary } from "@/hooks/biomarkers/useBiomarkers";
import type {
  BiomarkerSummaryItem,
  BiomarkerTrendPoint,
} from "@/types/biomarkers/biomarkers_types";

const STATUS_DOT: Record<string, string> = {
  NORMAL: "apex-dot-opt",
  HIGH: "apex-dot-bord",
  LOW: "apex-dot-bord",
  CRITICAL: "apex-dot-att",
  UNKNOWN: "bg-ink-4",
};

const getLatestPoint = (trend: BiomarkerTrendPoint[]) =>
  trend.length ? trend[trend.length - 1] : null;

const toNumeric = (val: unknown): number | null => {
  if (typeof val === "number" && Number.isFinite(val)) return val;
  if (typeof val === "string" && val.trim() !== "") {
    const n = Number(val);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

const hasValue = (val: unknown) => {
  if (val == null) return false;
  if (typeof val === "string" && val.trim() === "") return false;
  return true;
};

export default function RecentBiomarkers() {
  const { data, isLoading } = useBiomarkersSummary();

  const recent = useMemo(() => {
    if (!data) return [] as BiomarkerSummaryItem[];
    const items: BiomarkerSummaryItem[] = [];
    Object.values(data).forEach((list) => {
      if (Array.isArray(list)) {
        list.forEach((it) => {
          if (it.trend?.some((t) => hasValue(t.value))) items.push(it);
        });
      }
    });
    // Most recently drawn first.
    return [...items]
      .sort((a, b) => {
        const ad = new Date(getLatestPoint(a.trend)?.date ?? 0).getTime();
        const bd = new Date(getLatestPoint(b.trend)?.date ?? 0).getTime();
        return bd - ad;
      })
      .slice(0, 4);
  }, [data]);

  if (!isLoading && recent.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-baseline justify-between mb-3.5 px-1">
        <h2 className="font-serif font-medium text-[22px] tracking-[-0.015em] text-foreground">
          Recent biomarkers
        </h2>
        <Link
          to={createPageUrl("Biomarkers")}
          className="text-[12px] text-primary inline-flex items-center gap-1 hover:underline"
        >
          Open biomarkers panel <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="apex-card px-4 py-3.5">
                <div className="h-3 w-16 rounded bg-secondary mb-3" />
                <div className="h-6 w-20 rounded bg-secondary" />
              </div>
            ))
          : recent.map((item, i) => {
              const latest = getLatestPoint(item.trend);
              const status = (latest?.status || "UNKNOWN").toUpperCase();
              const num = latest ? toNumeric(latest.value) : null;
              const value =
                latest == null ? "—" : num != null ? num : (latest.value as string);
              const unit = item.unit || latest?.unit || "";
              return (
                <Link
                  key={`${item.loinc || item.canonicalName || "marker"}-${i}`}
                  to={createPageUrl("Biomarkers")}
                  className="apex-card px-4 py-3.5 transition-colors hover:border-[var(--line-2)]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-medium text-ink-2 truncate pr-2">
                      {item.biomarkerName || item.canonicalName}
                    </span>
                    <span
                      className={`apex-dot ${STATUS_DOT[status] ?? STATUS_DOT.UNKNOWN}`}
                      style={{ width: 8, height: 8 }}
                    />
                  </div>
                  <div className="flex items-baseline gap-1 font-mono">
                    <span className="text-[22px] font-medium tracking-[-0.01em] text-foreground">
                      {value}
                    </span>
                    {unit && <span className="text-[10px] text-ink-3">{unit}</span>}
                  </div>
                </Link>
              );
            })}
      </div>
    </div>
  );
}
