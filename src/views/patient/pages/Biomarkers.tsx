// @ts-nocheck
import React, { useMemo, useState } from "react";
import { useBiomarkersSummary } from "@/hooks/biomarkers/useBiomarkers";
import type {
  BiomarkerSummaryItem,
  BiomarkerTrendPoint,
} from "@/types/biomarkers/biomarkers_types";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FlaskConical,
  Shield,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Droplets,
  Droplet,
  Wine,
  Beef,
  Filter,
  Bone,
  Flame,
  Sparkles,
  Magnet,
  Candy,
  Atom,
  Activity,
  Gauge,
  Pill,
  ShieldAlert,
  TestTube,
  type LucideIcon,
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

// ─── Status styling ──────────────────────────────────────────────────────────
const STATUS_STYLE: Record<string, string> = {
  NORMAL: "bg-green-100 text-green-800 border-green-300",
  HIGH: "bg-orange-100 text-orange-800 border-orange-300",
  LOW: "bg-orange-100 text-orange-800 border-orange-300",
  CRITICAL: "bg-red-100 text-red-800 border-red-300",
  UNKNOWN: "bg-gray-100 text-gray-600 border-gray-300",
};

const STATUS_STROKE: Record<string, string> = {
  NORMAL: "#16a34a",
  HIGH: "#ea580c",
  LOW: "#ea580c",
  CRITICAL: "#dc2626",
  UNKNOWN: "#6b7280",
};

const formatCategoryLabel = (key: string) =>
  key
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

// ─── Category visual theme (icon + colors) ───────────────────────────────────
type CategoryMeta = {
  icon: LucideIcon;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  accent: string; // border-l accent for the section header
};

const CATEGORY_META: Record<string, CategoryMeta> = {
  "blood count (cbc)": {
    icon: Droplets,
    iconColor: "text-rose-600",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
    accent: "border-rose-400",
  },
  "blood count": {
    icon: Droplets,
    iconColor: "text-rose-600",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
    accent: "border-rose-400",
  },
  cbc: {
    icon: Droplets,
    iconColor: "text-rose-600",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
    accent: "border-rose-400",
  },
  liver: {
    icon: Wine,
    iconColor: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    accent: "border-amber-400",
  },
  protein: {
    icon: Beef,
    iconColor: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    accent: "border-red-400",
  },
  lipid: {
    icon: Droplet,
    iconColor: "text-yellow-600",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    accent: "border-yellow-400",
  },
  kidney: {
    icon: Filter,
    iconColor: "text-cyan-600",
    bgColor: "bg-cyan-50",
    borderColor: "border-cyan-200",
    accent: "border-cyan-400",
  },
  bone: {
    icon: Bone,
    iconColor: "text-stone-600",
    bgColor: "bg-stone-50",
    borderColor: "border-stone-200",
    accent: "border-stone-400",
  },
  metabolic: {
    icon: Flame,
    iconColor: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    accent: "border-orange-400",
  },
  hormones: {
    icon: Sparkles,
    iconColor: "text-fuchsia-600",
    bgColor: "bg-fuchsia-50",
    borderColor: "border-fuchsia-200",
    accent: "border-fuchsia-400",
  },
  iron: {
    icon: Magnet,
    iconColor: "text-slate-700",
    bgColor: "bg-slate-100",
    borderColor: "border-slate-300",
    accent: "border-slate-500",
  },
  glucose: {
    icon: Candy,
    iconColor: "text-pink-600",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
    accent: "border-pink-400",
  },
  inflammation: {
    icon: Flame,
    iconColor: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    accent: "border-red-400",
  },
  metabolites: {
    icon: Atom,
    iconColor: "text-indigo-600",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
    accent: "border-indigo-400",
  },
  pancreas: {
    icon: Activity,
    iconColor: "text-teal-600",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-200",
    accent: "border-teal-400",
  },
  thyroid: {
    icon: Gauge,
    iconColor: "text-violet-600",
    bgColor: "bg-violet-50",
    borderColor: "border-violet-200",
    accent: "border-violet-400",
  },
  vitamins: {
    icon: Pill,
    iconColor: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    accent: "border-emerald-400",
  },
  "tumor markers": {
    icon: ShieldAlert,
    iconColor: "text-rose-700",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
    accent: "border-rose-400",
  },
};

const DEFAULT_CATEGORY_META: CategoryMeta = {
  icon: TestTube,
  iconColor: "text-blue-600",
  bgColor: "bg-blue-50",
  borderColor: "border-blue-200",
  accent: "border-blue-400",
};

