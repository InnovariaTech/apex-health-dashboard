// @ts-nocheck
import { useMemo, useState } from "react";
import {
  Camera,
  TrendingUp,
  Plus,
  Loader2,
  Trash2,
  AlertCircle,
  Check,
  Clock,
  Trophy,
  Image as ImageIcon,
  Target,
  ArrowUpRight,
  Pencil,
  ChevronDown,
} from "lucide-react";
import { format, parseISO, subDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import TrainerizeGate from "@/components/trainerize/TrainerizeGate";
import {
  useBodyStatsRange,
  useCreateBodyStats,
  useDeleteBodyStats,
  useUpdateBodyStats,
} from "@/hooks/trainerize/useBodyStats";
import { useTrainerizeUnits } from "@/hooks/trainerize/useLinkage";
import { useGoals } from "@/hooks/trainerize/useGoals";
import { usePhotos, usePhotoDetail } from "@/hooks/trainerize/usePhotos";
import { useAccomplishmentStats } from "@/hooks/trainerize/useAccomplishments";
import { useLatestPatientSummary } from "@/hooks/ai-agent/useaiSummary";
import {
  humanizeRecordType,
  type AccomplishmentStatRow,
} from "@/types/trainerize/accomplishments_types";
import type { BodyMeasures } from "@/types/trainerize/bodystats_types";
import {
  isNutritionGoal,
  isTextGoal,
  isWeightGoal,
  type Goal,
} from "@/types/trainerize/goals_types";
import { PHOTO_POSE_LABELS, toDataUrl } from "@/types/trainerize/photos_types";
import GoalDialog from "@/views/patient/components/progress/GoalDialog";
import DeleteGoalDialog from "@/views/patient/components/progress/DeleteGoalDialog";
import UpdateProgressDialog from "@/views/patient/components/progress/UpdateProgressDialog";
import UploadPhotoDialog from "@/views/patient/components/progress/UploadPhotoDialog";
import PhotoLightbox from "@/views/patient/components/progress/PhotoLightbox";

/**
 * Progress — redesigned to mirror the `New Ui/7 Progress` mockup.
 *
 * Layout:
 *   1. Hero: "TRANSFORMATION TRACKING" red pill + "My *progress*" title +
 *      subtitle + Upload photo button
 *   2. KPI tiles — Total weight change, Body fat change (the mockup's
 *      VO₂max + biomarker-improvement tiles are JSX-commented; no backend)
 *   3. Pill tabs — Photos & trend | Milestones | Measurements
 *   4. Photos & trend panel: trend chart (real bodyStats) + "Where you are
 *      now" snapshot + progress photos grid (real Trainerize photos)
 *   5. Milestones panel: Trainerize goals re-rendered as mockup milestones
 *   6. Measurements panel: existing CRUD list + Log/Edit dialog
 *   7. Transformation summary narrative (AI summary report.narrative)
 *
 * Backend wiring is unchanged: `useBodyStatsRange`, `useGoals`, `usePhotos`,
 * `useLatestPatientSummary`. Mockup sections without an API (PRs, before/
 * after slider, biomarker-improvement strip) are JSX-commented.
 */

// ─── Range presets ─────────────────────────────────────────────────────────

const RANGE_PRESETS = {
  "15d": { days: 15, label: "Last 15 days", cadence: 1 },
  "30d": { days: 30, label: "Last 30 days", cadence: 3 },
  "90d": { days: 90, label: "Last 90 days", cadence: 7 },
  "180d": { days: 180, label: "Last 180 days", cadence: 14 },
  "365d": { days: 365, label: "Last 365 days", cadence: 30 },
} as const;

type RangeKey = keyof typeof RANGE_PRESETS;
type TabKey = "photos" | "prs" | "ms" | "measurements";

const MEASURE_KEYS: { key: keyof BodyMeasures; label: string; unit: "weight" | "bodyFat" | "bodystat" }[] = [
  { key: "bodyWeight", label: "Weight", unit: "weight" },
  { key: "bodyFatPercent", label: "Body Fat %", unit: "bodyFat" },
  { key: "chest", label: "Chest", unit: "bodystat" },
  { key: "waist", label: "Waist", unit: "bodystat" },
  { key: "hips", label: "Hips", unit: "bodystat" },
  { key: "neck", label: "Neck", unit: "bodystat" },
  { key: "shoulders", label: "Shoulders", unit: "bodystat" },
  { key: "bicep", label: "Bicep", unit: "bodystat" },
  { key: "forearm", label: "Forearm", unit: "bodystat" },
  { key: "thigh", label: "Thigh", unit: "bodystat" },
  { key: "calf", label: "Calf", unit: "bodystat" },
];

const MEASUREMENT_KEY_SET = new Set<string>(MEASURE_KEYS.map((m) => String(m.key)));

const CARD_SHADOW =
  "0 1px 2px rgba(20,21,26,.04), 0 8px 24px rgba(20,21,26,.05)";

function hasAnyMeasurement(measures: BodyMeasures | null | undefined): boolean {
  if (!measures) return false;
  for (const k of MEASUREMENT_KEY_SET) {
    const v = (measures as Record<string, unknown>)[k];
    if (typeof v === "number" && !Number.isNaN(v)) return true;
  }
  return false;
}

function readWeight(measures: BodyMeasures | null | undefined): number | null {
  if (!measures) return null;
  const v = measures.bodyWeight ?? measures.weight;
  return typeof v === "number" ? v : null;
}

function readBodyFat(measures: BodyMeasures | null | undefined): number | null {
  if (!measures) return null;
  const v = measures.bodyFatPercent ?? measures.bodyFat;
  return typeof v === "number" ? v : null;
}

function datesForRange(rangeKey: RangeKey): string[] {
  const { days, cadence } = RANGE_PRESETS[rangeKey];
  const out: string[] = [];
  for (let i = 0; i <= days; i += cadence) {
    out.push(format(subDays(new Date(), i), "yyyy-MM-dd"));
  }
  return out.reverse();
}

interface SeriesPoint {
  date: string;
  weight: number | null;
  bodyFat: number | null;
  hasData: boolean;
  record: BodyMeasures | null;
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function Progress() {
  return (
    <TrainerizeGate>
      <ProgressInner />
    </TrainerizeGate>
  );
}

function ProgressInner() {
  const { unitWeight, unitBodystat } = useTrainerizeUnits();
  const [rangeKey, setRangeKey] = useState<RangeKey>("90d");
  const [tab, setTab] = useState<TabKey>("photos");
  const [uploadOpen, setUploadOpen] = useState(false);

  const dates = useMemo(() => datesForRange(rangeKey), [rangeKey]);
  const rangeQueries = useBodyStatsRange(dates);

  const series = useMemo<SeriesPoint[]>(() => {
    return dates.map((date, i) => {
      const q = rangeQueries[i];
      const record = q?.data?.bodyMeasures ?? null;
      return {
        date,
        weight: readWeight(record),
        bodyFat: readBodyFat(record),
        hasData: hasAnyMeasurement(record),
        record,
      };
    });
  }, [dates, rangeQueries]);

  const withData = series.filter((p) => p.hasData);
  const chartData = useMemo(
    () => series.filter((p) => p.weight != null || p.bodyFat != null),
    [series],
  );
  const isRangeLoading = rangeQueries.some((q) => q?.isLoading);

  const firstPoint = withData[0];
  const lastPoint = withData[withData.length - 1];
  const weightChange =
    lastPoint?.weight != null && firstPoint?.weight != null
      ? lastPoint.weight - firstPoint.weight
      : null;
  const bodyFatChange =
    lastPoint?.bodyFat != null && firstPoint?.bodyFat != null
      ? lastPoint.bodyFat - firstPoint.bodyFat
      : null;

  const [editing, setEditing] = useState<{
    date: string;
    measures: BodyMeasures;
  } | null>(null);
  const openLog = (date = format(new Date(), "yyyy-MM-dd"), measures: BodyMeasures = {}) => {
    setEditing({ date, measures });
  };

  return (
    <div className="p-4 md:p-9 max-w-[1500px] mx-auto bg-background text-foreground">
      {/* Breadcrumb */}
      <div
        className="mb-3"
        style={{ fontSize: 12.5, color: "var(--ink-3)", fontWeight: 500 }}
      >
        Apex Fit &nbsp;›&nbsp;{" "}
        <b style={{ color: "var(--ink)", fontWeight: 600 }}>Progress</b>
      </div>

      {/* Pill */}
      <div
        className="inline-flex items-center gap-2 uppercase"
        style={{
          background: "var(--apex-accent-soft)",
          color: "var(--apex-accent-bright)",
          fontSize: 11.5,
          fontWeight: 700,
          letterSpacing: "1.3px",
          padding: "7px 14px",
          borderRadius: 100,
        }}
      >
        <TrendingUp className="w-3.5 h-3.5" strokeWidth={2} />
        Transformation tracking
      </div>

      {/* Hero */}
      <div className="flex flex-wrap items-end justify-between gap-6 mt-5 mb-7">
        <div className="min-w-0">
          <h1 className="apex-page-title">
            My <em>progress</em>
          </h1>
          <p
            className="mt-3.5"
            style={{
              fontSize: 16.5,
              color: "var(--ink-2)",
              fontWeight: 500,
            }}
          >
            Track your transformation, body stats, and milestones.
          </p>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          {/* Export PDF — no export endpoint wired yet.
          <button
            type="button"
            className="inline-flex items-center gap-2"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              color: "var(--ink)",
              fontSize: 14,
              fontWeight: 600,
              padding: "12px 18px",
              borderRadius: 11,
              cursor: "pointer",
            }}
          >
            <FileText className="w-4 h-4" strokeWidth={1.8} />
            Export as PDF
          </button>
          */}
          <button
            type="button"
            onClick={() => {
              setTab("photos");
              setUploadOpen(true);
            }}
            className="inline-flex items-center gap-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{
              background: "var(--apex-accent-bright)",
              color: "#FFFFFF",
              border: "none",
              fontSize: 14,
              fontWeight: 600,
              padding: "12px 18px",
              borderRadius: 11,
              cursor: "pointer",
              boxShadow: "0 2px 10px rgba(225, 24, 22, 0.18)",
            }}
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            Upload progress photo
          </button>
        </div>
      </div>

      {/* Range select */}
      <div className="flex items-center gap-2 mb-4">
        <span
          className="uppercase"
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "1.2px",
            color: "var(--ink-3)",
          }}
        >
          Range
        </span>
        <RangeSelect rangeKey={rangeKey} onChange={setRangeKey} />
      </div>

      {/* KPI tiles — real wiring only (2 of mockup's 4). */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <KpiTile
          dot="#2862C0"
          label="Total weight change"
          value={
            weightChange == null
              ? "—"
              : `${weightChange > 0 ? "+" : ""}${weightChange.toFixed(1)}`
          }
          unit={weightChange != null ? unitWeight : ""}
          valueColor="#2862C0"
          badge={
            weightChange != null && firstPoint?.weight && firstPoint.weight > 0
              ? {
                  dir: weightChange < 0 ? "down" : "up",
                  text: `${Math.abs((weightChange / firstPoint.weight) * 100).toFixed(0)}%`,
                  bg: "#EAF1FB",
                  fg: "#2862C0",
                }
              : undefined
          }
          sub={
            firstPoint?.weight != null && lastPoint?.weight != null
              ? `${firstPoint.weight} → ${lastPoint.weight} ${unitWeight}`
              : "Log weight to see your delta"
          }
        />
        <KpiTile
          dot="#3E7C57"
          label="Body fat change"
          value={
            bodyFatChange == null
              ? "—"
              : `${bodyFatChange > 0 ? "+" : ""}${bodyFatChange.toFixed(1)}`
          }
          unit={bodyFatChange != null ? "%" : ""}
          valueColor="#2E7D52"
          badge={
            bodyFatChange != null && firstPoint?.bodyFat
              ? {
                  dir: bodyFatChange < 0 ? "down" : "up",
                  text: `${Math.abs((bodyFatChange / firstPoint.bodyFat) * 100).toFixed(0)}%`,
                  bg: "var(--opt-soft)",
                  fg: "var(--opt)",
                }
              : undefined
          }
          sub={
            firstPoint?.bodyFat != null && lastPoint?.bodyFat != null
              ? `${firstPoint.bodyFat}% → ${lastPoint.bodyFat}% body fat`
              : "Log body fat to see your delta"
          }
        />
        {/* Biomarker improvement KPI hidden — no "since baseline" delta in API.
        <KpiTile dot="#7C3AED" label="Biomarker improvement" … />
        */}
        {/* VO₂max KPI hidden — VO₂max not in bodyStats.
        <KpiTile dot="#B07A24" label="Activity level improvement" … />
        */}
      </div>

      {/* Tab pill control */}
      <PillTabs value={tab} onChange={setTab} />

      <div className="mt-6">
        {tab === "photos" && (
          <PhotosTrendPanel
            isRangeLoading={isRangeLoading}
            chartData={chartData}
            unitWeight={unitWeight}
            lastPoint={lastPoint}
            firstPoint={firstPoint}
            weightChange={weightChange}
            bodyFatChange={bodyFatChange}
            onLog={openLog}
            onUpload={() => setUploadOpen(true)}
          />
        )}
        {tab === "prs" && <PRsPanel />}
        {tab === "ms" && <MilestonesPanel />}
        {tab === "measurements" && (
          <MeasurementsPanel
            isRangeLoading={isRangeLoading}
            withData={withData}
            unitWeight={unitWeight}
            unitBodystat={unitBodystat}
            onLog={openLog}
          />
        )}
      </div>

      {/* Narrative — AI summary "overall" section */}
      <NarrativeCard />

      {editing && (
        <LogMeasurementDialog
          date={editing.date}
          initial={editing.measures}
          unitWeight={unitWeight}
          unitBodystat={unitBodystat}
          onClose={() => setEditing(null)}
        />
      )}

      <UploadPhotoDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
      />
    </div>
  );
}

