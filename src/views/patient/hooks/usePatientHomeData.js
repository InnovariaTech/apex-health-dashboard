import { useState, useEffect, useCallback } from "react";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { api } from "@/api/client";
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
  const [currentUser, setCurrentUser] = useState(null);
  const [weekSessions, setWeekSessions] = useState([]);
  const [todayHabits, setTodayHabits] = useState(null);
  const [recentCheckIn, setRecentCheckIn] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = await api.auth.me();
      setCurrentUser(user);

      const weekStart = format(startOfWeek(new Date()), "yyyy-MM-dd");
      const weekEnd = format(endOfWeek(new Date()), "yyyy-MM-dd");

      const sessions = await api.entities.WorkoutSession.filter(
        { user_id: user.email },
        "-date",
        100
      );
      const thisWeekSessions = sessions.filter(
        (s) => s.date >= weekStart && s.date <= weekEnd
      );
      setWeekSessions(
        thisWeekSessions.length > 0 ? thisWeekSessions : mockWeekSessions
      );

      const habits = await api.entities.HabitLog.filter({
        user_id: user.email,
        date: format(new Date(), "yyyy-MM-dd"),
      });
      setTodayHabits(habits[0] || mockTodayHabits);

      const checkIns = await api.entities.CheckIn.filter(
        { user_id: user.email },
        "-check_in_date",
        1
      );
      setRecentCheckIn(checkIns[0] || mockRecentCheckIn);
    } catch (error) {
      console.error("Error loading dashboard:", error);
      setWeekSessions(mockWeekSessions);
      setTodayHabits(mockTodayHabits);
      setRecentCheckIn(mockRecentCheckIn);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    currentUser,
    weekSessions,
    todayHabits,
    recentCheckIn,
    isLoading,
    reload: load,
  };
}
