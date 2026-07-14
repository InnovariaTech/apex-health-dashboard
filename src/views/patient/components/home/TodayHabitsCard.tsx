// @ts-nocheck
import { useMemo } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { CalendarCheck, CheckCircle2, ChevronRight, Circle, ListChecks, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTrainerizeCalendar } from "@/hooks/trainerize/useCalendar";
import { useTrainerizeLink } from "@/hooks/trainerize/useLinkage";
import { pickHabitEntries } from "@/types/trainerize/calendar_types";
import { createPageUrl } from "@/utils";

/**
 * Dashboard widget — today's habits at a glance. Read-only summary that
 * mirrors the data shown on the dedicated Habits page (`Habits.tsx`):
 *
 *   1. Pull today's calendar slice via `useTrainerizeCalendar(today, today)`.
 *   2. Filter to habit entries with `pickHabitEntries`.
 *   3. Render a tracked/total badge plus a compact list of habit titles
 *      with a check icon when the item's status is `tracked`.
 *   4. "Open habits" footer button drills into the full page for actual
 *      track / untrack actions.
 *
 * Trainerize-link aware — if the user isn't linked, the card hides itself
 * (rather than dragging a TrainerizeGate banner onto the Dashboard).
 */
export default function TodayHabitsCard() {
  const navigate = useNavigate();
  const linkQuery = useTrainerizeLink();
  const today = format(new Date(), "yyyy-MM-dd");
  const calendarQuery = useTrainerizeCalendar(today, today);

  const habits = useMemo(
    () => pickHabitEntries(calendarQuery.data ?? []),
    [calendarQuery.data],
  );

  const tracked = habits.filter(
    (h) => typeof h.status === "string" && h.status.toLowerCase() === "tracked",
  ).length;
  const total = habits.length;

  // No Trainerize link → hide the card entirely. Dashboard already has the
  // health-intelligence grid; an empty habits panel adds noise.
  if (!linkQuery.isLoading && !linkQuery.data) {
    return null;
  }

  const goToHabits = () => navigate(createPageUrl("Habits"));

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ListChecks className="w-4 h-4 text-primary" />
            Today's habits
          </CardTitle>
          {total > 0 && (
            <Badge
              variant="outline"
              className={
                tracked === total
                  ? "border-primary text-primary"
                  : "text-muted-foreground"
              }
            >
              {tracked} / {total} done
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col pt-0">
        {calendarQuery.isLoading || linkQuery.isLoading ? (
          <div className="py-10 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : calendarQuery.isError ? (
          <p className="py-6 text-sm text-destructive">
            Couldn't load today's habits.
          </p>
        ) : habits.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground flex-1 flex flex-col items-center justify-center gap-2">
            <CalendarCheck className="w-8 h-8 text-muted-foreground/40" />
            <p>No habits scheduled for today.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {habits.slice(0, 5).map((h) => {
              const isDone =
                typeof h.status === "string" &&
                h.status.toLowerCase() === "tracked";
              const Icon = isDone ? CheckCircle2 : Circle;
              return (
                <li
                  key={h.itemID}
                  className="flex items-center gap-2.5 text-sm"
                >
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 ${isDone ? "text-primary" : "text-muted-foreground/50"}`}
                  />
                  <span
                    className={
                      isDone
                        ? "text-foreground line-clamp-1"
                        : "text-muted-foreground line-clamp-1"
                    }
                  >
                    {h.title || "Habit"}
                  </span>
                </li>
              );
            })}
            {habits.length > 5 && (
              <li className="text-[11px] text-muted-foreground italic pl-6">
                +{habits.length - 5} more
              </li>
            )}
          </ul>
        )}

        <div className="mt-auto pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={goToHabits}
            className="w-full gap-1.5"
          >
            Open habits <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
