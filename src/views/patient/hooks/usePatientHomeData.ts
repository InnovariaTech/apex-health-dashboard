// @ts-nocheck
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { api } from "@/api/client";
import { usePatientData } from "@/hooks/patients/usePatientData";
import { queryKeys } from "@/hooks/queryKeys";
import {
  mockWeekSessions,
  mockTodayHabits,
  mockRecentCheckIn,
} from "@/mocks/static/dashboardFallbacks";

/**
 * Loads patient home (dashboard) aggregates: sessions, habits, check-ins.
 * Falls back to static mock rows when the in-memory store is empty or on error.
 */
export function usePatientHomeData() {
  const currentUserQuery = usePatientData();
  const currentUser = currentUserQuery.data ?? null;

  const dashboardQuery = useQuery({
    queryKey: queryKeys.patients.home(currentUser?.email),
    enabled: Boolean(currentUser?.email),
    queryFn: async () => {
      const weekStart = format(startOfWeek(new Date()), "yyyy-MM-dd");
      const weekEnd = format(endOfWeek(new Date()), "yyyy-MM-dd");

      const entities = api.entities as any;
      const sessions = await entities.WorkoutSession.filter(
        { user_id: currentUser.email },
        "-date",
        100
      );
      const thisWeekSessions = sessions.filter(
        (s) => s.date >= weekStart && s.date <= weekEnd
      );
      const weekSessions = thisWeekSessions.length > 0 ? thisWeekSessions : mockWeekSessions;

      const habits = await entities.HabitLog.filter({
        user_id: currentUser.email,
        date: format(new Date(), "yyyy-MM-dd"),
      });
      const todayHabits = habits[0] || mockTodayHabits;

      const checkIns = await entities.CheckIn.filter(
        { user_id: currentUser.email },
        "-check_in_date",
        1
      );
      const recentCheckIn = checkIns[0] || mockRecentCheckIn;

      return { weekSessions, todayHabits, recentCheckIn };
    },
  });

  const fallbackData = useMemo(
    () => ({
      weekSessions: mockWeekSessions,
      todayHabits: mockTodayHabits,
      recentCheckIn: mockRecentCheckIn,
    }),
    []
  );

  const data = dashboardQuery.data ?? fallbackData;

  const reload = async () => {
    await Promise.all([currentUserQuery.refetch(), dashboardQuery.refetch()]);
  };

  return {
    currentUser,
    weekSessions: data.weekSessions,
    todayHabits: data.todayHabits,
    recentCheckIn: data.recentCheckIn,
    isLoading: currentUserQuery.isLoading || dashboardQuery.isLoading,
    reload,
  };
}
