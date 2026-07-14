import { useMemo } from "react";
import { format, subDays } from "date-fns";
import { useAppointments } from "@/hooks/trainerize/useAppointments";
import { useBodyStatsRange } from "@/hooks/trainerize/useBodyStats";
import { useTrainerizeLink } from "@/hooks/trainerize/useLinkage";
import type { Appointment } from "@/types/trainerize/appointments_types";
import type { BodyStatsRecord } from "@/types/trainerize/bodystats_types";
import { createPageUrl } from "@/utils";

/**
 * Dashboard "Upcoming tasks" aggregator.
 *
 * The portal has no `/tasks` endpoint. Each task is **derived** from data
 * we already pull elsewhere, so completing the underlying action makes the
 * task vanish on the next refetch — no separate completion state to track.
 *
 * Today we derive two task types:
 *   1. Upcoming Trainerize appointments in the next 7 days.
 *   2. "Log this week's weight" — if no body-stats record exists in the
 *      last 7 days.
 *
 * When the backend ships a real `/api/patient/tasks` endpoint, swap the
 * data source here and keep the `DashboardTask[]` shape stable — the UI
 * card in CareHubRow doesn't need to change.
 */

export type DashboardTaskTone = "today" | "soon" | "normal";

export interface DashboardTask {
  id: string;
  label: string;
  /** Display string for the due chip (e.g. "Today", "Jun 22"). */
  dueLabel: string;
  /** UI tone for the chip background. */
  tone: DashboardTaskTone;
  /** Sort key — millis since epoch. */
  dueAt: number;
  /** Internal page to link to on click. */
  href: string;
}

const WINDOW_DAYS = 7;
const MAX_TASKS = 5;

export function useDashboardTasks(): {
  tasks: DashboardTask[];
  isLoading: boolean;
} {
  const linkQuery = useTrainerizeLink();
  const linked = !!linkQuery.data;

  const today = format(new Date(), "yyyy-MM-dd");
  const weekAhead = format(
    new Date(Date.now() + WINDOW_DAYS * 24 * 60 * 60 * 1000),
    "yyyy-MM-dd",
  );

  const appointmentsQuery = useAppointments(
    linked ? today : undefined,
    linked ? weekAhead : undefined,
  );

  // Body stats for the last 7 days — fanned out one date at a time by the
  // hook. We only need presence/absence, so we don't read individual records.
  const last7Dates = useMemo(() => {
    const out: string[] = [];
    for (let i = 0; i < WINDOW_DAYS; i++) {
      out.push(format(subDays(new Date(), i), "yyyy-MM-dd"));
    }
    return out;
  }, []);
  const bodyStatsResults = useBodyStatsRange(linked ? last7Dates : []);

  const tasks = useMemo<DashboardTask[]>(() => {
    const out: DashboardTask[] = [];
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    // 1. Upcoming appointments
    const appointments = (appointmentsQuery.data ?? []) as Appointment[];
    for (const appt of appointments) {
      if (!appt.startDate) continue;
      const startMs = Date.parse(appt.startDate);
      if (!Number.isFinite(startMs) || startMs < now) continue;

      const typeName =
        appt.appointmentType?.name ??
        (typeof appt.notes === "string" ? appt.notes : "Appointment");
      const dayDiff = Math.floor((startMs - now) / dayMs);
      const tone: DashboardTaskTone =
        dayDiff === 0 ? "today" : dayDiff <= 2 ? "soon" : "normal";

      out.push({
        id: `appt-${appt.id}`,
        label: typeName,
        dueLabel:
          dayDiff === 0
            ? "Today"
            : dayDiff === 1
              ? "Tomorrow"
              : format(new Date(startMs), "MMM d"),
        tone,
        dueAt: startMs,
        href: createPageUrl("Appointments"),
      });
    }

    // 2. Weekly weight log — only emit if zero records in the last 7 days
    //    AND every body-stats query has resolved (so we don't flash "log
    //    your weight" while data is still loading).
    const bodyStatsLoading = bodyStatsResults.some((r) => r.isLoading);
    const hasRecentLog = bodyStatsResults.some((r) => {
      const rec = r.data as BodyStatsRecord | undefined;
      return !!rec?.bodyMeasures;
    });
    if (linked && !bodyStatsLoading && !hasRecentLog) {
      out.push({
        id: "weight-overdue",
        label: "Log weekly weight + waist",
        dueLabel: "Today",
        tone: "today",
        dueAt: now,
        href: createPageUrl("Progress"),
      });
    }

    out.sort((a, b) => a.dueAt - b.dueAt);
    return out.slice(0, MAX_TASKS);
  }, [appointmentsQuery.data, bodyStatsResults, linked]);

  const isLoading =
    linkQuery.isLoading ||
    (linked &&
      (appointmentsQuery.isLoading ||
        bodyStatsResults.some((r) => r.isLoading)));

  return { tasks, isLoading };
}
