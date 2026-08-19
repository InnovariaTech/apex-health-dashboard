import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  AlertCircle,
  ChevronRight,
  Loader2,
  Plus,
  Stethoscope,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useVisits } from "@/hooks/beluga/useBeluga";
import type { Visit, VisitStatus } from "@/types/beluga/beluga_types";
import {
  FILTERABLE_STATUSES,
  needsPhoto,
  statusMeta,
} from "@/views/patient/utils/belugaStatus";

/**
 * Telehealth visit list. Read-only surface driven by `GET /api/beluga/visits`;
 * each row links to the detail page. Status is the single source of truth.
 */
export default function Visits() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<VisitStatus | "all">("all");

  const { data: visits = [], isLoading, isError, refetch, isFetching } =
    useVisits();

  const shown = useMemo(
    () => (filter === "all" ? visits : visits.filter((v) => v.status === filter)),
    [visits, filter],
  );

  // Only offer filters for statuses that actually appear in the data.
  const availableFilters = useMemo(() => {
    const present = new Set(visits.map((v) => v.status));
    return FILTERABLE_STATUSES.filter((s) => present.has(s));
  }, [visits]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-slate-700" />
            Telehealth Visits
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Your medical visits and their status.
          </p>
        </div>
        <Button onClick={() => navigate("/Visits/new")}>
          <Plus className="w-4 h-4 mr-2" />
          Start a visit
        </Button>
      </header>

      {isLoading ? (
        <VisitsState kind="loading" />
      ) : isError ? (
        <VisitsState kind="error" onRetry={() => refetch()} busy={isFetching} />
      ) : visits.length === 0 ? (
        <VisitsState kind="empty" onStart={() => navigate("/Visits/new")} />
      ) : (
        <>
          {availableFilters.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <FilterChip
                active={filter === "all"}
                label="All"
                onClick={() => setFilter("all")}
              />
              {availableFilters.map((s) => (
                <FilterChip
                  key={s}
                  active={filter === s}
                  label={statusMeta(s).label}
                  onClick={() => setFilter(s)}
                />
              ))}
            </div>
          )}

          {shown.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">
              No visits match this filter.
            </p>
          ) : (
            <div className="space-y-3">
              {shown.map((visit) => (
                <VisitRow
                  key={visit.masterId}
                  visit={visit}
                  onClick={() =>
                    navigate(`/Visits/${visit.masterId}`)
                  }
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
        active
          ? "bg-slate-900 text-white border-slate-900"
          : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
      }`}
    >
      {label}
    </button>
  );
}

function VisitRow({ visit, onClick }: { visit: Visit; onClick: () => void }) {
  const meta = statusMeta(visit.status);
  const created = safeDate(visit.createdAt);

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="cursor-pointer transition-shadow hover:shadow-md"
    >
      <CardContent className="p-4 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-slate-900 truncate">
              {visit.visitType || "Visit"}
            </span>
            <Badge variant={meta.variant} className="shrink-0">
              {meta.label}
            </Badge>
            {needsPhoto(visit.status) && (
              <Badge variant="warning" className="shrink-0">
                Action needed
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1 truncate">{meta.hint}</p>
          {created && (
            <p className="text-xs text-slate-400 mt-1">
              Started {format(created, "MMM d, yyyy")}
            </p>
          )}
        </div>
        <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
      </CardContent>
    </Card>
  );
}

function VisitsState({
  kind,
  onRetry,
  onStart,
  busy,
}: {
  kind: "loading" | "empty" | "error";
  onRetry?: () => void;
  onStart?: () => void;
  busy?: boolean;
}) {
  if (kind === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="mt-3 text-sm">Loading your visits…</p>
      </div>
    );
  }
  if (kind === "empty") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Stethoscope className="w-10 h-10 text-slate-300" />
        <p className="mt-3 font-medium text-slate-700">No visits yet</p>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
          When you start a telehealth visit, it will appear here with its status.
        </p>
        {onStart && (
          <Button className="mt-4" onClick={onStart}>
            <Plus className="w-4 h-4 mr-2" />
            Start a visit
          </Button>
        )}
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <AlertCircle className="w-10 h-10 text-red-400" />
      <p className="mt-3 font-medium text-slate-700">
        We couldn't load your visits
      </p>
      <Button
        variant="outline"
        className="mt-4"
        onClick={onRetry}
        disabled={busy}
      >
        {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Try again
      </Button>
    </div>
  );
}

function safeDate(value?: string | null): Date | null {
  if (!value) return null;
  const t = Date.parse(value);
  return Number.isNaN(t) ? null : new Date(t);
}
