// @ts-nocheck
import { format, subDays, startOfWeek, addDays } from "date-fns";

const today = new Date();
const weekStart = startOfWeek(today, { weekStartsOn: 1 });

export const mockWeekSessions = [
  { id: "m1", date: format(addDays(weekStart, 0), "yyyy-MM-dd"), workout_name: "Upper Body Power", duration_minutes: 52, completion_percentage: 100, mood: "excellent", exercises_completed: [{ exercise_name: "Bench Press", sets: [{completed:true},{completed:true},{completed:true}] }, { exercise_name: "Pull-Ups", sets: [{completed:true},{completed:true},{completed:true}] }] },
  { id: "m2", date: format(addDays(weekStart, 1), "yyyy-MM-dd"), workout_name: "Lower Body Strength", duration_minutes: 60, completion_percentage: 95, mood: "good", exercises_completed: [{ exercise_name: "Squat", sets: [{completed:true},{completed:true},{completed:true}] }, { exercise_name: "Romanian Deadlift", sets: [{completed:true},{completed:true},{completed:true}] }] },
  { id: "m3", date: format(addDays(weekStart, 2), "yyyy-MM-dd"), workout_name: "Cardio & Core", duration_minutes: 40, completion_percentage: 100, mood: "good", exercises_completed: [{ exercise_name: "Treadmill Intervals", sets: [{completed:true}] }, { exercise_name: "Plank", sets: [{completed:true},{completed:true},{completed:true}] }] },
  { id: "m4", date: format(addDays(weekStart, 3), "yyyy-MM-dd"), workout_name: "Push Day", duration_minutes: 55, completion_percentage: 88, mood: "okay", exercises_completed: [{ exercise_name: "Overhead Press", sets: [{completed:true},{completed:true},{completed:true}] }, { exercise_name: "Lateral Raises", sets: [{completed:true},{completed:true}] }] },
];

export const mockTodayHabits = {
  water_intake: 48,
  sleep_hours: 7.5,
  steps: 7800,
  energy_level: 8,
};

export const mockRecentCheckIn = {
  id: "c1",
  check_in_date: format(subDays(today, 7), "yyyy-MM-dd"),
  weight: 182,
  overall_feeling: "good",
};

export const mockSleepData = {
  // Last 7 nights
  nightly: [
    { day: "Mon", totalHours: 7.2, rem: 1.4, deep: 1.1, light: 3.8, awake: 0.5, efficiency: 91, latency: 9, wakeEvents: 2, hrv: 68, rhr: 52 },
    { day: "Tue", totalHours: 6.5, rem: 1.1, deep: 0.9, light: 3.7, awake: 0.8, efficiency: 84, latency: 18, wakeEvents: 4, hrv: 61, rhr: 55 },
    { day: "Wed", totalHours: 8.1, rem: 1.8, deep: 1.5, light: 4.2, awake: 0.4, efficiency: 95, latency: 7, wakeEvents: 1, hrv: 74, rhr: 50 },
    { day: "Thu", totalHours: 7.6, rem: 1.5, deep: 1.3, light: 4.0, awake: 0.6, efficiency: 92, latency: 11, wakeEvents: 2, hrv: 70, rhr: 51 },
    { day: "Fri", totalHours: 6.8, rem: 1.2, deep: 1.0, light: 3.8, awake: 0.9, efficiency: 83, latency: 22, wakeEvents: 5, hrv: 58, rhr: 57 },
    { day: "Sat", totalHours: 8.4, rem: 1.9, deep: 1.7, light: 4.3, awake: 0.3, efficiency: 97, latency: 6, wakeEvents: 1, hrv: 78, rhr: 49 },
    { day: "Sun", totalHours: 7.9, rem: 1.6, deep: 1.4, light: 4.1, awake: 0.5, efficiency: 94, latency: 8, wakeEvents: 2, hrv: 72, rhr: 51 },
  ],
  // Averages
  avgEfficiency: 91,
  avgLatency: 12,
  avgTotalHours: 7.5,
  avgRem: 1.5,
  avgDeep: 1.3,
  avgHrv: 69,
  avgRhr: 52,
  avgWakeEvents: 2.4,
  sleepScore: 83,
};

export const mockWorkoutStats = {
  weeklySteps: [
    { day: "Mon", steps: 9200, calories: 2450, heartRate: 72 },
    { day: "Tue", steps: 11400, calories: 2710, heartRate: 76 },
    { day: "Wed", steps: 8700, calories: 2380, heartRate: 74 },
    { day: "Thu", steps: 12100, calories: 2820, heartRate: 78 },
    { day: "Fri", steps: 10300, calories: 2590, heartRate: 75 },
    { day: "Sat", steps: 14500, calories: 2950, heartRate: 80 },
    { day: "Sun", steps: 6800, calories: 2200, heartRate: 70 },
  ],
  avgHeartRate: 75,
  avgCalories: 2586,
  totalSteps: 73000,
  activeMinutes: 312,
};