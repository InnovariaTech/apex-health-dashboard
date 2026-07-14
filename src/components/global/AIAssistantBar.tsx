// @ts-nocheck
import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { useEnvironment } from "@/lib/EnvironmentContext";
import { api } from "@/api/client";
import { useStreamAiChatMessage } from "@/hooks/ai-agent/useAi";
import { useAiChatStore } from "@/stores/aiChatStore";
import ChatBlocks from "@/views/patient/components/ai-chat/ChatBlocks";
import { friendlyStatus } from "@/views/patient/components/ai-chat/chatStatus";
import "@/views/patient/components/ai-chat/apexAiChat.css";
import {
  Send,
  Bot,
  X,
  ChevronUp,
  Sparkles,
  Minus,
  Maximize2,
  Minimize2,
  Check,
} from "lucide-react";

// const EXAMPLE_PROMPTS = [
//   "Analyze my bloodwork and recommend treatments",
//   "Based on my HRV and recovery, what peptides would help?",
//   "What does my testosterone level mean for my health?",
//   "Should I consider TRT based on my labs?",
//   "How can I improve my sleep score and recovery?",
// ];

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

const AI_ERROR_TEXT =
  "I ran into a temporary issue while generating your response. Please try again.";
const AI_EMPTY_TEXT =
  "I could not generate a response right now. Please try again.";

/** One assistant turn — renders block cards, or legacy markdown, or a
    streaming status/typing indicator until content lands. */
function AiMessage({ message }) {
  const blocks = message.blocks || [];
  const hasBlocks = blocks.length > 0;
  const legacy = (message.legacyText || "").trim();
  const hasContent = hasBlocks || Boolean(legacy);
  // `done` is set once the stream resolves; until then the turn is in flight.
  const streaming = !message.done && !message.error;

  return (
    <div className="ai-row">
      <div className="ai-av">
        <Sparkles />
      </div>
      <div className="ai-body">
        <div className="ai-name">
          ApexAI
          {message.meta ? <span className="thin"> · {message.meta}</span> : null}
          {streaming ? (
            <span className="ai-live">
              <span className="ai-live-dot" />
              Responding
            </span>
          ) : null}
        </div>

        {hasBlocks && <ChatBlocks blocks={blocks} />}

        {!hasBlocks && legacy && (
          <div className="intro md-block">
            <ReactMarkdown>{message.legacyText}</ReactMarkdown>
          </div>
        )}

        {!hasContent && message.error && (
          <div className="intro">{message.errorText || AI_ERROR_TEXT}</div>
        )}

        {/* In flight, nothing rendered yet — the initial "thinking" state. */}
        {!hasContent && streaming && (
          <div className="ai-status">
            <span className="typing">
              <span />
              <span />
              <span />
            </span>
            {message.status || "Thinking…"}
          </div>
        )}

        {/* In flight, cards already streaming in — signal more is coming so a
            partial response doesn't read as finished. */}
        {hasContent && streaming && (
          <div className="ai-status ai-status-more">
            <span className="typing">
              <span />
              <span />
              <span />
            </span>
            {message.status || "Writing your response…"}
          </div>
        )}

        {/* Turn finished — explicit completion cue. */}
        {hasContent && message.done && !message.error && (
          <div className="ai-done">
            <Check className="ai-done-ic" />
            Response complete
          </div>
        )}
      </div>
    </div>
  );
}