// ─── Range select ─────────────────────────────────────────────────────────

function RangeSelect({
  rangeKey,
  onChange,
}: {
  rangeKey: RangeKey;
  onChange: (k: RangeKey) => void;
}) {
  return (
    <div
      className="inline-flex items-center gap-1"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: 10,
        padding: "4px 8px 4px 13px",
        fontSize: 14,
        fontWeight: 600,
        color: "var(--ink)",
      }}
    >
      <select
        value={rangeKey}
        onChange={(e) => onChange(e.target.value as RangeKey)}
        className="bg-transparent border-0 outline-none cursor-pointer pr-1"
        style={{ font: "inherit", color: "var(--ink)" }}
      >
        {(Object.keys(RANGE_PRESETS) as RangeKey[]).map((k) => (
          <option key={k} value={k}>
            {RANGE_PRESETS[k].label}
          </option>
        ))}
      </select>
      <ChevronDown className="w-3.5 h-3.5" style={{ color: "var(--ink-3)" }} />
    </div>
  );
}

// ─── KPI tile ─────────────────────────────────────────────────────────────

function KpiTile({
  dot,
  label,
  value,
  unit,
  valueColor,
  badge,
  sub,
}: {
  dot: string;
  label: string;
  value: string;
  unit: string;
  valueColor: string;
  badge?: { dir: "up" | "down"; text: string; bg: string; fg: string };
  sub: string;
}) {
  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: 16,
        padding: "20px 22px",
        boxShadow: CARD_SHADOW,
      }}
    >
      <div
        className="flex items-center gap-2 uppercase"
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.4px",
          color: "var(--ink-3)",
          paddingRight: 60,
          lineHeight: 1.3,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: dot,
            display: "inline-block",
          }}
        />
        {label}
      </div>
      <div
        className="flex items-baseline gap-2 mt-3.5"
        style={{
          fontSize: 34,
          fontWeight: 800,
          letterSpacing: "-1.3px",
          lineHeight: 1,
          color: valueColor,
        }}
      >
        {value}
        {unit && (
          <span
            style={{
              fontSize: 17,
              fontWeight: 700,
              letterSpacing: "-0.3px",
              color: "#3A3D43",
            }}
          >
            {unit}
          </span>
        )}
      </div>
      <p
        className="mt-2"
        style={{ fontSize: 13, color: "var(--ink-2)", fontWeight: 500 }}
      >
        {sub}
      </p>
      {badge && (
        <span
          className="absolute inline-flex items-center gap-1"
          style={{
            top: 18,
            right: 18,
            fontSize: 11.5,
            fontWeight: 700,
            padding: "4px 9px",
            borderRadius: 100,
            background: badge.bg,
            color: badge.fg,
          }}
        >
          {badge.dir === "up" ? "▲" : "▼"} {badge.text}
        </span>
      )}
    </div>
  );
}

