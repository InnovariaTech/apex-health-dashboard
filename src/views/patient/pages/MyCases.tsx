import { useMemo } from "react";
import { useCases } from "@/hooks/care-validate/useCases";
import { getCasesDateRange } from "@/views/patient/utils/casesDateRange";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import type { CaseItem } from "@/types/care-validate/case_types";

interface AssigneeInitial {
  id: string;
  initials: string;
}

type BadgeVariant =
  | "default"
  | "dark"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "warning"
  | "danger"
  | "info";

function getCaseStatusBadge(status: string): BadgeVariant {
  switch (status) {
    case "Completed":
      return "success";
    case "Virtual Consult":
      return "info";
    case "Prescription Decision":
      return "warning";
    default:
      return "default";
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
  const dateRange = useMemo(() => getCasesDateRange(), []);
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
    <div className="p-4 md:p-9 max-w-[1480px] mx-auto bg-background text-foreground min-h-screen">
      {/* Page head */}
      <div className="mb-6 pb-5 border-b border-border">
        <p className="apex-eyebrow">Care portal</p>
        <h1 className="apex-page-title mt-1">
          My <em>cases</em>
        </h1>
        <p className="text-[13px] text-ink-2 mt-2">
          Track your active and past care requests.
        </p>
      </div>

      {isError && (
        <div
          className="mb-6 apex-card p-4 text-sm"
          style={{ borderColor: "var(--att)", background: "var(--att-soft)" }}
        >
          <span style={{ color: "var(--att)" }}>
            Unable to load cases right now. Please refresh and try again.
          </span>
        </div>
      )}

      {cases.length === 0 ? (
        <div className="apex-card border-dashed p-10 text-center">
          <p className="font-serif text-lg font-medium text-foreground mb-1">
            No cases yet
          </p>
          <p className="text-[13px] text-muted-foreground">
            Your active and past care requests will appear here once created.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {cases.map((caseItem, index) => {
            const assigneeInitials = getAssigneeInitials(caseItem);
            const caseTitle = caseItem.title || caseItem.raw?.title || "Untitled Case";
            const caseShortId = caseItem.shortId || caseItem.raw?.shortId || caseItem.id;
            const caseCreatedAt = caseItem.createdAt || caseItem.raw?.createdAt || "";
            const caseStatus = deriveCaseStatus(caseItem);
            const badgeVariant = getCaseStatusBadge(caseStatus);
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
                className="cursor-pointer transition-all duration-150 hover:-translate-y-px hover:border-[var(--line-2)] animate-apex-fade-up"
                style={{ animationDelay: `${index * 40}ms` }}
                onClick={() => navigate(`/MyCases/${caseItem.id}`)}
              >
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium leading-snug text-foreground">
                        {caseTitle}
                      </p>
                      <p className="apex-eyebrow mt-1.5">
                        Case <span className="font-mono">#{caseShortId}</span>
                      </p>
                    </div>
                    <Badge variant={badgeVariant} className="whitespace-nowrap shrink-0">
                      {caseStatus}
                    </Badge>
                  </div>

                  <dl className="mt-4 space-y-1.5 text-[12px]">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted-foreground">Opened</dt>
                      <dd className="font-mono text-ink-2">
                        {caseCreatedAt
                          ? new Date(caseCreatedAt).toLocaleDateString()
                          : "—"}
                      </dd>
                    </div>
                    {caseItem.raw?.productBundle?.name && (
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-muted-foreground">Bundle</dt>
                        <dd className="text-ink-2 truncate text-right">
                          {caseItem.raw.productBundle.name}
                        </dd>
                      </div>
                    )}
                    {formName && (
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-muted-foreground">Form</dt>
                        <dd className="text-ink-2 truncate text-right">{formName}</dd>
                      </div>
                    )}
                  </dl>

                  {assigneeInitials.length > 0 && (
                    <div className="mt-4 pt-3.5 border-t border-border">
                      <p className="apex-eyebrow mb-2">Care team</p>
                      <div className="flex items-center -space-x-2">
                        {assigneeInitials.map((assignee: AssigneeInitial) => (
                          <div
                            key={assignee.id}
                            className="w-8 h-8 rounded-full border border-border bg-secondary text-[10px] font-medium text-ink-2 flex items-center justify-center"
                            title={assignee.initials}
                          >
                            {assignee.initials}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-auto pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        navigate(`/Chat?caseId=${encodeURIComponent(caseItem.id)}`);
                      }}
                    >
                      <MessageSquare className="w-4 h-4" />
                      Open Chat
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
