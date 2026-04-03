/**
 * In-memory mock API replacing Base44 SDK / backend calls for local-only development.
 */
import { format } from "date-fns";

export const DEMO_EMAIL = "demo@apexhealth.local";

let idSeq = 1;
const nextId = (prefix) => `${prefix}_${idSeq++}`;

function parseSort(sortStr) {
  if (!sortStr) return { field: "created_date", desc: true };
  const desc = String(sortStr).startsWith("-");
  const field = desc ? sortStr.slice(1) : sortStr;
  return { field, desc };
}

function sortRows(rows, sortStr) {
  const { field, desc } = parseSort(sortStr);
  return [...rows].sort((a, b) => {
    const av = a[field];
    const bv = b[field];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    let cmp = 0;
    if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
    else cmp = String(av).localeCompare(String(bv));
    return desc ? -cmp : cmp;
  });
}

function matchesQuery(row, query) {
  if (!query || Object.keys(query).length === 0) return true;
  return Object.entries(query).every(([k, v]) => row[k] === v);
}

function clone(row) {
  return JSON.parse(JSON.stringify(row));
}

function createStore(name, initialRows, idKey = "id") {
  let rows = initialRows.map((r) => ({ ...r }));

  return {
    list(sortStr) {
      const sorted = sortRows(rows, sortStr || "-created_date");
      return Promise.resolve(sorted.map(clone));
    },
    filter(query, sortStr, limit) {
      let filtered = rows.filter((r) => matchesQuery(r, query));
      filtered = sortRows(filtered, sortStr || "-created_date");
      if (limit != null) filtered = filtered.slice(0, limit);
      return Promise.resolve(filtered.map(clone));
    },
    create(data) {
      const id = data[idKey] ?? nextId(name);
      const row = {
        ...data,
        [idKey]: id,
        created_date: data.created_date ?? new Date().toISOString(),
      };
      rows.push(row);
      return Promise.resolve(clone(row));
    },
    update(id, patch) {
      const idx = rows.findIndex((r) => r[idKey] === id);
      if (idx < 0) return Promise.reject(new Error(`${name} not found`));
      rows[idx] = { ...rows[idx], ...patch };
      return Promise.resolve(clone(rows[idx]));
    },
    delete(id) {
      const idx = rows.findIndex((r) => r[idKey] === id);
      if (idx < 0) return Promise.reject(new Error(`${name} not found`));
      rows.splice(idx, 1);
      return Promise.resolve();
    },
  };
}

// ─── Seed users ─────────────────────────────────────────────────────────────
const initialUsers = [
  {
    email: DEMO_EMAIL,
    full_name: "Demo User",
    role: "admin",
    current_program_id: "wp1",
    health_score: 78,
    idevaffiliate_id: "AFF-DEMO-001",
    created_date: "2024-01-01T00:00:00.000Z",
  },
  {
    email: "dr.care@apexhealth.local",
    full_name: "Dr. Care Team",
    role: "admin",
    current_program_id: null,
    health_score: 90,
    created_date: "2024-01-02T00:00:00.000Z",
  },
  {
    email: "client@example.com",
    full_name: "Jane Client",
    role: "user",
    current_program_id: "wp1",
    health_score: 72,
    created_date: "2024-01-03T00:00:00.000Z",
  },
];

const userStore = {
  list() {
    return Promise.resolve(initialUsers.map((u) => ({ ...u })));
  },
  update(email, patch) {
    const idx = initialUsers.findIndex((u) => u.email === email);
    if (idx < 0) return Promise.reject(new Error("User not found"));
    initialUsers[idx] = { ...initialUsers[idx], ...patch };
    return Promise.resolve({ ...initialUsers[idx] });
  },
};

// ─── Auth ───────────────────────────────────────────────────────────────────
export const mockAuth = {
  me: () => Promise.resolve({ ...initialUsers[0] }),
  updateMe: (form) => {
    initialUsers[0] = { ...initialUsers[0], ...form };
    return Promise.resolve({ ...initialUsers[0] });
  },
  logout: () => {},
  redirectToLogin: () => {},
};