// ─── Pill tabs ────────────────────────────────────────────────────────────

function PillTabs({
  value,
  onChange,
}: {
  value: TabKey;
  onChange: (v: TabKey) => void;
}) {
  return (
    <div
      className="inline-flex"
      style={{
        background: "#EDEDEF",
        padding: 5,
        borderRadius: 13,
        gap: 6,
      }}
    >
      <PillButton
        active={value === "photos"}
        onClick={() => onChange("photos")}
        icon={<ImageIcon className="w-4 h-4" strokeWidth={1.8} />}
      >
        Photos &amp; trend
      </PillButton>
      <PillButton
        active={value === "prs"}
        onClick={() => onChange("prs")}
        icon={<Trophy className="w-4 h-4" strokeWidth={1.8} />}
      >
        PRs
      </PillButton>
      <PillButton
        active={value === "ms"}
        onClick={() => onChange("ms")}
        icon={<Trophy className="w-4 h-4" strokeWidth={1.8} />}
      >
        Milestones
      </PillButton>
      <PillButton
        active={value === "measurements"}
        onClick={() => onChange("measurements")}
        icon={<Target className="w-4 h-4" strokeWidth={1.8} />}
      >
        Measurements
      </PillButton>
    </div>
  );
}

function PillButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      style={{
        padding: "9px 18px",
        borderRadius: 9,
        border: "none",
        background: active ? "var(--surface)" : "transparent",
        color: active ? "var(--ink)" : "#646A72",
        fontWeight: 600,
        fontSize: 14,
        cursor: "pointer",
        boxShadow: active ? "0 1px 2px rgba(20,21,26,.05)" : "none",
      }}
    >
      {icon}
      {children}
    </button>
  );
}

// ─── Photos & trend panel ────────────────────────────────────────────────

function PhotosTrendPanel({
  isRangeLoading,
  chartData,
  unitWeight,
  lastPoint,
  firstPoint,
  weightChange,
  bodyFatChange,
  onLog,
  onUpload,
}: {
  isRangeLoading: boolean;
  chartData: SeriesPoint[];
  unitWeight: string;
  lastPoint: SeriesPoint | undefined;
  firstPoint: SeriesPoint | undefined;
  weightChange: number | null;
  bodyFatChange: number | null;
  onLog: () => void;
  onUpload: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Biomarkers improving card hidden — no "since baseline" delta in API.
      <BiomarkersImprovingCard … />
      */}

      <div
        className="grid gap-5"
        style={{ gridTemplateColumns: "minmax(0,1.62fr) minmax(0,1fr)" }}
      >
        <TrendCard
          isLoading={isRangeLoading}
          data={chartData}
          unitWeight={unitWeight}
          onLog={onLog}
        />
        <SnapshotCard
          lastPoint={lastPoint}
          firstPoint={firstPoint}
          weightChange={weightChange}
          bodyFatChange={bodyFatChange}
          unitWeight={unitWeight}
        />
      </div>

      <PhotosGrid onUpload={onUpload} />

      {/* Before/after slider hidden — no documented "starting" vs "current" tags on photos.
      <CompareSlider photos={photos} />
      */}
    </div>
  );
}

// ─── Trend chart ─────────────────────────────────────────────────────────

function TrendCard({
  isLoading,
  data,
  unitWeight,
  onLog,
}: {
  isLoading: boolean;
  data: SeriesPoint[];
  unitWeight: string;
  onLog: () => void;
}) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: 18,
        padding: "22px 26px 20px",
        boxShadow: CARD_SHADOW,
      }}
    >
      <div className="flex items-center gap-2.5">
        <TrendingUp
          className="w-[18px] h-[18px]"
          strokeWidth={2}
          style={{ color: "var(--opt)" }}
        />
        <h3
          style={{
            fontSize: 17,
            fontWeight: 800,
            letterSpacing: "-0.4px",
            color: "var(--ink)",
          }}
        >
          Weight &amp; Body Fat Trend
        </h3>
      </div>
      <p
        style={{
          fontSize: 13,
          color: "var(--ink-2)",
          marginTop: 3,
          fontWeight: 500,
        }}
      >
        Body stats over the selected range
      </p>

      {isLoading ? (
        <div className="py-16 flex items-center justify-center">
          <Loader2
            className="w-7 h-7 animate-spin"
            style={{ color: "var(--ink-3)" }}
          />
        </div>
      ) : data.length === 0 ? (
        <div className="py-16 text-center">
          <ImageIcon
            className="w-12 h-12 mx-auto mb-3 opacity-30"
            strokeWidth={1.5}
          />
          <p style={{ fontWeight: 700, color: "var(--ink)" }}>
            No measurements in this range
          </p>
          <p
            className="mt-1 mb-4"
            style={{ fontSize: 13.5, color: "var(--ink-3)" }}
          >
            Log a weight or body fat reading to populate the chart.
          </p>
          <button
            type="button"
            onClick={onLog}
            className="inline-flex items-center gap-2"
            style={{
              background: "var(--apex-accent-bright)",
              color: "#fff",
              border: "none",
              padding: "10px 16px",
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 13.5,
              cursor: "pointer",
            }}
          >
            <Plus className="w-4 h-4" /> Log measurement
          </button>
        </div>
      ) : (
        <>
          <TrendSvg data={data} unitWeight={unitWeight} />
          <div
            className="flex justify-center gap-6 mt-1"
            style={{ fontSize: 13, color: "var(--ink-2)", fontWeight: 600 }}
          >
            <span className="flex items-center gap-2">
              <i
                style={{
                  width: 18,
                  height: 0,
                  borderTop: "3px solid #2F6FD6",
                  borderRadius: 3,
                  display: "inline-block",
                }}
              />
              Weight ({unitWeight})
            </span>
            <span className="flex items-center gap-2">
              <i
                style={{
                  width: 18,
                  height: 0,
                  borderTop: "3px dashed #E2883C",
                  borderRadius: 3,
                  display: "inline-block",
                }}
              />
              Body Fat %
            </span>
          </div>
        </>
      )}
    </div>
  );
}

