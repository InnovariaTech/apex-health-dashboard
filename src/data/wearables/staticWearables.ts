/**
 * Static wearables data — mirrors the `apex-wearables-portal` demo
 * (`data/wearables.json`). Used while the real Trainerize / Apple Health /
 * Fitbit / Withings sync isn't returning data yet.
 *
 * Both the Wearables page and the dashboard vitals row read from here so the
 * numbers stay consistent across the app. When the real integration is live,
 * flip `USE_STATIC_WEARABLES` to `false` (Wearables page) and set
 * `USE_DUMMY_VITALS = false` in `TrainerizeVitalsRow.tsx`.
 *
 * Window: last 7 days, oldest → newest.
 */

export const USE_STATIC_WEARABLES = true;

export const WEARABLE_DAYS = [
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
  "Mon",
  "Tue",
] as const;

export const STATIC_WEARABLES = {
  days: WEARABLE_DAYS,

  steps: {
    values: [8420, 11230, 9870, 7650, 13540, 10120, 9340],
    goal: 10000,
    unit: "avg/day",
    trend: "+8.4% vs last wk",
    color: "#059669",
    colorDark: "#047857",
    colorLite: "#34D399",
    barDim: "#BFE8D6",
    labelDim: "#7FB79E",
  },

  rhr: {
    values: [58, 56, 57, 59, 55, 54, 56],
    unit: "bpm",
    trend: "−3 bpm vs last wk",
    scale: [50, 64] as [number, number],
    color: "#E11816",
    colorDark: "#B70402",
  },

  bp: {
    systolic: [122, 119, 124, 121, 118, 120, 117],
    diastolic: [78, 76, 79, 77, 75, 76, 74],
    unit: "mmHg",
    trend: "Optimal range",
    scale: [68, 132] as [number, number],
    band: [90, 120] as [number, number],
    color: "#2563EB",
    colorDia: "#9AA0A8",
  },

  sleep: {
    // each night = [deep, core, rem, awake] in hours
    nights: [
      [1.3, 3.9, 1.5, 0.4],
      [1.5, 4.0, 1.6, 0.3],
      [1.2, 3.6, 1.4, 0.5],
      [1.6, 4.2, 1.7, 0.3],
      [1.1, 3.4, 1.3, 0.6],
      [1.5, 4.1, 1.6, 0.4],
      [1.4, 3.8, 1.5, 0.4],
    ],
    stages: ["Deep", "Core", "REM", "Awake"],
    colors: ["#4C1D95", "#7C3AED", "#A78BFA", "#DDD6FE"],
    colorDark: "#5B21B6",
    unit: "avg/night",
    trend: "+22m vs last wk",
    max: 9,
  },
} as const;

/** Sleep-per-night totals in ms (deep + core + rem, awake excluded). */
export function staticSleepNightTotalsMs(): number[] {
  return STATIC_WEARABLES.sleep.nights.map(
    (n) => (n[0] + n[1] + n[2]) * 3600000,
  );
}

/** Per-night sleep totals in ms (oldest → newest). */
export const STATIC_SLEEP_TOTALS_MS: number[] = staticSleepNightTotalsMs();

/** Latest night's sleep total in ms — guaranteed a number. */
export const STATIC_SLEEP_TODAY_MS: number =
  STATIC_SLEEP_TOTALS_MS[STATIC_SLEEP_TOTALS_MS.length - 1] ?? 0;

/**
 * Average sleep-per-night in ms — matches the Wearables page KPI
 * ("avg/night"). The dashboard Sleep tile headline uses this so both
 * surfaces show the same 6h 45m figure.
 */
export const STATIC_SLEEP_AVG_MS: number = STATIC_SLEEP_TOTALS_MS.length
  ? STATIC_SLEEP_TOTALS_MS.reduce((a, b) => a + b, 0) /
    STATIC_SLEEP_TOTALS_MS.length
  : 0;

/** Latest resting-heart-rate reading — guaranteed a number. */
export const STATIC_RHR_LATEST: number =
  STATIC_WEARABLES.rhr.values[STATIC_WEARABLES.rhr.values.length - 1] ?? 0;