// ─── Workout plans ──────────────────────────────────────────────────────────
const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const workoutDays = dayNames.slice(1).map((day, i) => ({
  day,
  name: `${day} Session`,
  duration_minutes: 45 + i * 5,
  focus: i % 2 === 0 ? "Strength" : "Hypertrophy",
}));

const workoutPlans = createStore("WorkoutPlan", [
  {
    id: "wp1",
    name: "Apex Strength Block",
    description: "8-week progressive overload program",
    created_date: "2024-06-01T00:00:00.000Z",
    workouts: workoutDays,
  },
]);

// ─── Exercises ──────────────────────────────────────────────────────────────
const exercises = createStore("Exercise", [
  {
    id: "ex1",
    name: "Barbell Bench Press",
    category: "strength",
    difficulty: "intermediate",
    muscle_groups: ["chest", "triceps"],
    instructions: "Retract scapula, controlled descent.",
    created_date: "2024-05-01T00:00:00.000Z",
  },
  {
    id: "ex2",
    name: "Back Squat",
    category: "strength",
    difficulty: "intermediate",
    muscle_groups: ["quads", "glutes"],
    instructions: "Break at hips and knees together.",
    created_date: "2024-05-02T00:00:00.000Z",
  },
  {
    id: "ex3",
    name: "Romanian Deadlift",
    category: "strength",
    difficulty: "beginner",
    muscle_groups: ["hamstrings", "glutes"],
    instructions: "Hinge at hips with soft knees.",
    created_date: "2024-05-03T00:00:00.000Z",
  },
]);

// ─── Workout sessions ───────────────────────────────────────────────────────
const todayStr = format(new Date(), "yyyy-MM-dd");
const workoutSessions = createStore("WorkoutSession", [
  {
    id: "ws1",
    user_id: DEMO_EMAIL,
    date: todayStr,
    workout_name: "Push Day",
    duration_minutes: 52,
    completion_percentage: 100,
    mood: "excellent",
    exercises_completed: [],
    created_date: new Date().toISOString(),
  },
  {
    id: "ws2",
    user_id: DEMO_EMAIL,
    date: format(new Date(Date.now() - 86400000), "yyyy-MM-dd"),
    workout_name: "Leg Day",
    duration_minutes: 60,
    completion_percentage: 92,
    mood: "good",
    exercises_completed: [],
    created_date: new Date().toISOString(),
  },
  {
    id: "ws3",
    user_id: "client@example.com",
    date: todayStr,
    workout_name: "Cardio",
    duration_minutes: 35,
    completion_percentage: 88,
    mood: "good",
    exercises_completed: [],
    created_date: new Date().toISOString(),
  },
]);

// ─── Habits & check-ins ─────────────────────────────────────────────────────
const habitLogs = createStore("HabitLog", [
  {
    id: "hl_today",
    user_id: DEMO_EMAIL,
    date: todayStr,
    water_intake: 48,
    sleep_hours: 7.5,
    steps: 7800,
    energy_level: 8,
    stress_level: 4,
    sleep_quality: "good",
    medications_taken: true,
    created_date: new Date().toISOString(),
  },
]);

const checkIns = createStore("CheckIn", [
  {
    id: "ci1",
    user_id: DEMO_EMAIL,
    check_in_date: format(new Date(Date.now() - 7 * 86400000), "yyyy-MM-dd"),
    weight: 182,
    body_fat_percentage: 16,
    workout_adherence: 85,
    nutrition_adherence: 78,
    overall_feeling: "good",
    wins: "Hit all lifting sessions",
    challenges: "Sleep on travel days",
    created_date: new Date().toISOString(),
  },
]);

