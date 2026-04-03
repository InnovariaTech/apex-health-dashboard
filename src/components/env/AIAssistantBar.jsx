import React, { useState, useRef, useEffect } from "react";
import { useEnvironment } from "@/lib/EnvironmentContext";
import { api } from "@/api/client";
import { Send, Bot, X, ChevronDown, ChevronUp, Sparkles } from "lucide-react";

const EXAMPLE_PROMPTS = [
  "Analyze my bloodwork and recommend treatments",
  "Based on my HRV and recovery, what peptides would help?",
  "What does my testosterone level mean for my health?",
  "Should I consider TRT based on my labs?",
  "How can I improve my sleep score and recovery?",
];

async function loadPatientContext(user) {
  if (!user) return "";
  try {
    const [biomarkers, whoopRecords, habitLogs, checkIns, workoutSessions, healthScores, nutritionLogs, foodLogs] = await Promise.all([
      api.entities.Biomarker.filter({ user_id: user.email }, "-test_date", 5),
      api.entities.WhoopRecovery.filter({ user_id: user.email }, "-record_date", 14),
      api.entities.HabitLog.filter({ user_id: user.email }, "-date", 14),
      api.entities.CheckIn.filter({ user_id: user.email }, "-check_in_date", 3),
      api.entities.WorkoutSession.filter({ user_id: user.email }, "-date", 20),
      api.entities.HealthScoreLog.filter({ user_id: user.email }, "-date", 3),
      api.entities.NutritionPlan.filter({ user_id: user.email }, "-start_date", 1),
      api.entities.FoodLog.filter({ user_id: user.email }, "-date", 7),
    ]);

    const latestBio = biomarkers[0];
    const latestWhoop = whoopRecords[0];
    const latestCheckIn = checkIns[0];
    const latestHealthScore = healthScores[0];
    const latestNutrition = nutritionLogs[0];
    const avgHrv = whoopRecords.length ? Math.round(whoopRecords.reduce((s, r) => s + (r.hrv || 0), 0) / whoopRecords.length) : null;
    const avgRecovery = whoopRecords.length ? Math.round(whoopRecords.reduce((s, r) => s + (r.recovery_score || 0), 0) / whoopRecords.length) : null;
    const avgSleep = whoopRecords.length ? Math.round(whoopRecords.reduce((s, r) => s + (r.sleep_score || 0), 0) / whoopRecords.length) : null;
    const avgRhr = whoopRecords.length ? Math.round(whoopRecords.reduce((s, r) => s + (r.rhr || 0), 0) / whoopRecords.length) : null;
    const completedWorkouts = workoutSessions.filter(s => s.completion_percentage >= 80).length;
    const totalWorkoutMinutes = workoutSessions.reduce((s, w) => s + (w.duration_minutes || 0), 0);
    const avgMood = workoutSessions.length ? workoutSessions.filter(w => w.mood === "excellent" || w.mood === "good").length : 0;
    const totalCalories = foodLogs.reduce((s, f) => s + (f.calories || 0), 0);
    const avgDailyCalories = foodLogs.length ? Math.round(totalCalories / foodLogs.length) : null;
    const avgSleepHours = habitLogs.length ? (habitLogs.reduce((s, h) => s + (h.sleep_hours || 0), 0) / habitLogs.length).toFixed(1) : null;
    const avgStress = habitLogs.length ? Math.round(habitLogs.reduce((s, h) => s + (h.stress_level || 0), 0) / habitLogs.length) : null;
    const avgEnergy = habitLogs.length ? Math.round(habitLogs.reduce((s, h) => s + (h.energy_level || 0), 0) / habitLogs.length) : null;
    const avgWater = habitLogs.length ? Math.round(habitLogs.reduce((s, h) => s + (h.water_intake || 0), 0) / habitLogs.length) : null;
    const avgSteps = habitLogs.length ? Math.round(habitLogs.reduce((s, h) => s + (h.steps || 0), 0) / habitLogs.length) : null;

    let ctx = `PATIENT PROFILE: ${user.full_name || user.email}
Health Score: ${latestHealthScore?.overall_score ?? user.health_score ?? "N/A"}/100
`;

    if (latestBio?.markers) {
      const m = latestBio.markers;
      ctx += `
LATEST BLOODWORK (${latestBio.test_date}):
- Testosterone Total: ${m.testosterone_total ?? "N/A"} ng/dL (optimal: 600-900)
- Testosterone Free: ${m.testosterone_free ?? "N/A"} pg/mL
- Estradiol: ${m.estradiol ?? "N/A"} pg/mL (optimal: 20-30)
- Vitamin D: ${m.vitamin_d ?? "N/A"} ng/mL (optimal: 40-70)
- B12: ${m.b12 ?? "N/A"} pg/mL
- HbA1c: ${m.hemoglobin_a1c ?? "N/A"}% (optimal: <5.7)
- Fasting Glucose: ${m.glucose_fasting ?? "N/A"} mg/dL (optimal: 70-99)
- Total Cholesterol: ${m.cholesterol_total ?? "N/A"} mg/dL
- LDL: ${m.ldl ?? "N/A"} mg/dL (optimal: <100)
- HDL: ${m.hdl ?? "N/A"} mg/dL (optimal: >60)
- Triglycerides: ${m.triglycerides ?? "N/A"} mg/dL (optimal: <150)
- TSH: ${m.tsh ?? "N/A"} mIU/L (optimal: 0.5-2.5)
- Cortisol: ${m.cortisol ?? "N/A"} mcg/dL (optimal: 10-18 AM)
- CRP: ${m.crp ?? "N/A"} mg/L (optimal: <1.0)
- IGF-1: ${m.igf1 ?? "N/A"} ng/mL
`;
    }

    if (avgHrv !== null) {
      ctx += `
WHOOP RECOVERY (7-day averages):
- Average HRV: ${avgHrv} ms (higher is better)
- Average Recovery Score: ${avgRecovery}%
- Average Sleep Score: ${avgSleep}%
- Latest RHR: ${latestWhoop?.rhr ?? "N/A"} bpm
- Latest Recovery: ${latestWhoop?.recovery_score ?? "N/A"}%
`;
    }

    if (latestCheckIn) {
      ctx += `
LATEST CHECK-IN (${latestCheckIn.check_in_date}):
- Weight: ${latestCheckIn.weight ?? "N/A"} lbs
- Body Fat: ${latestCheckIn.body_fat_percentage ?? "N/A"}%
- Workout Adherence: ${latestCheckIn.workout_adherence ?? "N/A"}%
- Nutrition Adherence: ${latestCheckIn.nutrition_adherence ?? "N/A"}%
- Overall Feeling: ${latestCheckIn.overall_feeling ?? "N/A"}
- Wins: ${latestCheckIn.wins ?? "N/A"}
- Challenges: ${latestCheckIn.challenges ?? "N/A"}
`;
    }

    if (habitLogs.length) {
      ctx += `
HABITS (${habitLogs.length}-day averages):
- Avg Sleep: ${avgSleepHours} hrs (Quality: usually ${habitLogs[0].sleep_quality ?? "N/A"})
- Avg Water Intake: ${avgWater} oz/day
- Avg Daily Steps: ${avgSteps?.toLocaleString()}
- Avg Stress Level: ${avgStress}/10
- Avg Energy Level: ${avgEnergy}/10
- Medications Compliance: ${habitLogs.filter(h => h.medications_taken).length}/${habitLogs.length} days
`;
    }

    if (foodLogs.length) {
      ctx += `
NUTRITION (${foodLogs.length}-day sample):
- Avg Daily Calories: ${avgDailyCalories} kcal
- Target Daily Calories: ${latestNutrition?.daily_calories ?? "N/A"}
- Target Protein: ${latestNutrition?.protein_grams ?? "N/A"}g
- Target Carbs: ${latestNutrition?.carbs_grams ?? "N/A"}g
- Target Fat: ${latestNutrition?.fat_grams ?? "N/A"}g
- Food Logs: ${foodLogs.length} meals tracked
`;
    }

    ctx += `
TRAINING PERFORMANCE:
- Completed Sessions (≥80%): ${completedWorkouts}/${workoutSessions.length} sessions
- Total Training Minutes: ${totalWorkoutMinutes} mins
- Avg Session Mood: ${avgMood > 0 ? "Positive" : "Mixed"} (${avgMood}/${workoutSessions.length} positive)
`;

    return ctx;
  } catch (e) {
    return "";
  }
}