function TrendSvg({
  data,
  unitWeight,
}: {
  data: SeriesPoint[];
  unitWeight: string;
}) {
  const W = 920;
  const H = 300;
  const X0 = 70;
  const X1 = 850;
  const Y0 = 20;
  const Y1 = 260;

  const weights = data
    .map((d) => d.weight)
    .filter((v): v is number => v != null);
  const bodyFats = data
    .map((d) => d.bodyFat)
    .filter((v): v is number => v != null);

  const wMin = weights.length ? Math.min(...weights) : 0;
  const wMax = weights.length ? Math.max(...weights) : 1;
  const bMin = bodyFats.length ? Math.min(...bodyFats) : 0;
  const bMax = bodyFats.length ? Math.max(...bodyFats) : 1;

  const ws = niceScale(wMin, wMax, 5);
  const bs = niceScale(bMin, bMax, 5);

  const n = data.length;
  const xPos = (i: number) =>
    n <= 1 ? (X0 + X1) / 2 : X0 + ((X1 - X0) * i) / (n - 1);
  const yW = (w: number) => Y1 - ((w - ws[0]) / (ws[1] - ws[0])) * (Y1 - Y0);
  const yB = (b: number) => Y1 - ((b - bs[0]) / (bs[1] - bs[0])) * (Y1 - Y0);

  const wPoints = data
    .map((d, i) => (d.weight != null ? `${xPos(i).toFixed(1)},${yW(d.weight).toFixed(1)}` : null))
    .filter(Boolean)
    .join(" ");
  const bPoints = data
    .map((d, i) => (d.bodyFat != null ? `${xPos(i).toFixed(1)},${yB(d.bodyFat).toFixed(1)}` : null))
    .filter(Boolean)
    .join(" ");

  const xTickIdx = Array.from({ length: Math.min(6, n) }, (_, i) =>
    Math.round((i * (n - 1)) / Math.max(1, Math.min(5, n - 1))),
  );

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto block mt-3.5"
      fontFamily="Inter, sans-serif"
    >
      {/* Gridlines */}
      <g stroke="#EDEEF0" strokeWidth={1}>
        {[0, 60, 120, 180, 240].map((dy) => (
          <line key={dy} x1={70} y1={20 + dy} x2={850} y2={20 + dy} />
        ))}
      </g>

      {/* Left axis (weight) */}
      <g fill="#9AA0A8" fontSize="12" textAnchor="end">
        {[0, 1, 2, 3, 4].map((i) => {
          const v = ws[0] + ((ws[1] - ws[0]) * (4 - i)) / 4;
          return (
            <text key={`yw-${i}`} x={60} y={24 + i * 60}>
              {Math.round(v)}
            </text>
          );
        })}
      </g>
      <text
        x={22}
        y={150}
        fill="#9AA0A8"
        fontSize="11"
        fontWeight="700"
        transform="rotate(-90 22 150)"
        textAnchor="middle"
        letterSpacing="1"
      >
        {unitWeight.toUpperCase()}
      </text>

      {/* Right axis (body fat) */}
      <g fill="#9AA0A8" fontSize="12" textAnchor="start">
        {[0, 1, 2, 3, 4].map((i) => {
          const v = bs[0] + ((bs[1] - bs[0]) * (4 - i)) / 4;
          return (
            <text key={`yb-${i}`} x={862} y={24 + i * 60}>
              {v.toFixed(0)}%
            </text>
          );
        })}
      </g>

      {/* X labels */}
      <g
        fill="#7C828B"
        fontSize="12.5"
        textAnchor="middle"
        fontWeight={500}
      >
        {xTickIdx.map((i, k) => {
          const d = data[i];
          if (!d) return null;
          let label = d.date;
          try {
            label = format(parseISO(d.date), "MMM d");
          } catch {}
          return (
            <text key={`x-${k}`} x={xPos(i)} y={284}>
              {label}
            </text>
          );
        })}
      </g>

      {/* Body fat (orange dashed) */}
      {bPoints && (
        <polyline
          points={bPoints}
          fill="none"
          stroke="#E2883C"
          strokeWidth={2.6}
          strokeDasharray="7 5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      <g fill="#E2883C">
        {data.map((d, i) => {
          if (d.bodyFat == null) return null;
          const isLast = i === data.length - 1;
          return (
            <circle
              key={`db-${i}`}
              cx={xPos(i)}
              cy={yB(d.bodyFat)}
              r={isLast ? 5.5 : 4.5}
              stroke={isLast ? "#fff" : undefined}
              strokeWidth={isLast ? 2 : undefined}
            />
          );
        })}
      </g>

      {/* Weight (blue solid) */}
      {wPoints && (
        <polyline
          points={wPoints}
          fill="none"
          stroke="#2F6FD6"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      <g fill="#2F6FD6">
        {data.map((d, i) => {
          if (d.weight == null) return null;
          const isLast = i === data.length - 1;
          return (
            <circle
              key={`dw-${i}`}
              cx={xPos(i)}
              cy={yW(d.weight)}
              r={isLast ? 6 : 5}
              stroke={isLast ? "#fff" : undefined}
              strokeWidth={isLast ? 2 : undefined}
            />
          );
        })}
      </g>
    </svg>
  );
}

function niceScale(min: number, max: number, _ticks: number): [number, number] {
  if (min === max) return [Math.floor(min - 5), Math.ceil(max + 5)];
  const range = max - min;
  const pad = Math.max(range * 0.15, 1);
  return [Math.floor(min - pad), Math.ceil(max + pad)];
}

// ─── Snapshot card ──────────────────────────────────────────────────────

function SnapshotCard({
  lastPoint,
  firstPoint,
  weightChange,
  bodyFatChange,
  unitWeight,
}: {
  lastPoint: SeriesPoint | undefined;
  firstPoint: SeriesPoint | undefined;
  weightChange: number | null;
  bodyFatChange: number | null;
  unitWeight: string;
}) {
  const latestLabel = lastPoint?.date
    ? `Latest check-in ${formatNice(lastPoint.date)}`
    : "No check-ins yet";
  const m = lastPoint?.record ?? {};

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: 18,
        padding: "24px 26px 26px",
        boxShadow: CARD_SHADOW,
      }}
    >
      <h3
        style={{
          fontSize: 17,
          fontWeight: 800,
          letterSpacing: "-0.4px",
          color: "var(--ink)",
        }}
      >
        Where you are now
      </h3>
      <p
        style={{
          fontSize: 13,
          color: "var(--ink-2)",
          marginTop: 3,
          fontWeight: 500,
        }}
      >
        {latestLabel}
      </p>

      <div className="mt-2">
        <SnapshotRow
          tint="#EAF1FB"
          color="#2862C0"
          icon={<Target className="w-4 h-4" strokeWidth={1.9} />}
          label="Weight"
          value={
            lastPoint?.weight != null ? `${lastPoint.weight} ${unitWeight}` : "—"
          }
          delta={
            weightChange != null
              ? `${weightChange < 0 ? "↓" : "↑"} ${Math.abs(weightChange).toFixed(1)}`
              : null
          }
          deltaTone={weightChange == null ? "neutral" : weightChange < 0 ? "good" : "bad"}
        />
        <SnapshotRow
          tint="var(--opt-soft)"
          color="var(--opt)"
          icon={<Target className="w-4 h-4" strokeWidth={1.9} />}
          label="Body fat"
          value={lastPoint?.bodyFat != null ? `${lastPoint.bodyFat}%` : "—"}
          delta={
            bodyFatChange != null
              ? `${bodyFatChange < 0 ? "↓" : "↑"} ${Math.abs(bodyFatChange).toFixed(1)}`
              : null
          }
          deltaTone={bodyFatChange == null ? "neutral" : bodyFatChange < 0 ? "good" : "bad"}
        />
        {typeof m?.chest === "number" && (
          <SnapshotRow
            tint="var(--apex-accent-soft)"
            color="var(--apex-accent-bright)"
            icon={<Target className="w-4 h-4" strokeWidth={1.9} />}
            label="Chest"
            value={`${m.chest}`}
          />
        )}
        {typeof m?.waist === "number" && (
          <SnapshotRow
            tint="var(--bord-soft)"
            color="var(--bord)"
            icon={<Target className="w-4 h-4" strokeWidth={1.9} />}
            label="Waist"
            value={`${m.waist}`}
          />
        )}
        {typeof m?.hips === "number" && (
          <SnapshotRow
            tint="#F1ECFD"
            color="#7C3AED"
            icon={<Target className="w-4 h-4" strokeWidth={1.9} />}
            label="Hips"
            value={`${m.hips}`}
          />
        )}
      </div>

      {/* Goal weight progress strip — only rendered if there's a weightGoal */}
      <WeightGoalStrip currentWeight={lastPoint?.weight ?? null} unitWeight={unitWeight} />
    </div>
  );
}