// ─── Biomarkers & recovery ─────────────────────────────────────────────────
const biomarkers = createStore("Biomarker", [
  {
    id: "bio1",
    user_id: DEMO_EMAIL,
    test_date: "2025-03-01T12:00:00.000Z",
    markers: {
      testosterone_total: 580,
      testosterone_free: 110,
      estradiol: 22,
      vitamin_d: 45,
      b12: 650,
      hemoglobin_a1c: 5.2,
      glucose_fasting: 88,
      cholesterol_total: 195,
      ldl: 95,
      hdl: 55,
      triglycerides: 90,
      tsh: 1.4,
      cortisol: 14,
      crp: 0.8,
      igf1: 210,
    },
    created_date: "2025-03-01T00:00:00.000Z",
  },
  {
    id: "bio2",
    user_id: "john_doe",
    test_date: "2025-02-15T12:00:00.000Z",
    markers: {
      testosterone_total: 420,
      vitamin_d: 38,
      hemoglobin_a1c: 5.4,
    },
    created_date: "2025-02-15T00:00:00.000Z",
  },
]);

const whoopRecovery = createStore("WhoopRecovery", [
  {
    id: "w1",
    user_id: DEMO_EMAIL,
    record_date: format(new Date(), "yyyy-MM-dd"),
    recovery_score: 72,
    sleep_score: 84,
    hrv: 68,
    rhr: 52,
    created_date: new Date().toISOString(),
  },
  {
    id: "w2",
    user_id: DEMO_EMAIL,
    record_date: format(new Date(Date.now() - 86400000), "yyyy-MM-dd"),
    recovery_score: 65,
    sleep_score: 78,
    hrv: 61,
    rhr: 55,
    created_date: new Date().toISOString(),
  },
]);

const healthScoreLog = createStore("HealthScoreLog", [
  {
    id: "hs1",
    user_id: DEMO_EMAIL,
    date: todayStr,
    overall_score: 78,
    created_date: new Date().toISOString(),
  },
]);

// ─── Nutrition ──────────────────────────────────────────────────────────────
const nutritionPlans = createStore("NutritionPlan", [
  {
    id: "np1",
    user_id: DEMO_EMAIL,
    start_date: "2025-01-01T00:00:00.000Z",
    daily_calories: 2400,
    protein_grams: 180,
    carbs_grams: 220,
    fat_grams: 70,
    created_date: "2025-01-01T00:00:00.000Z",
  },
]);

const foodLogs = createStore("FoodLog", [
  {
    id: "fl1",
    user_id: DEMO_EMAIL,
    date: todayStr,
    meal_type: "breakfast",
    food_name: "Oats & eggs",
    calories: 520,
    protein_grams: 32,
    carbs_grams: 48,
    fat_grams: 18,
    fiber_grams: 6,
    created_date: new Date().toISOString(),
  },
]);

// ─── Messaging ─────────────────────────────────────────────────────────────
const threadProvider = [DEMO_EMAIL, "dr.care@apexhealth.local", "provider"].sort().join("-");
const threadAdminClient = [DEMO_EMAIL, "client@example.com"].sort().join("-");
const messages = createStore("Message", [
  {
    id: "m1",
    from_user_id: DEMO_EMAIL,
    to_user_id: "dr.care@apexhealth.local",
    thread_id: threadProvider,
    message_text: "Hi, quick question about my labs.",
    is_read: true,
    created_date: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "m2",
    from_user_id: "dr.care@apexhealth.local",
    to_user_id: DEMO_EMAIL,
    thread_id: threadProvider,
    message_text: "Happy to help — which markers are you concerned about?",
    is_read: false,
    created_date: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: "m3",
    from_user_id: "client@example.com",
    to_user_id: DEMO_EMAIL,
    thread_id: threadAdminClient,
    message_text: "Can we review my program this week?",
    is_read: false,
    created_date: new Date(Date.now() - 900000).toISOString(),
  },
]);

// ─── Rewards & referrals ───────────────────────────────────────────────────
const rewardChallenges = createStore("RewardChallenge", [
  {
    id: "c1",
    title: "April Check-In Blitz",
    description: "Check in 20 times this month.",
    challenge_type: "check_ins",
    goal_value: 20,
    points_reward: 500,
    start_date: "2026-04-01",
    end_date: "2026-04-30",
    is_active: true,
    created_date: "2026-04-01T00:00:00.000Z",
  },
]);

