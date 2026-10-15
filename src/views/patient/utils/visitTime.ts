/**
 * Healthie times look like `2026-11-04 08:30:00 -0500`. Safari's `Date` can't read that form, so
 * it is rewritten to ISO (`2026-11-04T08:30:00-05:00`) before parsing. Only for display — slots
 * are always sent back to the API exactly as received.
 */
export function parseHealthieTime(value: string | null | undefined): Date | null {
  if (!value) return null;
  const m = value.trim().match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2})?)\s*(Z|[+-]\d{2}:?\d{2})?$/);
  const iso = m ? `${m[1]}T${m[2]}${m[3] ? (m[3] === "Z" ? "Z" : m[3].replace(/^([+-]\d{2})(\d{2})$/, "$1:$2")) : ""}` : value;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** The browser's timezone — what availability is searched and shown in. */
export function patientTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";
  } catch {
    return "America/New_York";
  }
}

/** Short zone name for labels, e.g. "EDT". */
export function zoneLabel(date: Date = new Date()): string {
  try {
    return (
      new Intl.DateTimeFormat("en-US", { timeZoneName: "short" })
        .formatToParts(date)
        .find((p) => p.type === "timeZoneName")?.value ?? ""
    );
  } catch {
    return "";
  }
}