function SnapshotRow({
  tint,
  color,
  icon,
  label,
  value,
  delta,
  deltaTone,
}: {
  tint: string;
  color: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  delta?: string | null;
  deltaTone?: "good" | "bad" | "neutral";
}) {
  const deltaColor =
    deltaTone === "good"
      ? "var(--opt)"
      : deltaTone === "bad"
        ? "var(--apex-accent-bright)"
        : "var(--ink-3)";
  return (
    <div
      className="flex items-center justify-between"
      style={{
        padding: "15px 0",
        borderBottom: "1px solid var(--line)",
      }}
    >
      <div
        className="flex items-center gap-2.5"
        style={{ fontSize: 14, color: "var(--ink-2)", fontWeight: 500 }}
      >
        <span
          className="grid place-items-center"
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: tint,
            color,
          }}
        >
          {icon}
        </span>
        {label}
      </div>
      <div className="text-right">
        <b
          style={{
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: "-0.4px",
            color: "var(--ink)",
          }}
        >
          {value}
        </b>
        {delta && (
          <span
            className="ml-2"
            style={{ fontSize: 12, fontWeight: 700, color: deltaColor }}
          >
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}

function WeightGoalStrip({
  currentWeight,
  unitWeight,
}: {
  currentWeight: number | null;
  unitWeight: string;
}) {
  const goals = useGoals(false, 0, 25);
  const weightGoal = useMemo(() => {
    const list = goals.data?.goals ?? [];
    for (const g of list) if (isWeightGoal(g) && typeof g.weightGoal === "number") return g;
    return null;
  }, [goals.data]);

  if (!weightGoal || currentWeight == null || typeof weightGoal.weightGoal !== "number") {
    return null;
  }
  const start = weightGoal.startWeight ?? currentWeight;
  const target = weightGoal.weightGoal;
  const total = Math.abs(start - target);
  const done = Math.abs(start - currentWeight);
  const pct = total > 0 ? Math.max(0, Math.min(100, (done / total) * 100)) : 0;
  const remaining = Math.abs(currentWeight - target).toFixed(1);

  return (
    <div
      className="mt-4"
      style={{
        background: "#F7F8F9",
        border: "1px solid var(--line)",
        borderRadius: 13,
        padding: "16px 18px",
      }}
    >
      <div
        className="flex items-center justify-between"
        style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink-2)" }}
      >
        <span>Goal weight progress</span>
        <b style={{ fontWeight: 800, color: "var(--ink)" }}>{pct.toFixed(0)}%</b>
      </div>
      <div
        className="mt-3 overflow-hidden"
        style={{
          height: 9,
          background: "#E6E8EB",
          borderRadius: 100,
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: "linear-gradient(90deg,#3E7C57,#52A375)",
            borderRadius: 100,
          }}
        />
      </div>
      <p
        className="mt-2.5"
        style={{ fontSize: 12.5, color: "var(--ink-3)", fontWeight: 500 }}
      >
        {remaining} {unitWeight} to reach your {target} {unitWeight} goal.
      </p>
    </div>
  );
}

function formatNice(date: string): string {
  try {
    return format(parseISO(date), "MMM d, yyyy");
  } catch {
    return date;
  }
}

// ─── Photos grid ─────────────────────────────────────────────────────────

function PhotosGrid({ onUpload }: { onUpload: () => void }) {
  const [lightboxed, setLightboxed] = useState<any | null>(null);
  const today = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const startDate = useMemo(
    () => format(subDays(new Date(), 365), "yyyy-MM-dd"),
    [],
  );
  const { data, isLoading, isError } = usePhotos(startDate, today);
  const photos = data?.photos ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2
          style={{
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: "-0.7px",
            color: "var(--ink)",
          }}
        >
          Progress Photos{" "}
          <span style={{ color: "var(--ink-3)", fontWeight: 700 }}>
            ({photos.length})
          </span>
        </h2>
        <button
          type="button"
          onClick={onUpload}
          className="inline-flex items-center gap-2"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            color: "var(--ink)",
            padding: "10px 16px",
            borderRadius: 11,
            fontWeight: 600,
            fontSize: 13.5,
            cursor: "pointer",
          }}
        >
          <Plus className="w-4 h-4" strokeWidth={1.9} />
          Add photo
        </button>
      </div>

      {isLoading ? (
        <div
          className="py-12 flex items-center justify-center"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: 18,
            boxShadow: CARD_SHADOW,
          }}
        >
          <Loader2 className="w-7 h-7 animate-spin text-mute" />
        </div>
      ) : isError ? (
        <div
          className="py-8 px-5 flex items-start gap-3"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: 18,
            color: "var(--apex-accent-bright)",
          }}
        >
          <AlertCircle className="w-5 h-5 mt-0.5" />
          <span>Couldn't load photos.</span>
        </div>
      ) : photos.length === 0 ? (
        <div
          className="text-center"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: 18,
            padding: "48px 28px",
            boxShadow: CARD_SHADOW,
          }}
        >
          <Camera
            className="w-10 h-10 mx-auto mb-3 opacity-30"
            strokeWidth={1.5}
          />
          <p style={{ fontWeight: 700, color: "var(--ink)" }}>
            No progress photos yet
          </p>
          <p
            className="mt-1"
            style={{ fontSize: 13.5, color: "var(--ink-3)" }}
          >
            Upload one to start tracking your transformation.
          </p>
        </div>
      ) : (
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}
        >
          {photos.map((p) => (
            <PhotoThumb
              key={p.id ?? `${p.date}-${p.pose}`}
              photo={p}
              onOpen={() => setLightboxed(p)}
            />
          ))}
        </div>
      )}

      <PhotoLightbox photo={lightboxed} onClose={() => setLightboxed(null)} />
    </div>
  );
}

/**
 * A single progress-photo tile. The list endpoint returns only
 * `{id, date, pose}` (no binary), so each tile lazily fetches its own image
 * via `GET /me/photos/detail?thumbnail=false` (full resolution — kept crisp,
 * not the low-res thumbnail). Shows a spinner while loading and a pose
 * placeholder if the download fails — never a broken image.
 */
function PhotoThumb({ photo, onOpen }: { photo: any; onOpen: () => void }) {
  const detail = usePhotoDetail(photo?.id, false, true);
  const src = detail.data ? toDataUrl(detail.data) : null;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="relative overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      style={{
        borderRadius: 16,
        border: "1px solid var(--line)",
        boxShadow: CARD_SHADOW,
        background: "#202226",
        aspectRatio: "251/333",
        cursor: "pointer",
      }}
    >
      {src ? (
        <img
          src={src}
          alt={`${PHOTO_POSE_LABELS[photo.pose] ?? photo.pose ?? ""} · ${photo.date ?? ""}`}
          className="w-full h-full object-cover block"
        />
      ) : detail.isLoading ? (
        <div className="w-full h-full flex items-center justify-center">
          <Loader2
            className="w-6 h-6 animate-spin"
            style={{ color: "rgba(255,255,255,.6)" }}
          />
        </div>
      ) : (
        <div
          className="w-full h-full flex flex-col items-center justify-center"
          style={{ color: "rgba(255,255,255,.72)" }}
        >
          <Camera className="w-7 h-7 mb-2" strokeWidth={1.4} />
          <p style={{ fontSize: 11, letterSpacing: "0.6px" }}>
            {PHOTO_POSE_LABELS[photo.pose] ?? photo.pose ?? "Photo"}
          </p>
        </div>
      )}
      <span
        className="absolute uppercase"
        style={{
          bottom: 10,
          left: 10,
          background: "rgba(0,0,0,.55)",
          color: "#fff",
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: "0.7px",
          padding: "5px 10px",
          borderRadius: 100,
          backdropFilter: "blur(4px)",
        }}
      >
        {photo.date ? formatNice(photo.date) : "—"}
      </span>
    </button>
  );
}

