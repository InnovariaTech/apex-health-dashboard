/* Apex Progress — content data (single source of truth)
 * Loaded as a global so the page renders from file:// without a server.
 * A pure-JSON mirror lives in data/progress.json (used by tools/).
 */
window.APEX_PROGRESS = {
  member: {
    name: "Robert Carlsen",
    id: "APX-7834-RC",
    plan: "Apex Longevity Active",
    period: "Jan – Jun 2026",
    checkIn: "May 11, 2026"
  },

  kpis: [
    { tone: "green",  dot: "#3E7C57", label: "TOTAL WEIGHT CHANGE",       value: "−60", unit: "lbs",      sub: "247 → 187 lbs · weight lost",        badge: { dir: "down", text: "24%" } },
    { tone: "blue",   dot: "#2862C0", label: "BODY FAT CHANGE",           value: "−17", unit: "%",        sub: "31% → 14% body fat",                 badge: { dir: "down", text: "55%" } },
    { tone: "purple", dot: "#7C3AED", label: "BIOMARKER IMPROVEMENT",     value: "14",  unit: "improving", sub: "23 of 27 now in optimal range",      link: "biomarkers.html" },
    { tone: "amber",  dot: "#B07A24", label: "ACTIVITY LEVEL IMPROVEMENT", value: "+13", unit: "VO₂max",   sub: "34 → 47 mL/kg/min · ↑ Very active",  badge: { dir: "up",   text: "+38%" } }
  ],

  biomarkers: {
    link: "biomarkers.html",
    sub: "14 markers trending into optimal range since Jan 2026 · last panel Apr 28 · Quest Diagnostics",
    stats: [
      { label: "IN OPTIMAL RANGE", value: "23",   unit: "/27",      note: "↑ 9 since baseline" },
      { label: "IMPROVING",        value: "14",   unit: " markers", note: "↑ since Jan 2026" },
      { label: "BIOLOGICAL AGE",   value: "38.2", unit: " yr",      note: "5.8 yrs below actual" },
      { label: "LONGEVITY SCORE",  value: "86",   unit: "/100",     note: "Top 12% for age band" }
    ],
    markers: [
      { name: "ApoB",          cat: "LIPIDS · MOST PREDICTIVE", value: "78",  unit: "mg/dL", dir: "down", delta: "112 → 78" },
      { name: "LDL-C",         cat: "LIPIDS",                   value: "108", unit: "mg/dL", dir: "down", delta: "10 mg/dL" },
      { name: "Triglycerides", cat: "LIPIDS",                   value: "86",  unit: "mg/dL", dir: "down", delta: "8 mg/dL" },
      { name: "HbA1c",         cat: "METABOLIC",                value: "5.2", unit: "%",     dir: "down", delta: "0.1%" },
      { name: "hs-CRP",        cat: "INFLAMMATION",             value: "0.6", unit: "mg/L",  dir: "down", delta: "0.3 mg/L" },
      { name: "Vitamin D",     cat: "VITAMINS",                 value: "48",  unit: "ng/mL", dir: "up",   delta: "6 ng/mL" }
    ]
  },

  trend: {
    points: [
      { label: "Month 1", weight: 247, bodyFat: 31 },
      { label: "Month 2", weight: 238, bodyFat: 29 },
      { label: "Month 3", weight: 226, bodyFat: 26 },
      { label: "Month 4", weight: 213, bodyFat: 22 },
      { label: "Month 5", weight: 199, bodyFat: 18 },
      { label: "Month 6", weight: 187, bodyFat: 14 }
    ],
    goalWeight: 180,
    weightScale: [150, 260],
    bodyFatScale: [0, 40]
  },

  snapshot: {
    meta: "Month 6 · latest check-in May 11, 2026",
    rows: [
      { icon: "weight",   tint: "#EAF1FB",        color: "#2862C0",      label: "Weight",           value: "187 lbs", delta: "↓ 60", dir: "down" },
      { icon: "globe",    tint: "var(--good-bg)", color: "var(--good)",  label: "Body fat",         value: "14%",     delta: "↓ 17", dir: "down" },
      { icon: "activity", tint: "#FCEAEA",        color: "var(--accent)",label: "Lean mass",        value: "161 lbs", delta: "↑ 8",  dir: "up" },
      { icon: "barbell",  tint: "var(--warn-bg)", color: "var(--warn)",  label: "VO₂ max",          value: "47",      delta: "↑ 13", dir: "up" },
      { icon: "flask",    tint: "#F1ECFD",        color: "#7C3AED",      label: "Blood biomarkers", value: "23/27",   delta: "↑ 14", dir: "up", link: "biomarkers.html" }
    ],
    goal: { label: "Goal weight progress", pct: 87, note: "7 lbs to go to reach your 180 lb goal — on pace for next month." }
  },

  photos: [
    { src: "assets/img/month-1.jpg", alt: "Month 1 — Starting Point, 247 lbs, 31% body fat" },
    { src: "assets/img/month-2.jpg", alt: "Month 2 — First Changes, 238 lbs, 29% body fat" },
    { src: "assets/img/month-3.jpg", alt: "Month 3 — Midway, 226 lbs, 26% body fat" },
    { src: "assets/img/month-4.jpg", alt: "Month 4 — Momentum, 213 lbs, 22% body fat" },
    { src: "assets/img/month-5.jpg", alt: "Month 5 — Getting Lean, 199 lbs, 18% body fat" },
    { src: "assets/img/month-6.jpg", alt: "Month 6 — Transformation, 187 lbs, 14% body fat" }
  ],

  compare: {
    before: { src: "assets/img/month-1.jpg", tag: "MONTH 1", alt: "Month 1 starting point" },
    after:  { src: "assets/img/month-6.jpg", tag: "MONTH 6", alt: "Month 6 result" },
    stats: [
      { label: "WEIGHT",   value: "187 lb", delta: "↓ 60" },
      { label: "BODY FAT", value: "14%",    delta: "↓ 17" },
      { label: "DURATION", value: "6 mo",   small: "Jan–Jun" }
    ]
  },

  prs: [
    { icon: "barbell", name: "Bench Press", was: "Was 135 lbs · Month 1", value: "185 lbs", delta: "+50 lbs" },
    { icon: "barbell", name: "Deadlift",    was: "Was 225 lbs · Month 1", value: "365 lbs", delta: "+140 lbs" },
    { icon: "barbell", name: "Back Squat",  was: "Was 185 lbs · Month 1", value: "285 lbs", delta: "+100 lbs" },
    { icon: "ladder",  name: "5K Run",      was: "Was 32:10 · Month 1",   value: "24:30",   delta: "−7:40 faster" },
    { icon: "ladder",  name: "Pull-ups",    was: "Was 3 reps · Month 1",  value: "12 reps", delta: "+9 reps" },
    { icon: "clock",   name: "Plank Hold",  was: "Was 1:10 · Month 1",    value: "3:45",    delta: "+2:35 longer" }
  ],

  milestones: [
    { done: true,  name: "Lose 25 lbs",                 desc: "Hit in Month 3 — 60 lbs total to date", status: "Completed" },
    { done: true,  name: "Reach 20% body fat",          desc: "Crossed in Month 5 — now at 14%",        status: "Completed" },
    { done: true,  name: "Run a 5K without stopping",   desc: "First continuous 5K in Month 3",         status: "Completed" },
    { done: true,  name: "Log 50 workouts",             desc: "68 sessions logged and counting",        status: "Completed" },
    { done: true,  name: "Bodyweight bench press",      desc: "185 lb bench at 187 lb bodyweight",      status: "Completed" },
    { done: false, name: "Reach 12% body fat",          desc: "2% to go — on track for next month",     status: "In progress" },
    { done: false, name: "Complete first sprint triathlon", desc: "Registered — race in 8 weeks",       status: "Upcoming" }
  ],

  narrative: {
    label: "TRANSFORMATION SUMMARY",
    heading: "Overall snapshot",
    status: "STRONG",
    generatedBy: "Generated by ApexAI",
    paragraphs: [
      `Over the past six months you've dropped <b>60 lbs</b> (247 → 187) and cut body fat from <b>31% to 14%</b>, while <b>adding roughly 8 lbs of lean mass</b> — a recomposition pattern that's well ahead of typical timelines. Cardiorespiratory fitness rose sharply, with <span class="accent">VO₂ max climbing from 34 to 47 mL/kg/min</span>, moving you into the "very active" band for your age cohort.`,
      `These changes are showing up in your labs: <b>14 biomarkers are now trending into optimal range</b> (23 of 27), with the largest gains in your lipid and metabolic panels — ApoB alone has fallen from 112 to 78 mg/dL. You're <b>87% of the way to your 180 lb goal</b> with strength PRs across all major lifts. Priorities for the next block: hold the deficit gently to protect lean mass, and keep an eye on renal markers flagged in your latest health analysis.`
    ]
  }
};
