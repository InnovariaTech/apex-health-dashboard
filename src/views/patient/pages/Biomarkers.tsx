// @ts-nocheck
import React, { useMemo, useState } from "react";
import { useBiomarkersSummary } from "@/hooks/biomarkers/useBiomarkers";
import type {
  BiomarkerSummaryItem,
  BiomarkerTrendPoint,
} from "@/types/biomarkers/biomarkers_types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

// ─── Status mapping ──────────────────────────────────────────────────────────
const STATUS_DOT: Record<string, string> = {
  NORMAL: "apex-dot-opt",
  HIGH: "apex-dot-bord",
  LOW: "apex-dot-bord",
  CRITICAL: "apex-dot-att",
  UNKNOWN: "bg-ink-4",
};

const STATUS_BADGE: Record<string, string> = {
  NORMAL: "success",
  HIGH: "warning",
  LOW: "warning",
  CRITICAL: "danger",
  UNKNOWN: "secondary",
};

const STATUS_STROKE: Record<string, string> = {
  NORMAL: "#2E7D5A",
  HIGH: "#B8761C",
  LOW: "#B8761C",
  CRITICAL: "#B23A3A",
  UNKNOWN: "#8A8A8A",
};

const STATUS_RULE: Record<string, string> = {
  NORMAL: "var(--opt)",
  HIGH: "var(--bord)",
  LOW: "var(--bord)",
  CRITICAL: "var(--att)",
  UNKNOWN: "var(--ink-4)",
};

const formatCategoryLabel = (key: string) =>
  key
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const formatChartDate = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return format(d, "MMM d, ''yy");
};

const toNumeric = (val: unknown): number | null => {
  if (typeof val === "number" && Number.isFinite(val)) return val;
  if (typeof val === "string" && val.trim() !== "") {
    const n = Number(val);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

const getLatestPoint = (trend: BiomarkerTrendPoint[]) =>
  trend.length ? trend[trend.length - 1] : null;
const getPreviousPoint = (trend: BiomarkerTrendPoint[]) =>
  trend.length >= 2 ? trend[trend.length - 2] : null;

const hasValue = (val: unknown) => {
  if (val == null) return false;
  if (typeof val === "string" && val.trim() === "") return false;
  return true;
};
const itemHasAnyValue = (item: BiomarkerSummaryItem) =>
  item.trend.some((t) => hasValue(t.value));

// ─── Inline sparkline from numeric trend values ──────────────────────────────
function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const w = 70;
  const h = 22;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const lastY = h - ((values[values.length - 1] - min) / range) * (h - 6) - 3;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="block">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={w} cy={lastY} r={2.5} fill={color} />
    </svg>
  );
}

