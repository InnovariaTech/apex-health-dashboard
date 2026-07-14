/**
 * Case-title sanitisation.
 *
 * CareValidate auto-names newly created cases "Case for {First} {Last}",
 * which surfaces the patient's own name in the My Cases card and the case
 * overview header. These helpers strip that name so the UI never renders
 * the patient's identity in a case title, falling back to a neutral label
 * when the whole title was just the name.
 */

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Build a full name from a profile / auth record or a case `submitter`
 * object. Returns "" when no name is available.
 */
export function derivePersonName(
  source: unknown,
  fallback?: unknown,
): string {
  const s = (source ?? {}) as Record<string, unknown>;
  const f = (fallback ?? {}) as Record<string, unknown>;

  const first = String(s.firstName ?? "").trim();
  const last = String(s.lastName ?? "").trim();
  if (first || last) return [first, last].filter(Boolean).join(" ");

  const full = String(
    s.full_name ?? s.fullName ?? s.name ?? f.full_name ?? f.fullName ?? "",
  ).trim();
  return full;
}

/**
 * Remove the patient's name from a case title. `patientName` may be a full
 * name ("Muzammil Lone") — each word is stripped so "Case for Muzammil
 * Lone" collapses to a neutral "Care request".
 */
export function sanitizeCaseTitle(
  rawTitle: unknown,
  patientName?: string,
): string {
  const title = String(rawTitle ?? "").trim();
  if (!title) return "Untitled Case";

  // CareValidate's default title is literally "Case for {patient name}", so
  // whenever a title is in that form the remainder IS the patient's name.
  // Collapse it to a neutral label directly — this works even when we don't
  // have the patient's name value to strip word-by-word (the previous bug:
  // an empty name meant nothing was removed and the name showed through).
  if (/^case\s+for\s+\S/i.test(title)) return "Care request";

  let out = title;
  const name = String(patientName ?? "").trim();
  if (name) {
    // Strip the full name first, then each part, so both "Muzammil Lone"
    // and a lone "Muzammil" / "Lone" are removed. Ignore single-character
    // fragments to avoid gutting unrelated words.
    const parts = [name, ...name.split(/\s+/)]
      .map((p) => p.trim())
      .filter((p) => p.length > 1);
    for (const part of parts) {
      out = out.replace(new RegExp(escapeRegExp(part), "gi"), " ");
    }
  }

  // Tidy leftovers: collapse whitespace and drop a dangling connective
  // ("Case for " → "Case").
  out = out
    .replace(/\s{2,}/g, " ")
    .replace(/\b(for|of|—|-)\s*$/i, "")
    .trim();

  // If nothing meaningful survived (the title was only the name), use a
  // neutral label rather than a bare "Case" or an empty string.
  if (!out || /^case$/i.test(out)) return "Care request";
  return out;
}