export default function AIAssistantBar() {
  const { environment } = useEnvironment();
  const { stream: streamAiChat } = useStreamAiChatMessage();
  const sessionId = useAiChatStore((s) => s.sessionId);
  const setSessionId = useAiChatStore((s) => s.setSessionId);
  const pendingPrompt = useAiChatStore((s) => s.pendingPrompt);
  const consumePendingPrompt = useAiChatStore((s) => s.consumePendingPrompt);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [patientContext, setPatientContext] = useState("");
  const [disclaimer, setDisclaimer] = useState(environment.aiDisclaimer || "");
  const messagesEndRef = useRef(null);
  const sessionIdRef = useRef(sessionId);
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    setDisclaimer((prev) => prev || environment.aiDisclaimer || "");
  }, [environment.aiDisclaimer]);

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

  const isDark = environment.themeMode === "dark";
  const primaryText = environment.id === "planet-fitness" || environment.id === "golds-gym" ? "#000" : "#fff";

  // Accent variables for the scoped chat surface. Apex MD keeps the mockup's
  // red gradient (CSS default); white-label gyms retint via the env primary.
  const accentStyle =
    environment.id === "apex-md"
      ? { "--chat-on-accent": primaryText }
      : {
          "--chat-accent": environment.primaryColor,
          "--chat-accent-dark": environment.primaryColor,
          "--chat-on-accent": primaryText,
        };

  // Immutably patch the streaming assistant message at `index`.
  const patchAssistant = (index, patch) => {
    setMessages((prev) => {
      const next = [...prev];
      const current = next[index];
      if (current && current.role === "assistant") {
        next[index] =
          typeof patch === "function" ? patch(current) : { ...current, ...patch };
      }
      return next;
    });
  };

  const handleSend = async (text, options = {}) => {
    const { isHidden = false } = options;
    const question = typeof text === "string" ? text : input.trim();
    if (!question) return;

    if (!isHidden) setInput("");
    setIsExpanded(true);
    const baseMessages = isHidden
      ? messages
      : [...messages, { role: "user", text: question }];
    if (!isHidden) setMessages(baseMessages);
    setIsLoading(true);

    // Seed an empty assistant message we stream blocks / text into.
    const assistantIndex = baseMessages.length;
    setMessages([
      ...baseMessages,
      {
        role: "assistant",
        blocks: [],
        legacyText: "",
        status: "",
        error: false,
        done: false,
      },
    ]);

    const currentSessionId = sessionIdRef.current;
    const body = {
      message: question,
      isHidden,
      ...(currentSessionId ? { sessionId: currentSessionId } : {}),
    };

    try {
      const result = await streamAiChat(body, {
        onStatus: (status) => {
          patchAssistant(assistantIndex, (m) => ({ ...m, status: friendlyStatus(status) }));
        },
        onMeta: ({ disclaimer: d }) => {
          if (d) setDisclaimer(d);
        },
        onBlock: (block) => {
          patchAssistant(assistantIndex, (m) => ({
            ...m,
            blocks: [...m.blocks, block],
            status: "",
          }));
        },
        onText: (chunk) => {
          patchAssistant(assistantIndex, (m) => ({
            ...m,
            legacyText: m.legacyText + chunk,
            status: "",
          }));
        },
        onDone: (newSessionId) => {
          if (newSessionId && newSessionId !== sessionIdRef.current) {
            setSessionId(newSessionId);
          }
        },
      });

      // If nothing rendered (no blocks, no legacy text), show a fallback.
      const producedNothing =
        (!result.blocks || result.blocks.length === 0) &&
        !result.fullText.trim();
      if (producedNothing) {
        patchAssistant(assistantIndex, {
          blocks: [],
          legacyText: "",
          status: "",
          error: true,
          errorText: AI_EMPTY_TEXT,
        });
      }
    } catch (error) {
      patchAssistant(assistantIndex, {
        blocks: [],
        legacyText: "",
        status: "",
        error: true,
        errorText: AI_ERROR_TEXT,
      });
    } finally {
      setIsLoading(false);
      // Mark the turn finished so the UI swaps the live indicator for the
      // completion cue (runs on success, empty, and error paths alike).
      patchAssistant(assistantIndex, (m) => ({ ...m, done: true, status: "" }));
    }
  };

  const handleSendRef = useRef(handleSend);
  useEffect(() => {
    handleSendRef.current = handleSend;
  });

  useEffect(() => {
    if (!pendingPrompt) return;
    const prompt = consumePendingPrompt();
    if (!prompt) return;
    handleSendRef.current?.(prompt.message, { isHidden: prompt.isHidden });
  }, [pendingPrompt, consumePendingPrompt]);

  if (!environment.aiEnabled) return null;

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const collapsePanel = () => {
    setIsExpanded(false);
    setIsMaximized(false);
  };

  const panelHeight = isMaximized ? "88vh" : 520;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{ left: "var(--sidebar-width, 0px)" }}
    >
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="ai-panel"
            initial={{ opacity: 0, y: 24, height: 0 }}
            animate={{ opacity: 1, y: 0, height: panelHeight }}
            exit={{ opacity: 0, y: 24, height: 0 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="mx-4 mb-2 rounded-2xl shadow-2xl overflow-hidden border"
            style={{ borderColor: "var(--c-line, #ece7e3)" }}
          >
            <div className="apex-ai-chat" style={accentStyle}>
              {/* Header */}
              <div className="chat-head">
                <div className="spark">
                  <Sparkles />
                </div>
                <div className="head-title">ApexAI — Personalized Health Advisor</div>
                {patientContext && (
                  <div className="live">
                    <span className="dot" />
                    Live Data
                  </div>
                )}
                <div className="win">
                  <button
                    type="button"
                    onClick={collapsePanel}
                    aria-label="Minimize AI assistant"
                    title="Minimize"
                  >
                    <Minus />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMaximized((p) => !p)}
                    aria-label={isMaximized ? "Restore AI assistant" : "Maximize AI assistant"}
                    title={isMaximized ? "Restore" : "Maximize"}
                  >
                    {isMaximized ? <Minimize2 /> : <Maximize2 />}
                  </button>
                  <button
                    type="button"
                    onClick={collapsePanel}
                    aria-label="Close AI assistant"
                    title="Close"
                  >
                    <X />
                  </button>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="disclaimer">
                {disclaimer}{" "}
                <b>ApexAI reads your bloodwork, HRV &amp; health data for personalized insights.</b>
              </div>

              {/* Stream */}
              <div className="stream">
                {messages.length === 0 && (
                  <div className="empty-hint">
                    Ask ApexAI about your bloodwork, recovery, or a plan for the gym.
                  </div>
                )}
                {messages.map((msg, i) =>
                  msg.role === "user" ? (
                    <div className="user-row" key={i}>
                      <div className="user-bubble">{msg.text}</div>
                    </div>
                  ) : (
                    <AiMessage key={i} message={msg} />
                  ),
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Composer */}
              <div className="composer">
                <div className="inp">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask ApexAI — analyzes your bloodwork, HRV &amp; more…"
                  />
                  <button
                    type="button"
                    className="send"
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isLoading}
                    aria-label="Send message"
                  >
                    <Send />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed launcher bar — hidden while the panel is open */}
      {!isExpanded && (
        <div
          className="mx-4 mb-4 rounded-xl shadow-lg border-2 flex items-center gap-3 px-4 py-3 transition-shadow"
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
            onClick={() => setIsExpanded(true)}
            className="w-8 h-8 rounded-lg flex items-center justify-center border-2 transition-all hover:scale-105 active:scale-95"
            style={{
              backgroundColor: `${environment.primaryColor}1a`,
              borderColor: `${environment.primaryColor}55`,
              color: environment.primaryColor,
            }}
            aria-label="Expand AI assistant panel"
            title="Expand chat"
          >
            <ChevronUp className="w-4 h-4" strokeWidth={2.5} />
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
      )}
    </div>
  );
}
