import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format, subDays } from "date-fns";
import { ArrowDown, ArrowUp, Loader2 } from "lucide-react";
import {
  useTrainerizeLink,
  useTrainerizeUnits,
} from "@/hooks/trainerize/useLinkage";
import { useBodyStatsRange } from "@/hooks/trainerize/useBodyStats";
import {
  aggregateSleepByNight,
  useHealthDataMulti,
  useSleepData,
} from "@/hooks/trainerize/useHealthData";
import type {
  HealthDataResponse,
  HealthDataSleepResponse,
} from "@/types/trainerize/healthData_types";
import type { BodyStatsRecord } from "@/types/trainerize/bodystats_types";
import { createPageUrl } from "@/utils";
import {
  STATIC_RHR_LATEST,
  STATIC_SLEEP_AVG_MS,
  STATIC_SLEEP_TOTALS_MS,
  STATIC_WEARABLES,
} from "@/data/wearables/staticWearables";

/**
 * 6-tile vitals + body composition strip that mirrors the
 * "Vitals & Body Composition" grid in the New Ui mockup.
 *
 * Each tile renders an icon with a color-tinted drop shadow, a trend pill
 * (computed from the 7-day series — last vs first value), the headline
 * value, and a tiny sparkline. Body composition values are sparse by
 * nature (only days the user actually logged) so we plot whatever points
 * exist over the last 30 days and fall back to an empty state when there
 * are <2 data points.
 *
 * Hidden when the user has no Trainerize link. `isTracked: false` on any
 * health-data tile shows the documented "Connect wearable in Trainerize
 * app" empty state — never a hard error.
 */

const WEEK_DAYS = 6;
const STAT_RANGE_DAYS = 30;
const SPARK_GRADIENT_ID = "apexVitalsSparkGradient";

/**
 * Temporary flag — while wearable / body-stats endpoints aren't fully live,
 * we fall back to realistic dummy values on any tile that would otherwise
 * render an empty state. Flip to `false` (or remove the fallbacks) once
 * the integrations return real data.
 */
const USE_DUMMY_VITALS = true;

const DUMMY_VITALS = {
  // Sleep: 7-day per-night totals (ms, oldest → newest). Sourced from the
  // shared static wearables data so the dashboard tile and the Wearables
  // page show the same numbers.
  sleep: {
    // Headline matches the Wearables page KPI (avg/night = 6h 45m).
    todayMs: STATIC_SLEEP_AVG_MS,
    series: STATIC_SLEEP_TOTALS_MS as Array<number | null>,
  },
  calorieBurn: {
    resting: 0,
    active: 420,
    // 7-day totals (oldest → newest) — realistic active-calorie range
    series: [340, 480, 395, 520, 360, 505, 420] as Array<number | null>,
  },
  // Resting heart rate — same static wearables series.
  restingHeartRate: {
    latest: STATIC_RHR_LATEST,
    series: [...STATIC_WEARABLES.rhr.values] as Array<number | null>,
  },
  bodyFat: {
    latest: 18.2,
    series: [19.4, 19.1, 18.9, 18.6, 18.4, 18.2] as Array<number | null>,
  },
  leanMuscle: {
    latest: 68.4,
    series: [67.9, 68.0, 68.2, 68.3, 68.4] as Array<number | null>,
  },
  totalWeight: {
    latest: 82.6,
    series: [84.1, 83.7, 83.3, 83.0, 82.8, 82.6] as Array<number | null>,
  },
  latestBodyLogDate: format(new Date(), "yyyy-MM-dd"),
};