// ─── PRs panel (Trainerize accomplishment stats → personal records) ──────

/**
 * Personal records — backed by `GET /me/accomplishments/stats?category=
 * workoutBrokenRecord` (see `docs/accomplishments-stats-api.md`). Groups the
 * flat stat rows by exercise so the same lift's `maxLoad` / `maxWeight` /
 * `tenRepMax` rows sit together, newest PR first.
 */
function PRsPanel() {
  const { data, isLoading, isError, error } = useAccomplishmentStats(
    "workoutBrokenRecord",
    0,
    50,
  );

  const groups = useMemo(() => groupByExercise(data?.stats ?? []), [data]);
  const total = data?.total ?? 0;

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: 18,
        boxShadow: CARD_SHADOW,
      }}
    >
      <div
        className="flex items-center justify-between"
        style={{ padding: "22px 26px 0" }}
      >
        <div>
          <h2
            className="flex items-center gap-2.5"
            style={{
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: "-0.5px",
              color: "var(--ink)",
            }}
          >
            <Trophy
              className="w-[19px] h-[19px]"
              strokeWidth={1.8}
              style={{ color: "var(--apex-accent-bright)" }}
            />
            Personal records
          </h2>
          <p
            style={{
              fontSize: 13,
              color: "var(--ink-3)",
              fontWeight: 500,
              marginTop: 3,
            }}
          >
            {isLoading
              ? "Loading your bests…"
              : total === 0
                ? "Set a new best in a workout to start your PR board"
                : `${groups.length} exercise${groups.length === 1 ? "" : "s"} · ${total} record${total === 1 ? "" : "s"}`}
          </p>
        </div>
      </div>

      <div style={{ padding: "14px 26px 24px" }}>
        {isLoading ? (
          <div className="py-12 flex items-center justify-center">
            <Loader2 className="w-7 h-7 animate-spin text-mute" />
          </div>
        ) : isError ? (
          <div className="py-6 flex items-start gap-3 text-destructive">
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <span>
              Couldn&apos;t load personal records
              {(error as { message?: string } | undefined)?.message
                ? ` — ${(error as { message?: string }).message}`
                : "."}
            </span>
          </div>
        ) : groups.length === 0 ? (
          <div className="py-10 text-center">
            <Trophy
              className="w-10 h-10 mx-auto mb-3 opacity-30"
              strokeWidth={1.5}
            />
            <p style={{ fontWeight: 700, color: "var(--ink)" }}>
              No personal records yet
            </p>
            <p
              className="mt-1"
              style={{ fontSize: 13.5, color: "var(--ink-3)" }}
            >
              Log a workout in the Apex Fit app — when you beat a previous best
              it shows up here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {groups.map((g) => (
              <PRCard key={g.exerciseID} group={g} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface PRGroup {
  exerciseID: number;
  exerciseName: string;
  recordType: string;
  latestDate: string;
  rows: AccomplishmentStatRow[];
}

function groupByExercise(rows: AccomplishmentStatRow[]): PRGroup[] {
  const byId = new Map<number, PRGroup>();
  for (const row of rows) {
    const id = row.data?.exerciseID ?? row.accomplishmentID;
    const existing = byId.get(id);
    if (existing) {
      existing.rows.push(row);
      if (row.itemDate > existing.latestDate) existing.latestDate = row.itemDate;
    } else {
      byId.set(id, {
        exerciseID: id,
        exerciseName: row.data?.exerciseName ?? "Exercise",
        recordType: row.data?.recordType ?? "",
        latestDate: row.itemDate,
        rows: [row],
      });
    }
  }
  // Newest PR first.
  return [...byId.values()].sort((a, b) =>
    a.latestDate < b.latestDate ? 1 : a.latestDate > b.latestDate ? -1 : 0,
  );
}

function PRCard({ group }: { group: PRGroup }) {
  return (
    <div
      style={{
        border: "1px solid var(--line)",
        borderRadius: 14,
        padding: "18px 20px",
        background: "var(--surface)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <b
            style={{
              fontSize: 15.5,
              fontWeight: 800,
              letterSpacing: "-0.3px",
              color: "var(--ink)",
              display: "block",
            }}
          >
            {group.exerciseName}
          </b>
          {group.recordType && (
            <span
              className="uppercase"
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: "0.6px",
                color: "var(--ink-3)",
              }}
            >
              {group.recordType}
            </span>
          )}
        </div>
        <span
          className="inline-flex items-center gap-1.5 flex-none"
          style={{
            fontSize: 11,
            fontWeight: 700,
            padding: "4px 10px",
            borderRadius: 100,
            background: "var(--apex-accent-soft)",
            color: "var(--apex-accent-bright)",
          }}
        >
          <Trophy className="w-3 h-3" strokeWidth={2} />
          PR
        </span>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {group.rows.map((row) => (
          <PRStatRow key={row.accomplishmentID} row={row} />
        ))}
      </div>

      <p
        className="mt-3"
        style={{ fontSize: 11.5, color: "var(--ink-3)", fontWeight: 500 }}
      >
        Last set {formatPrDate(group.latestDate)}
      </p>
    </div>
  );
}

function PRStatRow({ row }: { row: AccomplishmentStatRow }) {
  const d = row.data;
  const improved = typeof d?.dataChange === "number" && d.dataChange > 0;
  return (
    <div
      className="flex items-center justify-between gap-3"
      style={{
        padding: "10px 12px",
        borderRadius: 10,
        background: "#F7F8F9",
      }}
    >
      <span
        style={{ fontSize: 13, color: "var(--ink-2)", fontWeight: 600 }}
      >
        {humanizeRecordType(d?.brokenRecordType ?? row.type)}
      </span>
      <span className="flex items-baseline gap-2">
        <b
          style={{
            fontSize: 17,
            fontWeight: 800,
            letterSpacing: "-0.4px",
            color: "var(--ink)",
          }}
        >
          {formatPrValue(d?.data)}
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--ink-3)",
              marginLeft: 3,
            }}
          >
            {d?.unit ?? ""}
          </span>
        </b>
        {improved && (
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              color: "var(--opt)",
            }}
          >
            +{formatPrValue(d.dataChange)} {d?.unit ?? ""}
          </span>
        )}
      </span>
    </div>
  );
}

function formatPrValue(v: number | undefined | null): string {
  if (typeof v !== "number" || Number.isNaN(v)) return "—";
  return Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/\.?0+$/, "");
}

function formatPrDate(itemDate: string): string {
  // itemDate is "YYYY-MM-DD HH:MM:SS" (UTC) — parse the date half.
  try {
    const datePart = itemDate.split(" ")[0];
    return format(parseISO(datePart), "MMM d, yyyy");
  } catch {
    return itemDate;
  }
}

// ─── Milestones panel (Trainerize goals → mockup milestone list) ─────────

