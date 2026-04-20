import type { CaseDetailsItem } from "@/types/care-validate/case_types";

export type AppointmentStatus =
  | "SCHEDULED"
  | "ACCEPTED_BY_PROVIDER"
  | "EXPIRED"
  | "COMPLETED"
  | "MISSED_BY_PROVIDER"
  | "MISSED_BY_PATIENT"
  | "NEEDS_RESCHEDULING";

export interface NormalizedAppointment {
  id: string;
  title: string;
  source: string;
  startsAt: Date;
  endsAt: Date;
  timezone: string;
  durationMinutes: number;
  meetingType: string;
  rawStatus: string;
  status: AppointmentStatus;
  providerName: string;
  notes: string;
  createdAt: string;
}

interface NormalizedAppointmentInput {
  id: string;
  title: string;
  source: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  durationMinutes?: number;
  meetingType: string;
  status: string;
  acceptedByProvider?: boolean;
  providerNoShow?: boolean;
  patientNoShow?: boolean;
  rescheduledId?: string;
  providerName: string;
  notes: string;
  createdAt: string;
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function cleanString(value: unknown): string {
  return String(value ?? "").trim();
}

function parseDate(value: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function defaultTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

function formatPersonName(person: unknown): string {
  const row = toRecord(person);
  const firstName = cleanString(row.firstName);
  const lastName = cleanString(row.lastName);
  const title = cleanString(row.title);
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  if (!fullName) return "";
  return title ? `${fullName}, ${title}` : fullName;
}

function deriveAppointmentStatus(input: NormalizedAppointmentInput): AppointmentStatus {
  const now = new Date();
  const endDate = parseDate(input.endsAt);
  const isPast = endDate ? endDate.getTime() < now.getTime() : false;
  const rawStatus = cleanString(input.status).toUpperCase();

  if (isPast) {
    if (input.providerNoShow) return "MISSED_BY_PROVIDER";
    if (input.patientNoShow) return "MISSED_BY_PATIENT";
    if ((input.providerNoShow || input.patientNoShow) && !input.rescheduledId) {
      return "NEEDS_RESCHEDULING";
    }
    if (rawStatus === "COMPLETED") return "COMPLETED";
    if (rawStatus === "SCHEDULED") return "EXPIRED";
  }

  if (!isPast && rawStatus === "SCHEDULED") {
    return input.acceptedByProvider ? "ACCEPTED_BY_PROVIDER" : "SCHEDULED";
  }

  if (rawStatus === "COMPLETED") return "COMPLETED";

  return "SCHEDULED";
}

function normalizeAppointment(input: NormalizedAppointmentInput): NormalizedAppointment | null {
  const startsAt = parseDate(input.startsAt);
  const endsAt = parseDate(input.endsAt);

  if (!startsAt || !endsAt) return null;

  const durationMinutes =
    typeof input.durationMinutes === "number" && Number.isFinite(input.durationMinutes)
      ? input.durationMinutes
      : Math.max(1, Math.round((endsAt.getTime() - startsAt.getTime()) / 60000));

  return {
    id: input.id,
    title: input.title,
    source: input.source,
    startsAt,
    endsAt,
    timezone: input.timezone || defaultTimezone(),
    durationMinutes,
    meetingType: input.meetingType || "outbound_call",
    rawStatus: input.status,
    status: deriveAppointmentStatus(input),
    providerName: input.providerName,
    notes: input.notes,
    createdAt: input.createdAt,
  };
}

function getSubmitterName(caseDetails: CaseDetailsItem): string {
  const submitter = caseDetails.raw?.submitter;
  if (!submitter) return "Patient";
  const fullName = [submitter.firstName, submitter.lastName]
    .map((part) => cleanString(part))
    .filter(Boolean)
    .join(" ");
  return fullName || "Patient";
}

function extractFromCalendarEvents(caseDetails: CaseDetailsItem): NormalizedAppointment[] {
  const calendarEvents = Array.isArray(caseDetails.raw?.calendarEvents)
    ? caseDetails.raw.calendarEvents
    : [];
  const submitterName = getSubmitterName(caseDetails);

  return calendarEvents
    .map((event, index) => {
      const row = toRecord(event);
      const startsAt = cleanString(row.startsAt ?? row.startTime ?? row.start);
      const endsAt = cleanString(row.endsAt ?? row.endTime ?? row.end);

      return normalizeAppointment({
        id: cleanString(row.id) || `calendar-event-${index}`,
        title: cleanString(row.title) || `Case for ${submitterName}`,
        source: cleanString(row.source) || "calendly",
        startsAt,
        endsAt,
        timezone: cleanString(row.timezone) || defaultTimezone(),
        durationMinutes:
          typeof row.durationMinutes === "number" ? row.durationMinutes : undefined,
        meetingType: cleanString(row.meetingType) || "outbound_call",
        status: cleanString(row.status) || "SCHEDULED",
        acceptedByProvider: Boolean(
          row.acceptedByProvider || row.providerAccepted || row.assignedProviderId
        ),
        providerNoShow: Boolean(row.providerNoShow),
        patientNoShow: Boolean(row.patientNoShow),
        rescheduledId: cleanString(row.rescheduledId),
        providerName:
          formatPersonName(row.provider) ||
          cleanString(row.providerName) ||
          cleanString(row.assignedProviderName),
        notes: cleanString(row.notes) || cleanString(row.description),
        createdAt: cleanString(row.createdAt),
      });
    })
    .filter((event): event is NormalizedAppointment => event !== null);
}

function extractProviderFromActivityText(valueAfter: string): string {
  const match = valueAfter.match(/by (.+?)(?:\s+[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})?$/);
  if (!match) return "Provider";
  return cleanString(match[1]) || "Provider";
}

function extractFromActivityFallback(caseDetails: CaseDetailsItem): NormalizedAppointment[] {
  const activity = Array.isArray(caseDetails.raw?.activity) ? caseDetails.raw.activity : [];
  const submitterName = getSubmitterName(caseDetails);

  return activity
    .map((entry, index) => {
      const row = toRecord(entry);
      const type = cleanString(row.type ?? row.activityType).toUpperCase();
      if (type !== "CALENDAR_EVENT_CREATED") return null;

      const timestamp = cleanString(row.timestamp ?? row.createdAt);
      const start = parseDate(timestamp);
      if (!start) return null;
      const end = new Date(start.getTime() + 30 * 60000);
      const valueAfter = cleanString(row.valueAfter ?? row.message ?? row.note);

      return normalizeAppointment({
        id: cleanString(row.id) || `calendar-activity-${index}`,
        title: `Case for ${submitterName}`,
        source: "calendly",
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        timezone: defaultTimezone(),
        durationMinutes: 30,
        meetingType: "outbound_call",
        status: "SCHEDULED",
        acceptedByProvider: true,
        providerName: extractProviderFromActivityText(valueAfter),
        notes: valueAfter || `Meeting Created via Calendly - Case for ${submitterName}`,
        createdAt: timestamp || start.toISOString(),
      });
    })
    .filter((event): event is NormalizedAppointment => event !== null);
}

export function extractAppointments(caseDetails: CaseDetailsItem): NormalizedAppointment[] {
  const fromCalendar = extractFromCalendarEvents(caseDetails);
  const events = fromCalendar.length > 0 ? fromCalendar : extractFromActivityFallback(caseDetails);

  return events.sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime());
}

export function formatInTimezone(date: Date, timezone: string): string {
  const datePart = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: timezone,
  }).format(date);

  const timePart = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: timezone,
  }).format(date);

  return `${datePart} at ${timePart}`;
}

export function formatAppointmentRange(appointment: NormalizedAppointment): string {
  const start = formatInTimezone(appointment.startsAt, appointment.timezone);
  const end = formatInTimezone(appointment.endsAt, appointment.timezone);
  return `${start} - ${end} (${appointment.timezone})`;
}

export function formatMeetingType(type: string): string {
  const map: Record<string, string> = {
    outbound_call: "Outbound Call",
    inbound_call: "Inbound Call",
    video: "Video",
    in_person: "In-Person",
  };

  return map[type] || type || "Call";
}