export default function TrainerizeVitalsRow() {
  const linkQuery = useTrainerizeLink();
  if (!USE_DUMMY_VITALS && !linkQuery.isLoading && !linkQuery.data) return null;

  const today = format(new Date(), "yyyy-MM-dd");
  const weekAgo = format(subDays(new Date(), WEEK_DAYS), "yyyy-MM-dd");

  const queries = useHealthDataMulti(
    ["restingHeartRate", "calorieOut"],
    weekAgo,
    today,
  );
  const rhrQ = queries[0]!;
  const calorieQ = queries[1]!;

  const sleepQ = useSleepData({
    startTime: `${weekAgo} 00:00:00`,
    endTime: `${today} 23:59:59`,
  });

  // Body stats over the last 30 days. One Trainerize GET per date; React
  // Query de-dupes if other tabs request the same date.
  const dates = useMemo(() => {
    const out: string[] = [];
    for (let i = 0; i < STAT_RANGE_DAYS; i++) {
      out.push(format(subDays(new Date(), i), "yyyy-MM-dd"));
    }
    return out;
  }, []);
  const bodyStatsResults = useBodyStatsRange(dates);

  // Latest tracked body-stats record + the full timeline (sparse).
  const { latest: latestBodyStats, series: bodyStatsSeries } = useMemo(() => {
    const records: Array<{ date: string; rec: BodyStatsRecord }> = [];
    for (let i = 0; i < bodyStatsResults.length; i++) {
      const r = bodyStatsResults[i];
      const rec = r?.data as BodyStatsRecord | undefined;
      if (rec && rec.bodyMeasures && dates[i]) {
        records.push({ date: dates[i] as string, rec });
      }
    }
    // dates[] is newest-first, so records is newest-first too.
    return {
      latest: records[0]?.rec ?? null,
      // Reverse for sparkline order (oldest → newest).
      series: [...records].reverse(),
    };
  }, [bodyStatsResults, dates]);

  const { unitWeight } = useTrainerizeUnits();

  const nav = useNavigate();
  const onOpen = () => nav(createPageUrl("Wearables"));

  return (
    <div className="mb-6">
      {/* Shared sparkline gradient — defined once, referenced by every tile. */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
        <defs>
          <linearGradient id={SPARK_GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2F6FE0" stopOpacity="0.30" />
            <stop offset="1" stopColor="#2F6FE0" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="apex-section-title">Vitals &amp; Body Composition</h2>
          <span className="apex-eyebrow">Wearable + body stats · last 30d</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <SleepTile query={sleepQ} today={today} weekAgo={weekAgo} onOpen={onOpen} />
        <BodyFatTile
          record={latestBodyStats}
          series={bodyStatsSeries}
          loading={anyLoading(bodyStatsResults)}
          onOpen={onOpen}
        />
        <LeanMuscleTile
          record={latestBodyStats}
          series={bodyStatsSeries}
          loading={anyLoading(bodyStatsResults)}
          unitWeight={unitWeight}
          onOpen={onOpen}
        />
        <TotalWeightTile
          record={latestBodyStats}
          series={bodyStatsSeries}
          loading={anyLoading(bodyStatsResults)}
          unitWeight={unitWeight}
          onOpen={onOpen}
        />
        <CalorieBurnTile query={calorieQ} onOpen={onOpen} />
        <RestingHeartRateTile query={rhrQ} onOpen={onOpen} />
      </div>
    </div>
  );
}

// ─── Tile shell ──────────────────────────────────────────────────────────

interface TileShellProps {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  /** Tinted drop shadow that pools beneath the icon (mockup look). */
  iconShadow: string;
  label: string;
  loading?: boolean;
  error?: boolean;
  empty?: boolean;
  emptyText?: string;
  trend?: { delta: string; direction: "up" | "down" } | null;
  /** Per-day series (oldest → newest). null entries are gaps. */
  series?: Array<number | null>;
  sparkColor?: string;
  subLeft?: React.ReactNode;
  subRight?: React.ReactNode;
  children?: React.ReactNode;
  onOpen: () => void;
}

function VitalTile({
  icon,
  iconBg,
  iconColor,
  iconShadow,
  label,
  loading,
  error,
  empty,
  emptyText,
  trend,
  series,
  sparkColor,
  subLeft,
  subRight,
  children,
  onOpen,
}: TileShellProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="apex-card text-left px-5 py-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] hover:border-[#DDE0DC] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="flex items-center justify-between">
        <div
          className="w-[38px] h-[38px] rounded-[11px] grid place-items-center"
          style={{ background: iconBg, color: iconColor, boxShadow: iconShadow }}
        >
          {icon}
        </div>
        {trend && !loading && !error && !empty ? (
          <span
            className="inline-flex items-center gap-1 font-mono text-[12px] font-semibold px-[9px] py-[3px] rounded-full"
            style={{ background: "var(--opt-soft)", color: "var(--opt-d)" }}
          >
            {trend.direction === "up" ? (
              <ArrowUp className="w-[11px] h-[11px]" strokeWidth={3} />
            ) : (
              <ArrowDown className="w-[11px] h-[11px]" strokeWidth={3} />
            )}
            {trend.delta}
          </span>
        ) : null}
      </div>

      <div className="apex-eyebrow mt-[17px]">{label}</div>

      <div className="mt-[5px]">
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-mute mt-2" />
        ) : error ? (
          <p className="text-[12.5px] text-ink-2 py-1">
            Couldn&apos;t load — try again later.
          </p>
        ) : empty ? (
          <p className="text-[12.5px] text-ink-2 py-1">
            {emptyText ?? "No data yet."}
          </p>
        ) : (
          children
        )}
      </div>

      {!loading && !error && !empty && series && series.length > 1 && (
        <Sparkline values={series} color={sparkColor ?? "#2F6FE0"} />
      )}

      {!loading && !error && !empty && (subLeft || subRight) && (
        <div className="mt-[10px] flex justify-between text-[12.5px] text-ink-2">
          <span>{subLeft}</span>
          <span className="font-mono text-mute">{subRight}</span>
        </div>
      )}
    </button>
  );
}