function MilestonesPanel() {
  const active = useGoals(false, 0, 50);
  const achieved = useGoals(true, 0, 50);

  const items = useMemo(() => {
    const out: Array<{ goal: Goal; done: boolean }> = [];
    for (const g of achieved.data?.goals ?? []) out.push({ goal: g, done: true });
    for (const g of active.data?.goals ?? []) out.push({ goal: g, done: false });
    return out;
  }, [active.data, achieved.data]);

  const completed = items.filter((x) => x.done).length;
  const total = items.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isLoading = active.isLoading || achieved.isLoading;
  const isError = active.isError || achieved.isError;

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [deleting, setDeleting] = useState<Goal | null>(null);

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: 18,
        boxShadow: CARD_SHADOW,
      }}
    >
      <div
        className="flex items-center justify-between"
        style={{ padding: "22px 26px 0" }}
      >
        <div>
          <h2
            className="flex items-center gap-2.5"
            style={{
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: "-0.5px",
              color: "var(--ink)",
            }}
          >
            <Trophy
              className="w-[19px] h-[19px]"
              strokeWidth={1.8}
              style={{ color: "var(--apex-accent-bright)" }}
            />
            Milestones
          </h2>
          <p
            style={{
              fontSize: 13,
              color: "var(--ink-3)",
              fontWeight: 500,
              marginTop: 3,
            }}
          >
            {isLoading
              ? "Loading goals…"
              : total === 0
                ? "Add a goal to start tracking milestones"
                : `${completed} of ${total} goal${total === 1 ? "" : "s"} completed`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {total > 0 && (
            <div
              className="flex items-center gap-1.5"
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--opt)",
              }}
            >
              <Check className="w-4 h-4" strokeWidth={2} />
              {pct}% complete
            </div>
          )}
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-2"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              color: "var(--ink)",
              padding: "8px 14px",
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
      </div>

      <div style={{ padding: "10px 26px 24px" }}>
        {isLoading ? (
          <div className="py-12 flex items-center justify-center">
            <Loader2 className="w-7 h-7 animate-spin text-mute" />
          </div>
        ) : isError ? (
          <div className="py-6 flex items-start gap-3 text-destructive">
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <span>Couldn't load milestones.</span>
          </div>
        ) : items.length === 0 ? (
          <div className="py-10 text-center">
            <Trophy
              className="w-10 h-10 mx-auto mb-3 opacity-30"
              strokeWidth={1.5}
            />
            <p style={{ fontWeight: 700, color: "var(--ink)" }}>
              No milestones yet
            </p>
            <p
              className="mt-1"
              style={{ fontSize: 13.5, color: "var(--ink-3)" }}
            >
              Add a goal to track milestones on your transformation.
            </p>
          </div>
        ) : (
          items.map((it, i) => (
            <MilestoneRow
              key={`${it.goal.id}-${i}`}
              goal={it.goal}
              done={it.done}
              onEdit={() => setEditing(it.goal)}
              onDelete={() => setDeleting(it.goal)}
            />
          ))
        )}
      </div>

      {adding && (
        <GoalDialog open mode="create" onClose={() => setAdding(false)} />
      )}
      {editing && (
        <GoalDialog
          open
          mode="edit"
          goal={editing}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting && (
        <DeleteGoalDialog
          goal={deleting}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}

function MilestoneRow({
  goal,
  done,
  onEdit,
  onDelete,
}: {
  goal: Goal;
  done: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const name = milestoneName(goal);
  const desc = milestoneDesc(goal);
  const status = done ? "Completed" : "In progress";
  return (
    <div
      className="flex items-center gap-4"
      style={{
        padding: "16px 0",
        borderBottom: "1px solid var(--line)",
      }}
    >
      <span
        className="grid place-items-center"
        style={{
          width: 30,
          height: 30,
          borderRadius: "50%",
          background: done ? "var(--opt)" : "#EDEDEF",
          color: done ? "#fff" : "#9AA0A8",
          border: done ? "none" : "1.5px dashed #C4C8CD",
          flex: "0 0 30px",
        }}
      >
        {done ? (
          <Check className="w-4 h-4" strokeWidth={2.4} />
        ) : (
          <Clock className="w-4 h-4" strokeWidth={2.2} />
        )}
      </span>
      <div className="flex-1 min-w-0">
        <b
          style={{
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: "-0.2px",
            color: done ? "var(--ink)" : "#7A808A",
          }}
        >
          {name}
        </b>
        {desc && (
          <p
            className="mt-1"
            style={{ fontSize: 12.5, color: "var(--ink-3)", fontWeight: 500 }}
          >
            {desc}
          </p>
        )}
      </div>
      <span
        style={{
          fontSize: 12,
          fontWeight: 700,
          padding: "5px 11px",
          borderRadius: 100,
          background: done ? "var(--opt-soft)" : "#F1F2F4",
          color: done ? "var(--opt)" : "#8A9099",
        }}
      >
        {status}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onEdit}
          className="grid place-items-center hover:bg-secondary/40 rounded-md"
          style={{
            width: 30,
            height: 30,
            color: "var(--ink-3)",
            cursor: "pointer",
          }}
          title="Edit"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="grid place-items-center hover:bg-destructive/10 rounded-md"
          style={{
            width: 30,
            height: 30,
            color: "var(--ink-3)",
            cursor: "pointer",
          }}
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function milestoneName(goal: Goal): string {
  if (isTextGoal(goal)) return goal.text ?? "Custom goal";
  if (isWeightGoal(goal)) {
    if (typeof goal.weightGoal === "number") {
      return `Reach ${goal.weightGoal} ${goal.unitWeight ?? "lb"}`;
    }
    return "Weight goal";
  }
  if (isNutritionGoal(goal)) {
    if (typeof goal.caloricGoal === "number") {
      return `Hit ${goal.caloricGoal.toLocaleString()} kcal/day`;
    }
    return "Nutrition goal";
  }
  return "Goal";
}

function milestoneDesc(goal: Goal): string | null {
  if (isWeightGoal(goal)) {
    const parts: string[] = [];
    if (typeof goal.startWeight === "number")
      parts.push(`Start ${goal.startWeight} ${goal.unitWeight ?? "lb"}`);
    if (typeof goal.currentWeight === "number")
      parts.push(`Now ${goal.currentWeight} ${goal.unitWeight ?? "lb"}`);
    if (typeof goal.weeklyWeightGoal === "number")
      parts.push(`${goal.weeklyWeightGoal} ${goal.unitWeight ?? "lb"} / week`);
    return parts.length ? parts.join(" · ") : null;
  }
  if (isNutritionGoal(goal)) {
    const parts: string[] = [];
    if (typeof goal.proteinGrams === "number")
      parts.push(`P ${goal.proteinGrams}g`);
    if (typeof goal.carbsGrams === "number") parts.push(`C ${goal.carbsGrams}g`);
    if (typeof goal.fatGrams === "number") parts.push(`F ${goal.fatGrams}g`);
    return parts.length ? parts.join(" · ") : null;
  }
  return null;
}

// ─── Measurements panel (existing CRUD) ──────────────────────────────────

function MeasurementsPanel({
  isRangeLoading,
  withData,
  unitWeight,
  unitBodystat,
  onLog,
}: {
  isRangeLoading: boolean;
  withData: SeriesPoint[];
  unitWeight: string;
  unitBodystat: string;
  onLog: (date?: string, measures?: BodyMeasures) => void;
}) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: 18,
        boxShadow: CARD_SHADOW,
      }}
    >
      <div
        className="flex items-center justify-between"
        style={{ padding: "22px 26px 0" }}
      >
        <div>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: "-0.5px",
              color: "var(--ink)",
            }}
          >
            Measurements
          </h2>
          <p
            style={{
              fontSize: 13,
              color: "var(--ink-3)",
              fontWeight: 500,
              marginTop: 3,
            }}
          >
            {withData.length === 0
              ? "No measurements logged yet"
              : `${withData.length} record${withData.length === 1 ? "" : "s"} in this range`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onLog()}
          className="inline-flex items-center gap-2"
          style={{
            background: "var(--apex-accent-bright)",
            color: "#fff",
            border: "none",
            padding: "10px 16px",
            borderRadius: 10,
            fontWeight: 600,
            fontSize: 13.5,
            cursor: "pointer",
          }}
        >
          <Plus className="w-4 h-4" strokeWidth={2} /> Log measurement
        </button>
      </div>

      <div style={{ padding: "10px 26px 24px" }}>
        {isRangeLoading ? (
          <div className="py-10 flex items-center justify-center">
            <Loader2 className="w-7 h-7 animate-spin text-mute" />
          </div>
        ) : withData.length === 0 ? (
          <div className="py-10 text-center">
            <Target
              className="w-10 h-10 mx-auto mb-3 opacity-30"
              strokeWidth={1.5}
            />
            <p style={{ fontWeight: 700, color: "var(--ink)" }}>
              Nothing here yet
            </p>
            <p
              className="mt-1"
              style={{ fontSize: 13.5, color: "var(--ink-3)" }}
            >
              Log a measurement to populate this list.
            </p>
          </div>
        ) : (
          [...withData].reverse().map((p) => (
            <MeasurementCard
              key={p.date}
              date={p.date}
              measures={p.record ?? {}}
              unitWeight={unitWeight}
              unitBodystat={unitBodystat}
              onEdit={() => onLog(p.date, p.record ?? {})}
            />
          ))
        )}
      </div>
    </div>
  );
}