// ─── Biomarker card ──────────────────────────────────────────────────────────
function BiomarkerCard({
  item,
  category,
  index,
  onOpen,
}: {
  item: BiomarkerSummaryItem;
  category: string;
  index: number;
  onOpen: () => void;
}) {
  const latest = getLatestPoint(item.trend);
  const previous = getPreviousPoint(item.trend);
  const latestNum = latest ? toNumeric(latest.value) : null;
  const previousNum = previous ? toNumeric(previous.value) : null;
  const status = (latest?.status || "UNKNOWN").toUpperCase();
  const unit = item.unit || latest?.unit || "";
  const displayValue =
    latest == null ? "—" : latestNum != null ? latestNum : (latest.value as string);

  const delta =
    latestNum != null && previousNum != null ? latestNum - previousNum : null;
  const numericHistory = item.trend
    .map((t) => toNumeric(t.value))
    .filter((n): n is number => n != null);

  return (
    <button
      onClick={onOpen}
      className="apex-card text-left w-full px-5 py-[18px] transition-all duration-150 hover:-translate-y-px hover:border-[var(--line-2)] focus:outline-none focus-visible:ring-1 focus-visible:ring-ring animate-apex-fade-up"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="min-w-0">
          <p className="text-[13.5px] font-medium leading-tight text-foreground truncate">
            {item.biomarkerName || item.canonicalName}
          </p>
          <p className="apex-eyebrow mt-1 truncate">{formatCategoryLabel(category)}</p>
        </div>
        <span className={`apex-dot mt-1 ${STATUS_DOT[status] ?? STATUS_DOT.UNKNOWN}`} />
      </div>

      <div className="flex items-baseline gap-1">
        <span className="font-mono text-[26px] font-medium tracking-[-0.035em] leading-none text-foreground">
          {displayValue}
        </span>
        {unit && <span className="text-[11px] text-muted-foreground">{unit}</span>}
      </div>

      <div className="flex items-center justify-between mt-3.5 pt-3 border-t border-border">
        {delta != null ? (
          <span
            className="inline-flex items-center gap-1 font-mono text-[11px]"
            style={{ color: STATUS_RULE[status] ?? "var(--ink-3)" }}
          >
            {delta > 0 ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : delta < 0 ? (
              <ArrowDownRight className="w-3 h-3" />
            ) : (
              <ArrowRight className="w-3 h-3" />
            )}
            {delta > 0 ? "+" : ""}
            {Math.abs(delta) < 1 ? delta.toFixed(1) : Math.round(delta)} {unit}
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground">
            {item.trend.length} {item.trend.length === 1 ? "result" : "results"}
          </span>
        )}
        {numericHistory.length >= 2 && (
          <Sparkline
            values={numericHistory}
            color={STATUS_STROKE[status] ?? STATUS_STROKE.UNKNOWN}
          />
        )}
      </div>
    </button>
  );
}

// ─── KPI tile ────────────────────────────────────────────────────────────────
function Kpi({
  label,
  value,
  unit,
  sub,
  rule = "var(--opt)",
}: {
  label: string;
  value: React.ReactNode;
  unit?: string;
  sub?: React.ReactNode;
  rule?: string;
}) {
  return (
    <div className="apex-card relative overflow-hidden px-5 py-[18px]">
      <div
        className="absolute top-0 left-0 h-0.5 w-2/5"
        style={{ background: rule }}
      />
      <div className="apex-eyebrow mb-2.5">{label}</div>
      <div className="font-mono text-[36px] font-medium leading-none tracking-[-0.035em] text-foreground">
        {value}
        {unit && (
          <span className="font-sans text-sm text-muted-foreground ml-1 font-normal">
            {unit}
          </span>
        )}
      </div>
      {sub && (
        <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
          {sub}
        </div>
      )}
    </div>
  );
}