const challengeEntries = createStore("ChallengeEntry", [
  {
    id: "e1",
    challenge_id: "c1",
    user_id: DEMO_EMAIL,
    current_value: 13,
    completed: false,
    points_earned: 0,
    created_date: new Date().toISOString(),
  },
]);

const rewardPoints = createStore("RewardPoints", [
  {
    id: "rp1",
    user_id: DEMO_EMAIL,
    total_points: 650,
    redeemable_points: 300,
    created_date: new Date().toISOString(),
  },
]);

const referrals = createStore("Referral", [
  {
    id: "r1",
    referrer_user_id: DEMO_EMAIL,
    referred_name: "Marcus Johnson",
    referred_email: "marcus.j@gmail.com",
    status: "converted",
    points_awarded: 200,
    created_date: new Date().toISOString(),
  },
]);

// ─── Orders & documents ───────────────────────────────────────────────────
const orders = createStore("Order", [
  {
    id: "o1",
    user_id: DEMO_EMAIL,
    total: 129.0,
    status: "fulfilled",
    created_date: new Date().toISOString(),
  },
  {
    id: "o2",
    user_id: "client@example.com",
    total: 89.5,
    status: "processing",
    created_date: new Date(Date.now() - 86400000).toISOString(),
  },
]);

const patientDocuments = createStore("PatientDocument", [
  {
    id: "pd1",
    user_id: DEMO_EMAIL,
    file_name: "sample-labs.pdf",
    file_url: "https://mock.local/docs/sample-labs.pdf",
    document_type: "lab_results",
    document_date: "2025-02-01",
    provider: "Apex MD Lab",
    notes: "Mock document",
    is_encrypted: true,
    ai_summary: null,
    created_date: new Date().toISOString(),
  },
]);

const patientSupportMessages = createStore("PatientSupportMessage", [
  {
    id: "psm1",
    user_id: DEMO_EMAIL,
    message_text: "Question about billing",
    sender_type: "patient",
    category: "billing",
    is_urgent: false,
    is_read: true,
    created_date: new Date().toISOString(),
  },
]);

// ─── Health page entities ───────────────────────────────────────────────────
const genomicData = createStore("GenomicData", [
  {
    id: "g1",
    user_id: DEMO_EMAIL,
    test_date: "2024-11-01T00:00:00.000Z",
    summary: "MTHFR heterozygous; ACTN3 power-oriented profile.",
    genetic_markers: { apoe_genotype: "E3/E3" },
    health_risks: [{ name: "Metabolic", level: "low" }],
    created_date: "2024-11-01T00:00:00.000Z",
  },
]);

const performanceMetrics = createStore("PerformanceMetric", [
  {
    id: "pm1",
    user_id: DEMO_EMAIL,
    test_date: "2025-01-10T00:00:00.000Z",
    metric_type: "vo2max",
    vo2max: 48,
    created_date: "2025-01-10T00:00:00.000Z",
  },
]);

// ─── Integrations (LLM / uploads) ───────────────────────────────────────────
function mockObjectFromSchema(schema) {
  const props = schema?.properties || {};
  const out = {};
  for (const [key, prop] of Object.entries(props)) {
    if (prop.type === "array") {
      if (key === "top_insights") {
        out[key] = [
          {
            title: "Biomarker snapshot",
            detail:
              "Mock data: key markers appear within typical review ranges; confirm with your clinician.",
          },
          {
            title: "Recovery trend",
            detail: "Mock data: training volume and recovery scores look consistent.",
          },
        ];
      } else if (key === "monitoring_priorities") {
        out[key] = ["Repeat labs in 3–6 months", "Track sleep and HRV weekly"];
      } else {
        out[key] = [];
      }
    } else if (prop.type === "string") {
      if (key === "food_name") out[key] = "Mock meal (offline demo)";
      else if (key === "serving_size") out[key] = "1 plate (estimated)";
      else if (key === "overall_summary" || key.includes("notes") || key.includes("gut") || key.includes("training")) {
        out[key] =
          "This is placeholder mock analysis. Connect a real LLM service for production insights.";
      } else {
        out[key] = "Mock value";
      }
    } else if (prop.type === "number") {
      if (key.includes("calories")) out[key] = 520;
      else if (key.includes("protein")) out[key] = 38;
      else if (key.includes("carbs")) out[key] = 45;
      else if (key.includes("fat")) out[key] = 18;
      else if (key.includes("fiber")) out[key] = 6;
      else out[key] = 0;
    } else if (prop.type === "object" && prop.properties) {
      out[key] = mockObjectFromSchema(prop);
    }
  }
  return out;
}

