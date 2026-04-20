import type { CaseDetailsItem } from "@/types/care-validate/case_types";

export type TimelineStageStatus = "completed" | "current" | "pending";

export interface TimelineStage {
  key: string;
  label: string;
  timestamp: string | null;
  number: number;
  status: TimelineStageStatus;
}

export interface CaseTimelineData {
  statusLabel: string;
  caseShortId: string;
  referralCode: string;
  stages: TimelineStage[];
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function getPromoLikeCode(caseDetails: CaseDetailsItem): string {
  const raw = caseDetails.raw ?? {};
  const referralCode = String(raw.referralCode ?? raw.referral_code ?? "").trim();
  if (referralCode) return referralCode;

  const promoCode = String(
    raw.promoCode ??
      raw.promo_code ??
      raw.discountCode ??
      raw.discount_code ??
      raw.couponCode ??
      raw.coupon_code ??
      ""
  ).trim();

  return promoCode;
}

function getConsultTimestamp(caseDetails: CaseDetailsItem): string | null {
  const raw = caseDetails.raw ?? {};
  const assignedAt = String(raw.assignedAt ?? "").trim();
  if (assignedAt) return assignedAt;

  const calendarEvents = Array.isArray(raw.calendarEvents) ? raw.calendarEvents : [];
  const eventStartsAt = String(toRecord(calendarEvents[0]).startsAt ?? "").trim();
  if (eventStartsAt) return eventStartsAt;

  const activity = Array.isArray(raw.activity) ? raw.activity : [];
  const calendarActivity = activity.find((entry) => {
    const row = toRecord(entry);
    return String(row.type ?? row.activityType ?? "").toUpperCase() === "CALENDAR_EVENT_CREATED";
  });
  const calendarActivityTime = String(
    toRecord(calendarActivity).timestamp ?? toRecord(calendarActivity).createdAt ?? ""
  ).trim();

  return calendarActivityTime || null;
}

function getPrescriptionDecisionTimestamp(caseDetails: CaseDetailsItem): string | null {
  const raw = caseDetails.raw ?? {};
  const decisions = Array.isArray(raw.decisions) ? raw.decisions : [];
  const firstDecision = toRecord(decisions[0]);
  const createdAt = String(firstDecision.createdAt ?? firstDecision.updatedAt ?? "").trim();

  return createdAt || null;
}

export function formatTimelineDate(isoDate: string | null): string | null {
  if (!isoDate) return null;
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return null;

  const month = date.toLocaleString("en-US", { month: "short" });
  const day = date.getDate();
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12 || 12;

  return `${month} ${day} ${hours}:${minutes}${ampm}`;
}

export function deriveCaseTimeline(caseDetails: CaseDetailsItem): CaseTimelineData {
  const raw = caseDetails.raw ?? {};
  const submittedAt = String(caseDetails.raw?.createdAt ?? caseDetails.createdAt ?? "").trim();
  const consultAt = getConsultTimestamp(caseDetails);
  const prescriptionDecisionAt = getPrescriptionDecisionTimestamp(caseDetails);
  const completedAt = String(raw.closedAt ?? "").trim() || null;

  const stagesBase = [
    { key: "submitted", label: "Submitted", timestamp: submittedAt || null },
    { key: "consult", label: "Virtual Consult", timestamp: consultAt },
    { key: "prescription", label: "Prescription Decision", timestamp: prescriptionDecisionAt },
    { key: "completed", label: "Completed", timestamp: completedAt },
  ];

  const allCompleted = stagesBase.every((stage) => Boolean(stage.timestamp));
  const lastCompletedIndex = stagesBase.reduce(
    (lastIndex, stage, index) => (stage.timestamp ? index : lastIndex),
    -1
  );
  const activeIndex = allCompleted ? stagesBase.length - 1 : Math.max(lastCompletedIndex, 0);

  const stages: TimelineStage[] = stagesBase.map((stage, index) => ({
    ...stage,
    number: index + 1,
    status: allCompleted
      ? "completed"
      : index < activeIndex
        ? "completed"
        : index === activeIndex
          ? "current"
          : "pending",
  }));

  return {
    statusLabel: stages[activeIndex]?.label ?? "Submitted",
    caseShortId: String(caseDetails.shortId ?? caseDetails.id ?? ""),
    referralCode: getPromoLikeCode(caseDetails),
    stages,
  };
}