function ValueBlock({
  value,
  unit,
}: {
  value: string | number;
  unit?: string;
}) {
  return (
    <div className="apex-tile-val">
      {value}
      {unit ? <span className="u">{unit}</span> : null}
    </div>
  );
}

// ─── Sparkline ───────────────────────────────────────────────────────────

interface SparklineProps {
  values: Array<number | null>;
  color?: string;
}

function Sparkline({ values, color = "#2F6FE0" }: SparklineProps) {
  // Only plot points with a real number, but preserve their original x-index
  // so a 7-day window with gaps still spans the full width.
  const indexed = values
    .map((v, i) => (typeof v === "number" ? { i, v } : null))
    .filter((p): p is { i: number; v: number } => p !== null);

  if (indexed.length < 2) {
    return <div style={{ height: 34, marginTop: 14 }} />;
  }

  const vs = indexed.map((p) => p.v);
  const minY = Math.min(...vs);
  const maxY = Math.max(...vs);
  const yRange = maxY - minY || 1;

  const w = 200;
  const h = 40;
  const padX = 4;
  const padY = 6;
  const xRange = Math.max(values.length - 1, 1);

  const points = indexed
    .map((p) => {
      const x = padX + (p.i / xRange) * (w - padX * 2);
      const y = padY + (1 - (p.v - minY) / yRange) * (h - padY * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const lastPoint = indexed[indexed.length - 1]!;
  const firstPoint = indexed[0]!;
  const closePath = `${points} ${
    padX + (lastPoint.i / xRange) * (w - padX * 2)
  },${h} ${padX + (firstPoint.i / xRange) * (w - padX * 2)},${h}`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="w-full mt-[14px]"
      style={{ height: 34 }}
      aria-hidden
    >
      <polyline
        fill={`url(#${SPARK_GRADIENT_ID})`}
        stroke="none"
        points={closePath}
      />
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

// ─── Individual tiles ────────────────────────────────────────────────────

function SleepTile({
  query,
  today,
  weekAgo,
  onOpen,
}: {
  query: {
    data: HealthDataSleepResponse | undefined;
    isLoading: boolean;
    isError: boolean;
  };
  today: string;
  weekAgo: string;
  onOpen: () => void;
}) {
  const rawByNight = useMemo(
    () => aggregateSleepByNight(query.data),
    [query.data],
  );
  const rawSeries = useMemo(
    () => buildDaySeries(weekAgo, today, (date) => rawByNight[date] ?? null),
    [rawByNight, today, weekAgo],
  );
  const rawMs = rawByNight[today] ?? null;

  const useDummy = USE_DUMMY_VITALS && rawMs === null && !query.isLoading;
  const ms = useDummy ? DUMMY_VITALS.sleep.todayMs : rawMs;
  const series = useDummy ? DUMMY_VITALS.sleep.series : rawSeries;
  const isTracked = useDummy ? true : query.data?.isTracked;
  const hours = ms !== null ? Math.floor(ms / 3600000) : 0;
  const minutes = ms !== null ? Math.round((ms % 3600000) / 60000) : 0;

  const trend = useMemo(() => deltaTrend(series, formatMinutesDelta), [series]);

  return (
    <VitalTile
      icon={<VitalIconImg src="/vitals/vital-sleep.png" alt="Sleep" size={24} />}
      iconBg="var(--purple-soft)"
      iconColor="var(--purple)"
      iconShadow="0 4px 11px -3px rgba(115, 85, 201, 0.45)"
      label="Sleep"
      loading={query.isLoading}
      error={query.isError}
      empty={ms === null}
      emptyText={
        isTracked === false
          ? "Connect a wearable in the Apex Fit app."
          : "No sleep data."
      }
      trend={trend}
      series={series}
      sparkColor="#2F6FE0"
      subLeft="Avg / night"
      subRight={
        query.data?.isTracked === false ? null : `${avgMinutesLabel(series)} avg`
      }
      onOpen={onOpen}
    >
      <div className="apex-tile-val">
        {hours}
        <span className="u">h</span> {minutes}
        <span className="u">m</span>
      </div>
    </VitalTile>
  );
}

function BodyFatTile({
  record,
  series,
  loading,
  onOpen,
}: {
  record: BodyStatsRecord | null;
  series: Array<{ date: string; rec: BodyStatsRecord }>;
  loading: boolean;
  onOpen: () => void;
}) {
  const rawBf =
    record?.bodyMeasures?.bodyFatPercent ?? record?.bodyMeasures?.bodyFat ?? null;
  const rawValues = useMemo(
    () =>
      series.map(
        (s) =>
          s.rec.bodyMeasures?.bodyFatPercent ??
          s.rec.bodyMeasures?.bodyFat ??
          null,
      ),
    [series],
  );

  const useDummy = USE_DUMMY_VITALS && rawBf == null && !loading;
  const bf = useDummy ? DUMMY_VITALS.bodyFat.latest : rawBf;
  const values = useDummy ? DUMMY_VITALS.bodyFat.series : rawValues;
  const latestDate = useDummy ? DUMMY_VITALS.latestBodyLogDate : record?.date;

  const trend = useMemo(
    () => deltaTrend(values, (d) => `${formatSigned(d, 1)}%`),
    [values],
  );

  return (
    <VitalTile
      icon={<VitalIconImg src="/vitals/vital-body-fat.png" alt="Body fat" />}
      iconBg="#FBF1D2"
      iconColor="#B07A24"
      iconShadow="0 4px 11px -3px rgba(227, 160, 8, 0.5)"
      label="Body fat"
      loading={loading && !record && !USE_DUMMY_VITALS}
      empty={bf == null}
      emptyText="Log body stats to see body fat."
      trend={trend}
      series={values}
      sparkColor="#2F6FE0"
      subLeft="Latest log"
      subRight={latestDate ? safeShortDate(latestDate) : null}
      onOpen={onOpen}
    >
      <ValueBlock value={typeof bf === "number" ? bf : "—"} unit="%" />
    </VitalTile>
  );
}

function LeanMuscleTile({
  record,
  series,
  loading,
  unitWeight,
  onOpen,
}: {
  record: BodyStatsRecord | null;
  series: Array<{ date: string; rec: BodyStatsRecord }>;
  loading: boolean;
  unitWeight: string;
  onOpen: () => void;
}) {
  const rawLean = pickLean(record);
  const rawValues = useMemo(() => series.map((s) => pickLean(s.rec)), [series]);

  const useDummy = USE_DUMMY_VITALS && rawLean === null && !loading;
  const lean = useDummy ? DUMMY_VITALS.leanMuscle.latest : rawLean;
  const values = useDummy ? DUMMY_VITALS.leanMuscle.series : rawValues;

  const trend = useMemo(
    () => deltaTrend(values, (d) => `${formatSigned(d, 1)}${unitWeight}`),
    [values, unitWeight],
  );

  return (
    <VitalTile
      icon={
        <VitalIconImg src="/vitals/vital-lean-muscle.png" alt="Lean muscle" />
      }
      iconBg="var(--brown-soft)"
      iconColor="var(--brown)"
      iconShadow="0 4px 11px -3px rgba(154, 101, 52, 0.45)"
      label="Lean muscle"
      loading={loading && !record && !USE_DUMMY_VITALS}
      empty={lean === null}
      emptyText="Lean mass not in the latest log."
      trend={trend}
      series={values}
      sparkColor="#2F6FE0"
      subLeft="Skeletal mass"
      subRight={null}
      onOpen={onOpen}
    >
      <ValueBlock value={lean ?? "—"} unit={unitWeight} />
    </VitalTile>
  );
}

function TotalWeightTile({
  record,
  series,
  loading,
  unitWeight,
  onOpen,
}: {
  record: BodyStatsRecord | null;
  series: Array<{ date: string; rec: BodyStatsRecord }>;
  loading: boolean;
  unitWeight: string;
  onOpen: () => void;
}) {
  const rawWeight =
    record?.bodyMeasures?.bodyWeight ?? record?.bodyMeasures?.weight ?? null;
  const rawValues = useMemo(
    () =>
      series.map(
        (s) =>
          s.rec.bodyMeasures?.bodyWeight ?? s.rec.bodyMeasures?.weight ?? null,
      ),
    [series],
  );

  const useDummy = USE_DUMMY_VITALS && rawWeight == null && !loading;
  const weight = useDummy ? DUMMY_VITALS.totalWeight.latest : rawWeight;
  const values = useDummy ? DUMMY_VITALS.totalWeight.series : rawValues;
  const latestDate = useDummy ? DUMMY_VITALS.latestBodyLogDate : record?.date;

  const trend = useMemo(
    () => deltaTrend(values, (d) => `${formatSigned(d, 1)}${unitWeight}`),
    [values, unitWeight],
  );

  return (
    <VitalTile
      icon={
        <VitalIconImg src="/vitals/vital-total-weight.png" alt="Total weight" />
      }
      iconBg="#E6EEFC"
      iconColor="var(--info)"
      iconShadow="0 4px 11px -3px rgba(47, 111, 224, 0.45)"
      label="Total weight"
      loading={loading && !record && !USE_DUMMY_VITALS}
      empty={weight == null}
      emptyText="Log a weight in Progress."
      trend={trend}
      series={values}
      sparkColor="#2F6FE0"
      subLeft="Latest log"
      subRight={latestDate ? safeShortDate(latestDate) : null}
      onOpen={onOpen}
    >
      <ValueBlock
        value={typeof weight === "number" ? weight : "—"}
        unit={unitWeight}
      />
    </VitalTile>
  );
}

function CalorieBurnTile({
  query,
  onOpen,
}: {
  query: {
    data: HealthDataResponse | undefined;
    isLoading: boolean;
    isError: boolean;
  };
  onOpen: () => void;
}) {
  const list = query.data?.healthData ?? [];
  const sortedAsc = useMemo(
    () =>
      [...list].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)),
    [list],
  );
  const latest = sortedAsc[sortedAsc.length - 1] ?? null;
  const rawResting =
    typeof latest?.data?.restingEnergy === "number"
      ? latest.data.restingEnergy
      : 0;
  const rawActive =
    typeof latest?.data?.activeEnergy === "number" ? latest.data.activeEnergy : 0;
  const rawTotal = rawResting + rawActive;

  const rawSeries = useMemo(
    () =>
      sortedAsc.map((e) => {
        const r = typeof e.data.restingEnergy === "number" ? e.data.restingEnergy : 0;
        const a = typeof e.data.activeEnergy === "number" ? e.data.activeEnergy : 0;
        return r + a > 0 ? r + a : null;
      }),
    [sortedAsc],
  );

  const useDummy = USE_DUMMY_VITALS && rawTotal === 0 && !query.isLoading;
  const resting = useDummy ? DUMMY_VITALS.calorieBurn.resting : rawResting;
  const active = useDummy ? DUMMY_VITALS.calorieBurn.active : rawActive;
  const total = useDummy ? resting + active : rawTotal;
  const series = useDummy ? DUMMY_VITALS.calorieBurn.series : rawSeries;
  const isTracked = useDummy ? true : query.data?.isTracked;

  const trend = useMemo(
    () => deltaTrend(series, (d) => `${formatSigned(d, 0)}`),
    [series],
  );

  return (
    <VitalTile
      icon={
        <VitalIconImg src="/vitals/vital-caloric-burn.png" alt="Caloric burn" />
      }
      iconBg="var(--apex-accent-soft)"
      iconColor="var(--apex-accent)"
      iconShadow="0 4px 11px -3px rgba(225, 24, 22, 0.45)"
      label="Caloric burn"
      loading={query.isLoading}
      error={query.isError && !USE_DUMMY_VITALS}
      empty={total === 0}
      emptyText={
        isTracked === false
          ? "Connect a wearable in the Apex Fit app."
          : "No data yet."
      }
      trend={trend}
      series={series}
      sparkColor="#2F6FE0"
      subLeft="Total / day"
      subRight={`${active} active`}
      onOpen={onOpen}
    >
      <ValueBlock value={total.toLocaleString()} unit="kcal" />
    </VitalTile>
  );
}

function RestingHeartRateTile({
  query,
  onOpen,
}: {
  query: {
    data: HealthDataResponse | undefined;
    isLoading: boolean;
    isError: boolean;
  };
  onOpen: () => void;
}) {
  const list = query.data?.healthData ?? [];
  const sortedAsc = useMemo(
    () =>
      [...list].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)),
    [list],
  );
  const latest = sortedAsc[sortedAsc.length - 1] ?? null;
  const rawRhr =
    typeof latest?.data?.restingHeartRate === "number"
      ? latest.data.restingHeartRate
      : null;

  const rawSeries = useMemo(
    () =>
      sortedAsc.map((e) =>
        typeof e.data.restingHeartRate === "number"
          ? e.data.restingHeartRate
          : null,
      ),
    [sortedAsc],
  );

  const useDummy = USE_DUMMY_VITALS && rawRhr === null && !query.isLoading;
  const rhr = useDummy ? DUMMY_VITALS.restingHeartRate.latest : rawRhr;
  const series = useDummy ? DUMMY_VITALS.restingHeartRate.series : rawSeries;
  const isTracked = useDummy ? true : query.data?.isTracked;
  const latestDate = useDummy ? DUMMY_VITALS.latestBodyLogDate : latest?.date;

  const trend = useMemo(
    () => deltaTrend(series, (d) => `${formatSigned(d, 0)}bpm`),
    [series],
  );

  return (
    <VitalTile
      icon={<HeartbeatGlyph />}
      iconBg="#FCEAD9"
      iconColor="#E8742C"
      iconShadow="0 4px 11px -3px rgba(232, 116, 44, 0.5)"
      label="Resting heart rate"
      loading={query.isLoading}
      error={query.isError && !USE_DUMMY_VITALS}
      empty={rhr === null}
      emptyText={
        isTracked === false
          ? "Connect a wearable in the Apex Fit app."
          : "No data yet."
      }
      trend={trend}
      series={series}
      sparkColor="#2F6FE0"
      subLeft={latestDate ? `Logged ${safeShortDate(latestDate)}` : "Latest"}
      subRight={null}
      onOpen={onOpen}
    >
      <ValueBlock value={rhr ?? "—"} unit="bpm" />
    </VitalTile>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function anyLoading(results: Array<{ isLoading: boolean }>) {
  return results.some((r) => r.isLoading);
}

function pickLean(record: BodyStatsRecord | null | undefined): number | null {
  if (!record) return null;
  const measures = record.bodyMeasures as Record<string, unknown> | undefined;
  const candidates = [measures?.skeletalMuscle, measures?.leanMass];
  for (const c of candidates) {
    if (typeof c === "number" && c > 0) return c;
  }
  return null;
}

function buildDaySeries(
  startDate: string,
  endDate: string,
  pick: (date: string) => number | null,
): Array<number | null> {
  const out: Array<number | null> = [];
  const cursor = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  while (cursor <= end) {
    const yyyy = cursor.getFullYear();
    const mm = String(cursor.getMonth() + 1).padStart(2, "0");
    const dd = String(cursor.getDate()).padStart(2, "0");
    out.push(pick(`${yyyy}-${mm}-${dd}`));
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

function deltaTrend(
  series: Array<number | null>,
  formatDelta: (delta: number) => string,
): { delta: string; direction: "up" | "down" } | null {
  const real = series.filter((v): v is number => typeof v === "number");
  if (real.length < 2) return null;
  const first = real[0]!;
  const last = real[real.length - 1]!;
  const d = last - first;
  if (d === 0) return null;
  return {
    delta: formatDelta(Math.abs(d)),
    direction: d > 0 ? "up" : "down",
  };
}

function formatSigned(value: number, decimals: number): string {
  return value.toFixed(decimals);
}

function formatMinutesDelta(deltaMs: number): string {
  const mins = Math.round(deltaMs / 60000);
  return mins >= 60 ? `${(mins / 60).toFixed(1)}h` : `${mins}m`;
}

function avgMinutesLabel(values: Array<number | null>): string {
  const real = values.filter((v): v is number => typeof v === "number" && v > 0);
  if (!real.length) return "—";
  const avgMs = real.reduce((a, b) => a + b, 0) / real.length;
  const totalMin = Math.round(avgMs / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function safeShortDate(value: string): string {
  try {
    return format(new Date(value), "MMM d");
  } catch {
    return value;
  }
}

/**
 * PNG icon (mockup vital-*.png assets shipped in `public/vitals/`).
 * `object-contain` so the icon never crops inside the 38×38 chip.
 */
function VitalIconImg({
  src,
  alt,
  size = 25,
}: {
  src: string;
  alt: string;
  size?: number;
}) {
  return (
    <img
      src={src}
      alt={alt}
      style={{ width: size, height: size, display: "block", objectFit: "contain" }}
    />
  );
}

/**
 * Heartbeat trace for the RHR tile — replicates the mockup's inline SVG
 * (`M 2,12.5 H6 L7.5,10 L9,12.5 L11,4 L13,20 L15,4.5 L17,12.5 L18.5,10 L20,12.5 H22`).
 * Drawn at 22×22 with currentColor stroke so the surrounding chip's
 * `color: #E8742C` paints the trace.
 */
function HeartbeatGlyph() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 12.5H6L7.5 10L9 12.5L11 4L13 20L15 4.5L17 12.5L18.5 10L20 12.5H22" />
    </svg>
  );
}
