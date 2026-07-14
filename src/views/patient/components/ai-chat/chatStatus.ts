/**
 * Humanises the transient status lines the AI streams while it works.
 *
 * The backend sometimes surfaces raw tool-call statuses such as
 * `"Using tool: get_latest_lab_results..."`, which read as unprofessional in
 * the chat UI. This maps those to friendly, patient-facing phrases by keyword,
 * leaves already-human statuses (e.g. "Analyzing your bloodwork…") alone, and
 * falls back to a safe generic line for any tool we don't explicitly know.
 */

/** Map a lowercased tool name to a friendly, patient-facing status. */
function mapToolToStatus(tool: string): string {
  const has = (...keys: string[]) => keys.some((k) => tool.includes(k));

  if (has("biomarker", "lab", "blood", "panel", "result")) return "Reviewing your lab results…";
  if (has("summary", "analysis", "assessment")) return "Reading your health summary…";
  if (has("report", "document", "file", "upload", "pdf")) return "Going through your documents…";
  if (has("workout", "program", "exercise", "training", "trainerize")) return "Checking your training program…";
  if (has("nutrition", "meal", "diet", "food", "macro")) return "Reviewing your nutrition…";
  if (has("wearable", "vital", "device", "heart", "sleep", "activity", "step")) return "Syncing your wearable data…";
  if (has("appointment", "schedule", "booking", "visit")) return "Checking your appointments…";
  if (has("medication", "treatment", "case", "prescription", "rx", "dose")) return "Reviewing your treatments…";
  if (has("habit", "goal")) return "Looking at your habits…";
  if (has("genetic", "dna", "gene")) return "Reviewing your genetics…";
  if (has("profile", "user", "account", "member")) return "Loading your profile…";
  if (has("search", "lookup", "find", "query", "retrieve", "knowledge", "rag")) return "Searching your health records…";

  return "Reviewing your health data…";
}

/** Collapse a trailing run of dots / ellipsis into a single ellipsis. */
function normalizeEllipsis(text: string): string {
  return /[.…]\s*$/.test(text) ? text.replace(/[.…\s]+$/, "…") : text;
}

/**
 * Turn a raw streamed status into a friendly one. Safe to call on any string;
 * unknown human statuses pass through unchanged (aside from ellipsis tidying).
 */
export function friendlyStatus(raw?: string | null): string {
  const text = String(raw ?? "").trim();
  if (!text) return "Thinking…";

  // Pull out a snake_case identifier if one is present — that's how the
  // backend names its tools (e.g. `get_latest_lab_results`).
  const toolMatch = text.match(/[a-z][a-z0-9]*(?:_[a-z0-9]+)+/i);
  const looksLikeTool = /\b(using|calling|running|invoking)\b|tool\s*:/i.test(text) || Boolean(toolMatch);

  if (!looksLikeTool) return normalizeEllipsis(text);

  const tool = (toolMatch?.[0] ?? text).toLowerCase();
  return mapToolToStatus(tool);
}