export default function AIAssistantBar() {
  const { environment } = useEnvironment();
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [patientContext, setPatientContext] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    api.auth.me().then(user => {
      if (user) loadPatientContext(user).then(setPatientContext);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (messagesEndRef.current && isExpanded) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isExpanded]);

  if (!environment.aiEnabled) return null;

  const isDark = environment.themeMode === "dark";
  const primaryText = environment.id === "planet-fitness" || environment.id === "golds-gym" ? "#000" : "#fff";

  const handleSend = async (text) => {
    const question = text || input.trim();
    if (!question) return;

    setInput("");
    setIsExpanded(true);
    const newMessages = [...messages, { role: "user", content: question }];
    setMessages(newMessages);
    setIsLoading(true);

    const systemPrompt = `You are the ${environment.name} AI Health Assistant — a knowledgeable, clinical-tone wellness advisor. You have access to the patient's real health data below and should use it to give specific, personalized insights.

${patientContext ? `=== PATIENT DATA ===\n${patientContext}\n=== END PATIENT DATA ===\n` : ""}

${environment.aiPromptContext}

Instructions:
- Reference the patient's ACTUAL numbers when answering (e.g. "Your testosterone is 380 ng/dL which is below optimal")
- Be specific: recommend peptides, supplements, lifestyle changes, or medical follow-ups based on their data
- When recommending treatments (TRT, peptides, GLP-1, etc.), explain WHY based on their biomarkers
- Flag anything clinically concerning (e.g. low testosterone, high CRP, poor HRV)
- Mention that recommendations should be confirmed with their Apex MD physician
- Be concise but thorough — bullet points for recommendations work well`;

    const response = await api.integrations.Core.InvokeLLM({
      prompt: `${systemPrompt}\n\nPatient question: ${question}`,
    });

    setMessages([...newMessages, { role: "assistant", content: response }]);
    setIsLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 transition-all duration-300"
      style={{ left: "var(--sidebar-width, 0px)" }}
    >
      {isExpanded && (
        <div
          className="mx-4 mb-2 rounded-xl shadow-2xl border-2 overflow-hidden"
          style={{
            backgroundColor: isDark ? environment.surfaceColor : "#fff",
            borderColor: environment.borderColor,
            maxHeight: "400px",
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: environment.borderColor, backgroundColor: environment.primaryColor }}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" style={{ color: primaryText }} />
              <span className="text-sm font-bold" style={{ color: primaryText }}>
                ApexAI - Personalized Health Advisor
              </span>
              {patientContext && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 font-semibold" style={{ color: primaryText }}>
                  Live Data
                </span>
              )}
            </div>
            <button onClick={() => setIsExpanded(false)}>
              <X className="w-4 h-4" style={{ color: primaryText }} />
            </button>
          </div>

          <div
            className="px-4 py-2 text-xs border-b"
            style={{
              backgroundColor: isDark ? environment.backgroundColor : "#f9fafb",
              color: environment.mutedTextColor,
              borderColor: environment.borderColor,
            }}
          >
            {environment.aiDisclaimer} • AI reads your bloodwork, HRV, and health data for personalized insights.
          </div>

          <div className="overflow-y-auto p-4 space-y-3" style={{ maxHeight: "240px" }}>
            {messages.length === 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold" style={{ color: environment.mutedTextColor }}>
                  Ask about your health data:
                </p>
                {EXAMPLE_PROMPTS.slice(0, 3).map((p) => (
                  <button
                    key={p}
                    onClick={() => handleSend(p)}
                    className="block w-full text-left text-xs px-3 py-2 rounded-lg border transition-all hover:opacity-80"
                    style={{
                      borderColor: environment.borderColor,
                      color: environment.textColor,
                      backgroundColor: isDark ? environment.backgroundColor : environment.surfaceColor,
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className="max-w-[90%] px-3 py-2 rounded-xl text-sm leading-relaxed whitespace-pre-wrap"
                  style={
                    msg.role === "user"
                      ? { backgroundColor: environment.primaryColor, color: primaryText }
                      : {
                          backgroundColor: isDark ? environment.backgroundColor : "#f3f4f6",
                          color: environment.textColor,
                          border: `1px solid ${environment.borderColor}`,
                        }
                  }
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div
                  className="px-3 py-2 rounded-xl text-sm"
                  style={{
                    backgroundColor: isDark ? environment.backgroundColor : "#f3f4f6",
                    color: environment.mutedTextColor,
                    border: `1px solid ${environment.borderColor}`,
                  }}
                >
                  <span className="inline-flex gap-1">
                    <span className="animate-bounce" style={{ animationDelay: "0ms" }}>•</span>
                    <span className="animate-bounce" style={{ animationDelay: "150ms" }}>•</span>
                    <span className="animate-bounce" style={{ animationDelay: "300ms" }}>•</span>
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      <div
        className="mx-4 mb-4 rounded-xl shadow-lg border-2 flex items-center gap-3 px-4 py-3"
        style={{
          backgroundColor: isDark ? environment.surfaceColor : "#fff",
          borderColor: environment.primaryColor,
        }}
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: environment.primaryColor }}
        >
          <Bot className="w-4 h-4" style={{ color: primaryText }} />
        </div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsExpanded(true)}
          placeholder={`Ask ApexAI — analyzes your bloodwork, HRV & more…`}
          className="flex-1 bg-transparent outline-none text-sm font-medium placeholder:font-normal"
          style={{ color: environment.textColor }}
        />
        <button
          onClick={() => setIsExpanded((p) => !p)}
          className="text-gray-400 hover:opacity-70 transition-opacity"
        >
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || isLoading}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-80 disabled:opacity-40"
          style={{ backgroundColor: environment.primaryColor }}
        >
          <Send className="w-4 h-4" style={{ color: primaryText }} />
        </button>
      </div>
    </div>
  );
}