const getCategoryMeta = (key: string): CategoryMeta => {
  const norm = key.toLowerCase().replace(/_/g, " ").replace(/\s+/g, " ").trim();
  if (CATEGORY_META[norm]) return CATEGORY_META[norm];
  // partial-match fallback (e.g. "Blood Count (CBC)" → "blood count")
  for (const k of Object.keys(CATEGORY_META)) {
    if (norm.includes(k)) return CATEGORY_META[k];
  }
  return DEFAULT_CATEGORY_META;
};

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

function TrendIndicator({
  current,
  previous,
}: {
  current: number | null;
  previous: number | null;
}) {
  if (current == null || previous == null) {
    return <Minus className="w-4 h-4 text-gray-400" />;
  }
  if (current === previous) return <Minus className="w-4 h-4 text-gray-400" />;
  return current > previous ? (
    <TrendingUp className="w-4 h-4 text-blue-600" />
  ) : (
    <TrendingDown className="w-4 h-4 text-blue-600" />
  );
}

// ─── Tile (latest value + status) ────────────────────────────────────────────
function BiomarkerTile({
  item,
  onOpen,
}: {
  item: BiomarkerSummaryItem;
  onOpen: () => void;
}) {
  const latest = getLatestPoint(item.trend);
  const previous = getPreviousPoint(item.trend);
  const latestNum = latest ? toNumeric(latest.value) : null;
  const previousNum = previous ? toNumeric(previous.value) : null;
  const status = (latest?.status || "UNKNOWN").toUpperCase();
  const unit = item.unit || latest?.unit || "";
  const displayValue =
    latest == null
      ? "—"
      : latestNum != null
        ? latestNum
        : (latest.value as string);

  return (
    <button
      onClick={onOpen}
      className="text-left w-full rounded-lg border-2 border-border p-4 transition-all cursor-pointer bg-card hover:border-foreground/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/40"
    >
      <div className="flex items-start justify-between mb-2 gap-2">
        <p className="text-xs font-bold text-muted-foreground uppercase leading-tight pr-1">
          {item.biomarkerName || item.canonicalName}
        </p>
        <TrendIndicator current={latestNum} previous={previousNum} />
      </div>
      <p className="text-2xl font-bold text-foreground mb-0.5">{displayValue}</p>
      <p className="text-xs text-muted-foreground font-semibold mb-2">
        {unit || "—"}
      </p>
      <div className="flex items-center justify-between">
        <Badge
          variant="outline"
          className={`${STATUS_STYLE[status] ?? STATUS_STYLE.UNKNOWN} border text-[10px] font-bold`}
        >
          {status}
        </Badge>
        <span className="text-[10px] text-muted-foreground font-semibold">
          {item.trend.length} {item.trend.length === 1 ? "result" : "results"}
        </span>
      </div>
    </button>
  );
}