export async function mockInvokeLLM(params) {
  const { prompt, response_json_schema } = params;
  if (response_json_schema?.properties) {
    return mockObjectFromSchema(response_json_schema);
  }
  const p = (prompt || "").slice(0, 200);
  return `[Mock AI — offline]\n\nNo backend LLM is configured. This is static placeholder text.\n\nPrompt preview:\n${p}${(prompt || "").length > 200 ? "…" : ""}`;
}

export async function mockUploadFile({ file }) {
  if (typeof URL !== "undefined" && file && URL.createObjectURL) {
    try {
      return { file_url: URL.createObjectURL(file) };
    } catch {
      /* fall through */
    }
  }
  const name = file?.name || "upload.bin";
  return { file_url: `https://mock.local/uploads/${encodeURIComponent(name)}` };
}

export const mockIntegrations = {
  Core: {
    InvokeLLM: mockInvokeLLM,
    UploadFile: mockUploadFile,
  },
};

/** In-memory implementation — swap `src/api/client.js` to use HTTP when backend exists. */
export const api = {
  auth: mockAuth,
  entities: {
    User: userStore,
    Exercise: exercises,
    WorkoutPlan: workoutPlans,
    WorkoutSession: workoutSessions,
    HabitLog: habitLogs,
    CheckIn: checkIns,
    Biomarker: biomarkers,
    WhoopRecovery: whoopRecovery,
    HealthScoreLog: healthScoreLog,
    NutritionPlan: nutritionPlans,
    FoodLog: foodLogs,
    Message: messages,
    RewardChallenge: rewardChallenges,
    ChallengeEntry: challengeEntries,
    RewardPoints: rewardPoints,
    Referral: referrals,
    Order: orders,
    PatientDocument: patientDocuments,
    PatientSupportMessage: patientSupportMessages,
    GenomicData: genomicData,
    PerformanceMetric: performanceMetrics,
  },
  integrations: mockIntegrations,
};

// ─── Entity-style exports for `src/entities/*` ─────────────────────────────
export const User = {
  me: () => mockAuth.me(),
  list: () => userStore.list(),
  update: (email, data) => userStore.update(email, data),
};

export const Exercise = {
  list: (sort) => exercises.list(sort),
  create: (data) => exercises.create(data),
  update: (id, data) => exercises.update(id, data),
  delete: (id) => exercises.delete(id),
};

export const FoodLog = {
  filter: (q, s, l) => foodLogs.filter(q, s, l),
  create: (data) => foodLogs.create(data),
  delete: (id) => foodLogs.delete(id),
};

export const NutritionPlan = {
  filter: (q, s, l) => nutritionPlans.filter(q, s, l),
  create: (data) => nutritionPlans.create(data),
  update: (id, data) => nutritionPlans.update(id, data),
};

export const Biomarker = {
  filter: (q, s, l) => biomarkers.filter(q, s, l),
};

export const GenomicData = {
  filter: (q, s, l) => genomicData.filter(q, s, l),
};

export const PerformanceMetric = {
  filter: (q, s, l) => performanceMetrics.filter(q, s, l),
};

export const PatientSupportMessage = {
  filter: (q, s, l) => patientSupportMessages.filter(q, s, l),
  create: (data) => patientSupportMessages.create(data),
  update: (id, data) => patientSupportMessages.update(id, data),
};

export const UploadFile = mockUploadFile;
export const InvokeLLM = mockInvokeLLM;