function MeasurementCard({
  date,
  measures,
  unitWeight,
  unitBodystat,
  onEdit,
}: {
  date: string;
  measures: BodyMeasures;
  unitWeight: string;
  unitBodystat: string;
  onEdit: () => void;
}) {
  const deleteStats = useDeleteBodyStats();
  const handleDelete = async () => {
    if (!confirm(`Delete the measurement for ${date}?`)) return;
    try {
      await deleteStats.mutateAsync({ date });
      toast({ title: "Measurement deleted", description: date });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Could not delete",
        description: err?.message ?? "Try again later.",
      });
    }
  };

  const entries = Object.entries(measures).filter(
    ([k, v]) => MEASUREMENT_KEY_SET.has(k) && typeof v === "number",
  );

  return (
    <div
      style={{
        padding: "18px 0",
        borderBottom: "1px solid var(--line)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <p
          style={{
            fontWeight: 700,
            fontSize: 15.5,
            letterSpacing: "-0.3px",
            color: "var(--ink)",
          }}
        >
          {format(parseISO(date), "EEEE, MMM d, yyyy")}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: 9,
              padding: "6px 11px",
              fontSize: 12.5,
              fontWeight: 600,
              color: "var(--ink-2)",
              cursor: "pointer",
            }}
          >
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={deleteStats.isPending}
            className="grid place-items-center"
            style={{
              width: 30,
              height: 30,
              borderRadius: 9,
              border: "1px solid var(--line)",
              background: "var(--surface)",
              color: "var(--apex-accent-bright)",
              cursor: "pointer",
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {entries.length === 0 ? (
        <p
          style={{
            fontSize: 12,
            color: "var(--ink-3)",
          }}
        >
          No values recorded for this date.
        </p>
      ) : (
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))" }}
        >
          {entries.map(([key, value]) => {
            const meta = MEASURE_KEYS.find((m) => m.key === key);
            const unit =
              meta?.unit === "weight"
                ? unitWeight
                : meta?.unit === "bodyFat"
                  ? "%"
                  : unitBodystat;
            return (
              <div key={key}>
                <p
                  className="uppercase"
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.6px",
                    color: "var(--ink-3)",
                  }}
                >
                  {meta?.label ?? key}
                </p>
                <p
                  className="mt-1"
                  style={{
                    fontWeight: 800,
                    fontSize: 16,
                    letterSpacing: "-0.3px",
                    color: "var(--ink)",
                  }}
                >
                  {value}{" "}
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--ink-3)",
                    }}
                  >
                    {unit}
                  </span>
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Narrative card (AI summary) ─────────────────────────────────────────

function NarrativeCard() {
  const { data, isLoading, isError } = useLatestPatientSummary();
  const report = data?.report ?? null;
  const overall = report?.narrative?.sections?.find((s) => s.id === "overall");

  if (isLoading || isError || !overall) return null;

  const status = overall.status;
  const statusBg =
    status.tone === "opt"
      ? "var(--opt-soft)"
      : status.tone === "bord"
        ? "var(--bord-soft)"
        : "var(--att-soft)";
  const statusFg =
    status.tone === "opt"
      ? "var(--opt)"
      : status.tone === "bord"
        ? "var(--bord)"
        : "var(--att)";

  return (
    <div
      className="mt-7"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: 18,
        padding: "26px 30px 30px",
        boxShadow: CARD_SHADOW,
      }}
    >
      <div className="flex items-center justify-between">
        <div
          className="flex items-center gap-2.5 uppercase"
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "1.4px",
            color: "var(--apex-accent-bright)",
          }}
        >
          <Trophy className="w-4 h-4" strokeWidth={1.8} />
          Transformation summary
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--ink-3)",
            fontWeight: 500,
          }}
        >
          Generated by ApexAI
        </div>
      </div>

      <div
        className="flex items-center gap-2.5 mt-4"
        style={{
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: "-0.015em",
          color: "var(--apex-accent-dark)",
        }}
      >
        <TrendingUp className="w-5 h-5" strokeWidth={1.8} />
        {overall.title}
        <span
          className="ml-auto inline-flex items-center gap-1.5 uppercase"
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            letterSpacing: "0.6px",
            padding: "6px 13px",
            borderRadius: 100,
            background: statusBg,
            color: statusFg,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: statusFg,
            }}
          />
          {status.label}
        </span>
      </div>

      <p
        className="mt-3.5"
        style={{
          fontSize: 15,
          lineHeight: 1.66,
          color: "#3C4149",
          fontWeight: 450,
        }}
      >
        {overall.paragraph}
      </p>
    </div>
  );
}

// ─── Log measurement dialog (unchanged shape) ────────────────────────────

function LogMeasurementDialog({
  date: initialDate,
  initial,
  unitWeight,
  unitBodystat,
  onClose,
}: {
  date: string;
  initial: BodyMeasures;
  unitWeight: string;
  unitBodystat: string;
  onClose: () => void;
}) {
  const [date, setDate] = useState(initialDate);
  const [values, setValues] = useState<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(initial)) {
      if (typeof v === "number") out[k] = String(v);
    }
    return out;
  });
  const [error, setError] = useState("");

  const create = useCreateBodyStats();
  const update = useUpdateBodyStats();
  const isUpdating = Object.keys(initial).length > 0;
  const isPending = create.isPending || update.isPending;

  const setField = (k: string, v: string) =>
    setValues((prev) => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    setError("");
    const measures: BodyMeasures = {};
    for (const [k, v] of Object.entries(values)) {
      const num = Number(v);
      if (v !== "" && !Number.isNaN(num)) measures[k] = num;
    }
    if (Object.keys(measures).length === 0) {
      setError("Enter at least one measurement before saving.");
      return;
    }
    try {
      if (!isUpdating) {
        try {
          await create.mutateAsync({ date, status: "recorded" });
        } catch (err: any) {
          if (!/exists|already/i.test(err?.message ?? "")) throw err;
        }
      }
      await update.mutateAsync({
        date,
        unitWeight: unitWeight as any,
        unitBodystats: unitBodystat as any,
        bodyMeasures: measures,
      });
      toast({
        title: isUpdating ? "Measurement updated" : "Measurement saved",
        description: date,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message ?? "Save failed.");
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isUpdating ? "Edit measurement" : "Log measurement"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Weights in {unitWeight}, body measurements in {unitBodystat}.
          </p>
        </DialogHeader>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-md border text-sm border-destructive/30 bg-destructive/5 text-destructive">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4 py-2">
          <div>
            <label className="apex-eyebrow block mb-1.5">Date</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={isUpdating}
              max={format(new Date(), "yyyy-MM-dd")}
            />
            {isUpdating && (
              <p className="text-[11px] text-muted-foreground mt-1">
                Date can't be changed when editing an existing record.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {MEASURE_KEYS.map(({ key, label, unit }) => {
              const unitText =
                unit === "weight"
                  ? unitWeight
                  : unit === "bodyFat"
                    ? "%"
                    : unitBodystat;
              return (
                <div key={key}>
                  <label className="apex-eyebrow block mb-1.5">
                    {label} ({unitText})
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="—"
                    value={values[key] ?? ""}
                    onChange={(e) => setField(key, e.target.value)}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleSave()}
            disabled={isPending}
            className="gap-2"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {isUpdating ? "Save changes" : "Save measurement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Keep imports referenced for future revival.
void ArrowUpRight;
void UpdateProgressDialog;