// ─── Detail body (modal) ─────────────────────────────────────────────────────
function BiomarkerDetailBody({ item }: { item: BiomarkerSummaryItem }) {
  const chartData = useMemo(
    () =>
      item.trend.map((t) => ({
        rawDate: t.date,
        date: formatChartDate(t.date),
        value: toNumeric(t.value),
        status: (t.status || "UNKNOWN").toUpperCase(),
        unit: t.unit ?? item.unit ?? "",
      })),
    [item]
  );

  const numericPoints = chartData.filter((p) => p.value != null);
  const latest = getLatestPoint(item.trend);
  const status = (latest?.status || "UNKNOWN").toUpperCase();
  const lineColor = STATUS_STROKE[status] ?? STATUS_STROKE.UNKNOWN;
  const unit = item.unit || latest?.unit || "";
  const displayLatest =
    latest == null
      ? "—"
      : toNumeric(latest.value) != null
        ? toNumeric(latest.value)
        : (latest.value as string);

  return (
    <>
      <div className="flex flex-wrap items-baseline gap-3 mb-5">
        <span className="font-mono text-[40px] font-medium leading-none tracking-[-0.03em] text-foreground">
          {displayLatest}
        </span>
        {unit && <span className="text-[13px] text-muted-foreground">{unit}</span>}
        <Badge variant={STATUS_BADGE[status] ?? "secondary"}>
          <span className={`apex-dot ${STATUS_DOT[status] ?? STATUS_DOT.UNKNOWN}`} style={{ width: 6, height: 6 }} />
          {status}
        </Badge>
        {item.loinc ? (
          <span className="text-[11px] text-muted-foreground font-mono ml-auto">
            LOINC {item.loinc}
          </span>
        ) : null}
      </div>

      <h3 className="apex-eyebrow mb-2.5">Trajectory</h3>
      {numericPoints.length >= 1 ? (
        <div className="rounded-[10px] bg-secondary p-3.5 mb-6">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,26,26,0.06)" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#8A8A8A" />
              <YAxis tick={{ fontSize: 10 }} width={42} stroke="#8A8A8A" />
              <Tooltip
                formatter={(value: number) => [`${value} ${unit}`, item.biomarkerName]}
                contentStyle={{
                  borderRadius: 10,
                  border: "1px solid rgba(26,26,26,0.09)",
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={lineColor}
                strokeWidth={2}
                dot={{ r: 3, fill: lineColor, stroke: "#fff", strokeWidth: 1.5 }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex items-center justify-center h-28 text-xs text-muted-foreground border border-dashed border-border rounded-[10px] mb-6">
          No numeric values available to plot.
        </div>
      )}

      <h3 className="apex-eyebrow mb-2.5">Result history</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-[10px] font-medium text-muted-foreground uppercase tracking-[0.08em] py-2 pr-4">
                Date
              </th>
              <th className="text-left text-[10px] font-medium text-muted-foreground uppercase tracking-[0.08em] py-2 pr-4">
                Value
              </th>
              <th className="text-left text-[10px] font-medium text-muted-foreground uppercase tracking-[0.08em] py-2">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {[...chartData].reverse().map((row, i) => (
              <tr
                key={`${row.rawDate}-${i}`}
                className="border-b border-border last:border-0 hover:bg-secondary/60"
              >
                <td className="py-2.5 pr-4 font-mono text-[12px] text-muted-foreground">
                  {row.date}
                </td>
                <td className="py-2.5 pr-4 font-mono text-[13px] font-medium text-foreground">
                  {row.value != null ? `${row.value} ${row.unit}` : "—"}
                </td>
                <td className="py-2.5">
                  <Badge variant={STATUS_BADGE[row.status] ?? "secondary"}>
                    {row.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function Biomarkers() {
  const { data, isLoading, isError, refetch, isFetching } = useBiomarkersSummary();
  const [selected, setSelected] = useState<BiomarkerSummaryItem | null>(null);
  const [activeCat, setActiveCat] = useState<string>("all");

  const categories = useMemo(() => {
    if (!data) return [] as Array<[string, BiomarkerSummaryItem[]]>;
    return Object.entries(data)
      .map(([category, items]) => {
        const filtered = Array.isArray(items)
          ? items.filter(itemHasAnyValue)
          : [];
        return [category, filtered] as [string, BiomarkerSummaryItem[]];
      })
      .filter(([, items]) => items.length > 0);
  }, [data]);

  const totals = useMemo(() => {
    let markers = 0;
    let flagged = 0;
    let results = 0;
    categories.forEach(([, items]) => {
      markers += items.length;
      items.forEach((it) => {
        results += it.trend.length;
        const s = getLatestPoint(it.trend)?.status?.toUpperCase();
        if (s === "HIGH" || s === "LOW" || s === "CRITICAL") flagged += 1;
      });
    });
    return { markers, flagged, results, categories: categories.length };
  }, [categories]);

  const visibleItems = useMemo(() => {
    const out: Array<{ item: BiomarkerSummaryItem; category: string }> = [];
    categories.forEach(([category, items]) => {
      if (activeCat !== "all" && category !== activeCat) return;
      items.forEach((item) => out.push({ item, category }));
    });
    return out;
  }, [categories, activeCat]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-9 max-w-[1480px] mx-auto bg-background text-foreground min-h-screen">
      {/* Page head */}
      <div className="mb-6 pb-5 border-b border-border flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="apex-page-title">
            Biomarkers <em>panel</em>
          </h1>
          <div className="text-[13px] text-ink-2 flex items-center gap-3.5 mt-2 flex-wrap">
            <span>
              {totals.markers} markers tracked across {totals.categories} systems
            </span>
            <span className="apex-dot bg-ink-4" style={{ width: 3, height: 3 }} />
            <span>Lab results grouped by biological system</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground uppercase tracking-[0.08em] font-medium">
            <ShieldCheck className="w-3.5 h-3.5" style={{ color: "var(--apex-accent)" }} />
            HIPAA protected
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <div className="mb-6 apex-card p-4 text-sm flex items-center justify-between"
          style={{ borderColor: "var(--att)", background: "var(--att-soft)" }}>
          <span style={{ color: "var(--att)" }}>
            Could not load biomarkers. Please try again.
          </span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {/* KPI strip */}
      {!isError && categories.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
          <Kpi label="Categories" value={totals.categories} rule="var(--info)" />
          <Kpi label="Markers tracked" value={totals.markers} rule="var(--opt)" />
          <Kpi label="Total results" value={totals.results} rule="var(--opt)" />
          <Kpi
            label="Currently flagged"
            value={totals.flagged}
            rule={totals.flagged > 0 ? "var(--att)" : "var(--opt)"}
            sub={
              totals.flagged > 0 ? (
                <>
                  <TrendingUp className="w-3 h-3" style={{ color: "var(--att)" }} />
                  needs review
                </>
              ) : (
                <>
                  <TrendingDown className="w-3 h-3" style={{ color: "var(--opt)" }} />
                  all in range
                </>
              )
            }
          />
        </div>
      )}

      {/* Filter pills */}
      {!isError && categories.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-4">
          <button
            onClick={() => setActiveCat("all")}
            className={`text-[13px] px-3.5 py-1.5 rounded-full border transition-colors ${
              activeCat === "all"
                ? "bg-foreground text-background border-foreground"
                : "bg-card text-ink-2 border-border hover:border-[var(--line-2)]"
            }`}
          >
            All <span className="font-mono text-[11px] opacity-60 ml-1">{totals.markers}</span>
          </button>
          {categories.map(([category, items]) => (
            <button
              key={category}
              onClick={() => setActiveCat(category)}
              className={`text-[13px] px-3.5 py-1.5 rounded-full border transition-colors ${
                activeCat === category
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card text-ink-2 border-border hover:border-[var(--line-2)]"
              }`}
            >
              {formatCategoryLabel(category)}{" "}
              <span className="font-mono text-[11px] opacity-60 ml-1">{items.length}</span>
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isError && categories.length === 0 && (
        <div className="apex-card border-dashed p-10 text-center">
          <p className="font-serif text-lg font-medium text-foreground mb-1">
            No biomarker data yet
          </p>
          <p className="text-[13px] text-muted-foreground">
            Once your lab results are uploaded and processed, they will appear here
            grouped by category.
          </p>
        </div>
      )}

      {/* Biomarker grid */}
      {visibleItems.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {visibleItems.map(({ item, category }, idx) => (
            <BiomarkerCard
              key={`${item.loinc || item.canonicalName || "marker"}-${idx}`}
              item={item}
              category={category}
              index={idx}
              onOpen={() => setSelected(item)}
            />
          ))}
        </div>
      )}

      {isFetching && !isLoading && (
        <p className="text-center text-xs text-muted-foreground py-4">Refreshing…</p>
      )}

      {/* Detail modal */}
      <Dialog
        open={selected != null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-medium tracking-[-0.02em]">
              {selected?.biomarkerName || selected?.canonicalName || "Biomarker"}
            </DialogTitle>
          </DialogHeader>
          {selected ? <BiomarkerDetailBody item={selected} /> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
