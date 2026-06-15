// @ts-nocheck
import { useMemo, useState } from "react";
import {
  Camera,
  TrendingUp,
  Plus,
  Ruler,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Trash2,
  AlertCircle,
  Target,
} from "lucide-react";
import { format, parseISO, subDays } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import type { BodyMeasures } from "@/types/trainerize/bodystats_types";
import GoalsTab from "@/views/patient/components/progress/GoalsTab";
import PhotosTab from "@/views/patient/components/progress/PhotosTab";

/**
 * Trainerize-backed body stats. Trainerize has no range endpoint, so trend
 * charts are built from N parallel single-date GETs (weekly cadence over the
 * selected window — 13 calls for 90 days). Photo/upload is the legacy mock
 * flow because Trainerize doesn't expose photos.
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

/**
 * Server canonical field names. The integration doc shows `weight` / `bodyFat`
 * but the actual response uses `bodyWeight` / `bodyFatPercent`. We use the
 * server's names everywhere and rely on the field aliases in `BodyMeasures`.
 * `caliperMode` is metadata, not a measurement, so it's excluded.
 */
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

/** True if `bodyMeasures` contains at least one real measurement value (>0). */
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
  // Server returns `bodyWeight`; the doc shows `weight`. Accept either.
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
  // Range is locked to 15 days — the dropdown was removed at the user's
  // request. If you ever want it back, restore the <Select> in the header
  // and lift this to React state.
  const rangeKey: RangeKey = "15d";
  const dates = useMemo(() => datesForRange(rangeKey), []);
  const rangeQueries = useBodyStatsRange(dates);

  const series = useMemo<SeriesPoint[]>(() => {
    return dates.map((date, i) => {
      const q = rangeQueries[i];
      const record = q?.data?.bodyMeasures ?? null;
      const weight = readWeight(record);
      const bodyFat = readBodyFat(record);
      // `hasData` means there's at least one real measurement to show —
      // empty stubs (`bodyMeasures: null`) and records with every field null
      // are filtered out so the chart + Measurements list stay clean.
      return {
        date,
        weight,
        bodyFat,
        hasData: hasAnyMeasurement(record),
        record,
      };
    });
  }, [dates, rangeQueries]);

  const hasPoints = series.some((p) => p.hasData);
  const withData = series.filter((p) => p.hasData);
  // Points the trend chart can actually draw — at least weight or body fat.
  // Records with only girth measurements (chest/waist/etc.) belong on the
  // Measurements list, not the line chart.
  const chartData = useMemo(
    () => series.filter((p) => p.weight != null || p.bodyFat != null),
    [series],
  );
  const hasChartData = chartData.length > 0;
  const firstPoint = withData[0];
  const lastPoint = withData[withData.length - 1];
  const isRangeLoading = rangeQueries.some((q) => q?.isLoading);

  const weightChange =
    lastPoint?.weight != null && firstPoint?.weight != null
      ? lastPoint.weight - firstPoint.weight
      : null;
  const bodyFatChange =
    lastPoint?.bodyFat != null && firstPoint?.bodyFat != null
      ? lastPoint.bodyFat - firstPoint.bodyFat
      : null;

  // ── Log measurement dialog ───────────────────────────────────────────────
  const [editing, setEditing] = useState<{
    date: string;
    measures: BodyMeasures;
  } | null>(null);

  const openLog = (date = format(new Date(), "yyyy-MM-dd"), measures: BodyMeasures = {}) => {
    setEditing({ date, measures });
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-background min-h-screen">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1">My Progress</h1>
          <p className="text-muted-foreground">
            Body stats & transformation.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground border border-border rounded-md px-3 py-2 bg-secondary/40">
            Last 15 days
          </div>
          <Button onClick={() => openLog()} className="gap-2">
            <Plus className="w-4 h-4" /> Log measurement
          </Button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <SummaryTile
          label="Latest weight"
          value={
            lastPoint?.weight != null
              ? `${lastPoint.weight} ${unitWeight}`
              : "—"
          }
          sub={lastPoint?.date ? `as of ${lastPoint.date}` : "no measurements yet"}
        />
        <SummaryTile
          label="Latest body fat"
          value={lastPoint?.bodyFat != null ? `${lastPoint.bodyFat}%` : "—"}
          sub={lastPoint?.date ? `as of ${lastPoint.date}` : "no measurements yet"}
        />
        <SummaryTile
          label={`Weight change (${RANGE_PRESETS[rangeKey].label.toLowerCase()})`}
          value={
            weightChange == null
              ? "—"
              : `${weightChange > 0 ? "+" : ""}${weightChange.toFixed(1)} ${unitWeight}`
          }
          sub={firstPoint?.date ? `since ${firstPoint.date}` : "—"}
          tone={
            weightChange == null
              ? "neutral"
              : weightChange < 0
                ? "good"
                : weightChange > 0
                  ? "warn"
                  : "neutral"
          }
        />
        <SummaryTile
          label="Body fat change"
          value={
            bodyFatChange == null
              ? "—"
              : `${bodyFatChange > 0 ? "+" : ""}${bodyFatChange.toFixed(1)}%`
          }
          sub={firstPoint?.date ? `since ${firstPoint.date}` : "—"}
          tone={
            bodyFatChange == null
              ? "neutral"
              : bodyFatChange < 0
                ? "good"
                : bodyFatChange > 0
                  ? "warn"
                  : "neutral"
          }
        />
      </div>

      <Tabs defaultValue="trend" className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="trend" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Trend
          </TabsTrigger>
          <TabsTrigger value="measurements" className="flex items-center gap-2">
            <Ruler className="w-4 h-4" /> Measurements
          </TabsTrigger>
          <TabsTrigger value="goals" className="flex items-center gap-2">
            <Target className="w-4 h-4" /> Goals
          </TabsTrigger>
          <TabsTrigger value="photos" className="flex items-center gap-2">
            <Camera className="w-4 h-4" /> Photos
          </TabsTrigger>
        </TabsList>

        {/* ── Trend tab ──────────────────────────────────────────────────── */}
        <TabsContent value="trend">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Weight & Body Fat
              </CardTitle>
              <CardDescription>
                {RANGE_PRESETS[rangeKey].label} • sampled every{" "}
                {RANGE_PRESETS[rangeKey].cadence} day
                {RANGE_PRESETS[rangeKey].cadence === 1 ? "" : "s"}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isRangeLoading ? (
                <div className="py-16 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : !hasPoints ? (
                <div className="py-16 text-center">
                  <Ruler className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="font-semibold mb-1">No measurements logged</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Log your first body stats record to start tracking trends.
                  </p>
                  <Button onClick={() => openLog()} className="gap-2">
                    <Plus className="w-4 h-4" /> Log measurement
                  </Button>
                </div>
              ) : !hasChartData ? (
                // Edge case: only girth measurements logged (no weight, no body fat).
                <div className="py-16 text-center">
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="font-semibold mb-1">No weight or body fat in this range</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your other measurements are visible on the Measurements tab.
                    Log a weight or body-fat value to populate the trend chart.
                  </p>
                  <Button onClick={() => openLog()} className="gap-2">
                    <Plus className="w-4 h-4" /> Log measurement
                  </Button>
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v) => {
                          try {
                            return format(parseISO(v), "MMM d");
                          } catch {
                            return v;
                          }
                        }}
                        // With daily cadence over 15 days we'd cram 16 ticks —
                        // let Recharts thin them automatically by allowing
                        // duplicated keys but capping interval.
                        interval="preserveStartEnd"
                        minTickGap={20}
                      />
                      <YAxis
                        yAxisId="left"
                        tickFormatter={(v) => `${v} ${unitWeight}`}
                        tick={{ fontSize: 11 }}
                        domain={["auto", "auto"]}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tickFormatter={(v) => `${v}%`}
                        tick={{ fontSize: 11 }}
                        domain={["auto", "auto"]}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                        }}
                        labelFormatter={(label) => {
                          try {
                            return format(parseISO(label as string), "EEEE, MMM d, yyyy");
                          } catch {
                            return String(label);
                          }
                        }}
                        formatter={(value, name) => {
                          if (value == null) return ["—", String(name)];
                          return name === "weight"
                            ? [`${value} ${unitWeight}`, "Weight"]
                            : [`${value}%`, "Body Fat"];
                        }}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="weight"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={{ fill: "#3b82f6", r: 4 }}
                        name="weight"
                        connectNulls
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="bodyFat"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        dot={{ fill: "#f59e0b", r: 3 }}
                        name="bodyFat"
                        strokeDasharray="5 5"
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="flex items-center gap-6 mt-2 justify-center text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-0.5 bg-blue-500 inline-block" /> Weight (
                      {unitWeight})
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-0.5 bg-amber-500 inline-block" /> Body Fat %
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Measurements tab (CRUD) ────────────────────────────────────── */}
        <TabsContent value="measurements" className="space-y-3">
          {isRangeLoading ? (
            <Card>
              <CardContent className="py-12 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : withData.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Ruler className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                <p className="font-semibold mb-1">Nothing here yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Log a measurement to populate this list.
                </p>
                <Button onClick={() => openLog()} className="gap-2">
                  <Plus className="w-4 h-4" /> Log measurement
                </Button>
              </CardContent>
            </Card>
          ) : (
            [...withData].reverse().map((p) => (
              <MeasurementCard
                key={p.date}
                date={p.date}
                measures={p.record ?? {}}
                unitWeight={unitWeight}
                unitBodystat={unitBodystat}
                onEdit={() => openLog(p.date, p.record ?? {})}
              />
            ))
          )}
        </TabsContent>

        {/* ── Goals tab (Trainerize) ─────────────────────────────────────── */}
        <TabsContent value="goals">
          <GoalsTab />
        </TabsContent>

        {/* ── Photos tab (Trainerize) ────────────────────────────────────── */}
        <TabsContent value="photos">
          <PhotosTab />
        </TabsContent>
      </Tabs>

      {editing && (
        <LogMeasurementDialog
          date={editing.date}
          initial={editing.measures}
          unitWeight={unitWeight}
          unitBodystat={unitBodystat}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

// ─── Subcomponents ─────────────────────────────────────────────────────────

function SummaryTile({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "neutral" | "good" | "warn";
}) {
  const toneClass =
    tone === "good"
      ? "text-emerald-600"
      : tone === "warn"
        ? "text-amber-600"
        : "text-foreground";
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
          {label}
        </p>
        <p className={`text-2xl font-bold ${toneClass}`}>{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      </CardContent>
    </Card>
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

  // Only surface keys we recognize as measurements (drops `caliperMode`,
  // `code`, etc.) and only those with real numeric values.
  const entries = Object.entries(measures).filter(
    ([k, v]) => MEASUREMENT_KEY_SET.has(k) && typeof v === "number",
  );

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold">{format(parseISO(date), "EEEE, MMM d, yyyy")}</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onEdit}>
              Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => void handleDelete()}
              disabled={deleteStats.isPending}
              className="text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        {entries.length === 0 ? (
          <p className="text-xs text-muted-foreground">No values recorded for this date.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
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
                  <p className="text-xs text-muted-foreground capitalize">
                    {meta?.label ?? key}
                  </p>
                  <p className="font-semibold">
                    {value} {unit}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface LogDialogProps {
  date: string;
  initial: BodyMeasures;
  unitWeight: string;
  unitBodystat: string;
  onClose: () => void;
}

function LogMeasurementDialog({
  date: initialDate,
  initial,
  unitWeight,
  unitBodystat,
  onClose,
}: LogDialogProps) {
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
      // POST first (creates the empty record). Idempotent enough that a 400
      // "record exists" is fine to swallow when we're updating.
      if (!isUpdating) {
        try {
          await create.mutateAsync({ date, status: "recorded" });
        } catch (err: any) {
          // If the record already exists Trainerize returns 400 — that's fine,
          // we'll proceed straight to PUT.
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
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
              Date
            </label>
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
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
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
          <Button onClick={() => void handleSave()} disabled={isPending} className="gap-2">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {isUpdating ? "Save changes" : "Save measurement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Keep referenced imports happy (ChevronLeft/Right used elsewhere previously).
void ChevronLeft;
void ChevronRight;
