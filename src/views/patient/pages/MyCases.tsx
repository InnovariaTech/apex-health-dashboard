import { useMemo } from "react";
import { getRecentCasesDateRange, useCases } from "@/hooks/care-validate/useCases";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import type { CaseItem } from "@/types/care-validate/case_types";

interface AssigneeInitial {
  id: string;
  initials: string;
}

interface CaseStatusTheme {
  cardClassName: string;
  badgeClassName: string;
  avatarClassName: string;
}

function getCaseStatusTheme(status: string): CaseStatusTheme {
  switch (status) {
    case "Completed":
      return {
        cardClassName: "border-emerald-200 bg-emerald-50/40",
        badgeClassName: "border-emerald-300 text-emerald-700 bg-emerald-50",
        avatarClassName: "bg-emerald-100 text-emerald-700",
      };
    case "Virtual Consult":
      return {
        cardClassName: "border-violet-200 bg-violet-50/40",
        badgeClassName: "border-violet-300 text-violet-700 bg-violet-50",
        avatarClassName: "bg-violet-100 text-violet-700",
      };
    case "Prescription Decision":
      return {
        cardClassName: "border-amber-200 bg-amber-50/40",
        badgeClassName: "border-amber-300 text-amber-700 bg-amber-50",
        avatarClassName: "bg-amber-100 text-amber-700",
      };
    default:
      return {
        cardClassName: "border-primary/30 bg-primary/5",
        badgeClassName: "border-primary/30 text-primary bg-primary/10",
        avatarClassName: "bg-primary/15 text-primary",
      };
  }
}

function deriveCaseStatus(caseItem: CaseItem): string {
  const raw = caseItem.raw ?? {};
  const status = String(caseItem.status || raw.status || "").toUpperCase();
  const closedAt = raw.closedAt;
  const activities = Array.isArray(raw.activity) ? raw.activity : [];
  const decisions = Array.isArray(raw.decisions) ? raw.decisions : [];

  const hasActivityType = (target: string) =>
    activities.some((entry: unknown) => {
      const row = (entry ?? {}) as Record<string, unknown>;
      const type = String(row.type ?? row.activityType ?? "").toUpperCase();
      return type === target;
    });

  const activityContains = (keyword: string) =>
    activities.some((entry: unknown) => {
      const row = (entry ?? {}) as Record<string, unknown>;
      const text = [
        row.note,
        row.value,
        row.message,
        row.comment,
        row.description,
      ]
        .filter(Boolean)
        .map((part) => String(part).toLowerCase())
        .join(" ");
      return text.includes(keyword.toLowerCase());
    });

  if (closedAt || status === "CLOSED") return "Completed";

  if (
    decisions.length > 0 ||
    hasActivityType("PRESCRIPTION_DECISION") ||
    hasActivityType("CREATE_CASE_DECISION") ||
    hasActivityType("UPDATE_CASE_DECISION")
  ) {
    return "Prescription Decision";
  }

  if (
    activityContains("virtual consult") ||
    activityContains("consultation") ||
    activityContains("telehealth") ||
    hasActivityType("SCHEDULE_CONSULT") ||
    hasActivityType("COMPLETE_CONSULT")
  ) {
    return "Virtual Consult";
  }
  if (status === "IN_PROGRESS" || raw.inProgressAt || hasActivityType("CREATE_CASE")) {
    return "Submitted";
  }

  return "Submitted";
}

function getAssigneeInitials(caseItem: CaseItem): AssigneeInitial[] {
  const assignees = Array.isArray(caseItem?.raw?.assignees)
    ? caseItem.raw.assignees
    : [];

  return assignees
    .map((entry: unknown) => {
      const normalized = (entry ?? {}) as Record<string, unknown>;
      const personRaw =
        normalized.assignee && typeof normalized.assignee === "object"
          ? normalized.assignee
          : normalized;
      const person = personRaw as Record<string, unknown>;
      const firstInitial = String(person.firstName || "").trim().charAt(0).toUpperCase();
      const lastInitial = String(person.lastName || "").trim().charAt(0).toUpperCase();
      const initials = `${firstInitial}${lastInitial}`.trim();

      if (!initials) return null;

      return {
        id: String(person.id || `${person.firstName || ""}-${person.lastName || ""}`),
        initials,
      };
    })
    .filter((item): item is AssigneeInitial => item !== null);
}

export default function MyCases() {
  const navigate = useNavigate();
  const dateRange = useMemo(() => getRecentCasesDateRange(), []);
  const { data: cases = [], isLoading, isError } = useCases({
    startTime: dateRange.startTime,
    endTime: dateRange.endTime,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-foreground">My Cases</h1>
      <p className="text-muted-foreground mt-2">Track your active and past care requests.</p>

      {isError && (
        <p className="text-sm text-destructive mt-4">
          Unable to load cases right now. Please refresh and try again.
        </p>
      )}

      {cases.length === 0 ? (
        <p className="text-muted-foreground mt-6">No case details available yet.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {cases.map((caseItem) => {
            const assigneeInitials = getAssigneeInitials(caseItem);
            const caseTitle = caseItem.title || caseItem.raw?.title || "Untitled Case";
            const caseShortId = caseItem.shortId || caseItem.raw?.shortId || caseItem.id;
            const caseCreatedAt = caseItem.createdAt || caseItem.raw?.createdAt || "";
            const caseStatus = deriveCaseStatus(caseItem);
            const caseTheme = getCaseStatusTheme(caseStatus);
            const responses = Array.isArray(caseItem.raw?.responses) ? caseItem.raw.responses : [];
            const firstResponseWithForm = responses.find((response: unknown) => {
              const row = (response ?? {}) as Record<string, unknown>;
              return Boolean(
                row.form &&
                  typeof row.form === "object" &&
                  String((row.form as Record<string, unknown>).name ?? "").trim()
              );
            }) as Record<string, unknown> | undefined;
            const formName = firstResponseWithForm
              ? String(
                  ((firstResponseWithForm.form as Record<string, unknown>)?.name ?? "")
                ).trim()
              : "";

            return (
            <Card
              key={caseItem.id}
              className={`border-2 transition-colors cursor-pointer ${caseTheme.cardClassName}`}
              onClick={() => navigate(`/MyCases/${caseItem.id}`)}
            >
              <CardContent className="p-4 flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-foreground">{caseTitle}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Case #{caseShortId}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Opened {caseCreatedAt ? new Date(caseCreatedAt).toLocaleDateString() : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Status: {caseStatus}
                  </p>
                  {caseItem.raw?.productBundle?.name && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Product Bundle: {caseItem.raw.productBundle.name}
                    </p>
                  )}
                  {formName && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Form: {formName}
                    </p>
                  )}
                  {assigneeInitials.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground mb-2">Care Team</p>
                      <div className="flex items-center -space-x-2">
                        {assigneeInitials.map((assignee: AssigneeInitial) => (
                          <div
                            key={assignee.id}
                            className={`w-8 h-8 rounded-full border-2 border-background text-[10px] font-bold flex items-center justify-center ${caseTheme.avatarClassName}`}
                            title={assignee.initials}
                          >
                            {assignee.initials}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <Badge variant="outline" className={`capitalize ${caseTheme.badgeClassName}`}>
                  {caseStatus}
                </Badge>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