// ─── Detail body (rendered inside the modal) ─────────────────────────────────
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
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Badge
          variant="outline"
          className={`${STATUS_STYLE[status] ?? STATUS_STYLE.UNKNOWN} border text-[10px] font-bold`}
        >
          {status}
        </Badge>
        <span className="text-sm font-bold text-foreground">
          {displayLatest}
          {unit ? <span className="text-muted-foreground"> {unit}</span> : null}
        </span>
        {item.loinc ? (
          <span className="text-[10px] text-muted-foreground font-semibold ml-auto">
            LOINC {item.loinc}
          </span>
        ) : null}
      </div>

      {numericPoints.length >= 1 ? (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fontWeight: 600 }} />
            <YAxis tick={{ fontSize: 11, fontWeight: 600 }} width={45} />
            <Tooltip
              formatter={(value: number) => [
                `${value} ${unit}`,
                item.biomarkerName,
              ]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={lineColor}
              strokeWidth={2.5}
              dot={{ r: 5, fill: lineColor, stroke: "#fff", strokeWidth: 2 }}
              activeDot={{ r: 7 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-32 text-xs text-muted-foreground font-semibold border border-dashed border-border rounded-md">
          No numeric values available to plot.
        </div>
      )}

      <div className="mt-5 overflow-x-auto">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
          Result history
        </p>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-border">
              <th className="text-left font-bold text-muted-foreground uppercase text-xs py-2 pr-4">
                Date
              </th>
              <th className="text-left font-bold text-muted-foreground uppercase text-xs py-2 pr-4">
                Value
              </th>
              <th className="text-left font-bold text-muted-foreground uppercase text-xs py-2">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {[...chartData].reverse().map((row, i) => (
              <tr
                key={`${row.rawDate}-${i}`}
                className="border-b border-border hover:bg-muted/50"
              >
                <td className="py-2 pr-4 font-semibold text-muted-foreground">
                  {row.date}
                </td>
                <td className="py-2 pr-4 font-bold text-foreground">
                  {row.value != null ? `${row.value} ${row.unit}` : "—"}
                </td>
                <td className="py-2">
                  <Badge
                    variant="outline"
                    className={`${STATUS_STYLE[row.status] ?? STATUS_STYLE.UNKNOWN} border text-[10px] font-bold`}
                  >
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

// ─── Category section (collapsible) ──────────────────────────────────────────
function CategorySection({
  category,
  items,
  onSelect,
}: {
  category: string;
  items: BiomarkerSummaryItem[];
  onSelect: (item: BiomarkerSummaryItem) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const flaggedCount = items.filter((it) => {
    const status = getLatestPoint(it.trend)?.status?.toUpperCase();
    return status === "HIGH" || status === "LOW" || status === "CRITICAL";
  }).length;

  const meta = getCategoryMeta(category);
  const Icon = meta.icon;

  return (
    <section className="mb-8">
      <button
        onClick={() => setExpanded((p) => !p)}
        className={`w-full flex items-center justify-between py-2 pl-3 pr-2 mb-3 rounded-md border-b border-border border-l-4 ${meta.accent} bg-gradient-to-r from-card to-transparent hover:from-muted/40 transition-colors`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center justify-center w-9 h-9 rounded-md border ${meta.borderColor} ${meta.bgColor}`}
          >
            <Icon className={`w-5 h-5 ${meta.iconColor}`} />
          </span>
          <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">
            {formatCategoryLabel(category)}
          </h2>
          <span className="text-xs text-muted-foreground font-semibold">
            {items.length} {items.length === 1 ? "marker" : "markers"}
          </span>
          {flaggedCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-300">
              <AlertTriangle className="w-3 h-3" />
              {flaggedCount} flagged
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((item, idx) => (
            <BiomarkerTile
              key={`${item.loinc || item.canonicalName || "marker"}-${idx}`}
              item={item}
              onOpen={() => onSelect(item)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function Biomarkers() {
  const { data, isLoading, isError, refetch, isFetching } =
    useBiomarkersSummary();
  const [selected, setSelected] = useState<BiomarkerSummaryItem | null>(null);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-background text-foreground min-h-screen">
      {/* Header */}
      <div className="mb-6 pb-6 border-b-2 border-border">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-sm flex items-center justify-center">
              <FlaskConical className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                BIOMARKERS
              </h1>
              <p className="text-muted-foreground font-semibold text-sm">
                Lab results grouped by biological system, with historical
                trends.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#E31C25]" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
              HIPAA Protected
            </span>
          </div>
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <div className="mb-6 p-4 rounded-lg border-2 border-red-200 bg-red-50 text-red-800 text-sm font-semibold flex items-center justify-between">
          <span>Could not load biomarkers. Please try again.</span>
          <button
            onClick={() => refetch()}
            className="px-3 py-1 rounded-md border border-red-300 hover:bg-red-100 text-xs font-bold uppercase"
          >
            Retry
          </button>
        </div>
      )}

      {/* Summary strip */}
      {!isError && categories.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <div className="rounded-lg border-2 border-border bg-card p-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">
              Categories
            </p>
            <p className="text-2xl font-bold text-foreground">
              {totals.categories}
            </p>
          </div>
          <div className="rounded-lg border-2 border-border bg-card p-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">
              Markers
            </p>
            <p className="text-2xl font-bold text-foreground">
              {totals.markers}
            </p>
          </div>
          <div className="rounded-lg border-2 border-border bg-card p-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">
              Total Results
            </p>
            <p className="text-2xl font-bold text-foreground">
              {totals.results}
            </p>
          </div>
          <div className="rounded-lg border-2 border-orange-200 bg-orange-50 p-4">
            <p className="text-[10px] font-bold text-orange-800 uppercase">
              Currently Flagged
            </p>
            <p className="text-2xl font-bold text-orange-800">
              {totals.flagged}
            </p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isError && categories.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-border bg-card p-10 text-center">
          <FlaskConical className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-bold text-foreground mb-1">
            No biomarker data yet
          </p>
          <p className="text-xs text-muted-foreground">
            Once your lab results are uploaded and processed, they will appear
            here grouped by category.
          </p>
        </div>
      )}

      {/* Categories */}
      {categories.map(([category, items]) => (
        <CategorySection
          key={category}
          category={category}
          items={items}
          onSelect={setSelected}
        />
      ))}

      {isFetching && !isLoading && (
        <p className="text-center text-xs text-muted-foreground font-semibold py-4">
          Refreshing…
        </p>
      )}

      <Dialog
        open={selected != null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold uppercase">
              {selected?.biomarkerName || selected?.canonicalName || "Biomarker"}
            </DialogTitle>
          </DialogHeader>
          {selected ? <BiomarkerDetailBody item={selected} /> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
