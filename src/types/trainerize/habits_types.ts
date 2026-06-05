/**
 * Trainerize habits — backs `src/api/trainerize/habits.ts`.
 * See `docs/trainerize/habits-apis.md`.
 *
 * Doc gap: the list response includes habit-level streak/progress counters,
 * but the doc doesn't enumerate how to discover today's `dailyItemId` for
 * tracking. We accept it as an optional nested field and the UI degrades
 * gracefully when it's absent.
 */

export type HabitStatusFilter = "current" | "upcoming" | "past";

/** Type enum from the doc's "Common type values" list. */
export type HabitType =
  | "customHabit"
  | "eatProtein"
  | "eatGoodFat"
  | "eatComplexCarb"
  | "eatVeggie"
  | "followPortionGuide"
  | "practiceEatingSlowly"
  | "eatUntilAlmostFull"
  | "prepareYourOwnMeal"
  | "drinkOnlyZeroCalorieDrink"
  | "abstainFromAlcohol"
  | "takeAMoreActiveRoute"
  | "makeItEasierToWorkout"
  | "doAnEnjoyableActivity"
  | "recruitSocialSupport"
  | "rewardYourselfAfterAWorkout"
  | "prioritizeSelfCare"
  | "celebrateAWin"
  | "digitalDetoxOneHourBeforeBed"
  | "practiceBedtimeRitual";

/** Display labels for each documented type. */
export const HABIT_TYPE_LABELS: Record<HabitType, string> = {
  customHabit: "Custom habit",
  eatProtein: "Eat protein",
  eatGoodFat: "Eat good fat",
  eatComplexCarb: "Eat complex carbs",
  eatVeggie: "Eat veggies",
  followPortionGuide: "Follow portion guide",
  practiceEatingSlowly: "Eat slowly",
  eatUntilAlmostFull: "Eat until almost full",
  prepareYourOwnMeal: "Prepare your own meal",
  drinkOnlyZeroCalorieDrink: "Drink only zero-calorie drinks",
  abstainFromAlcohol: "Abstain from alcohol",
  takeAMoreActiveRoute: "Take a more active route",
  makeItEasierToWorkout: "Make it easier to work out",
  doAnEnjoyableActivity: "Do an enjoyable activity",
  recruitSocialSupport: "Recruit social support",
  rewardYourselfAfterAWorkout: "Reward yourself after a workout",
  prioritizeSelfCare: "Prioritize self-care",
  celebrateAWin: "Celebrate a win",
  digitalDetoxOneHourBeforeBed: "Digital detox before bed",
  practiceBedtimeRitual: "Practice bedtime ritual",
};

export const HABIT_TYPE_VALUES: HabitType[] = Object.keys(HABIT_TYPE_LABELS) as HabitType[];

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export const DAYS_OF_WEEK: DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export interface HabitRepeatDetail {
  dayOfWeeks?: DayOfWeek[] | string[];
  [key: string]: unknown;
}

export interface HabitNutritionPortion {
  numberOfMeals?: number;
  showHandPortionGuide?: boolean;
  carbs?: number;
  protein?: number;
  fat?: number;
  veggies?: number;
  [key: string]: unknown;
}

export interface HabitsDetail {
  nutritionPortion?: HabitNutritionPortion;
  [key: string]: unknown;
}

/**
 * Daily item — one tracking unit for one date. Single item GET / PUT / DELETE
 * keyed by `id`. Doc doesn't expose a list-all endpoint per habit, so we
 * accept these shapes loosely.
 */
export interface HabitDailyItem {
  id: number;
  date?: string;
  status?: "scheduled" | "tracked" | string;
  habit?: Habit | Habit[];
  [key: string]: unknown;
}

export interface Habit {
  id: number;
  type?: HabitType | string;
  name?: string;
  startDate?: string;
  endDate?: string;
  currentStreak?: number;
  longestStreak?: number;
  totalItems?: number;
  totalCompleted?: number;
  repeatDetail?: HabitRepeatDetail;
  habitsDetail?: HabitsDetail;
  /**
   * Doc gap: today's daily item may surface here under different names per
   * upstream revisions. The UI looks for any of these to enable tracking.
   */
  todayDailyItem?: HabitDailyItem;
  dailyItems?: HabitDailyItem[];
  todayItem?: HabitDailyItem;
  [key: string]: unknown;
}

export interface ListHabitsParams {
  status?: HabitStatusFilter;
  start?: number;
  count?: number;
}

export interface ListHabitsResult {
  total: number;
  habits: Habit[];
}

export interface CreateHabitPayload {
  type: HabitType;
  /** Required for `customHabit`. */
  name?: string;
  customTypeId?: number;
  startDate?: string;
  durationType?: "week" | string;
  duration?: number;
  repeatDetail?: HabitRepeatDetail;
  habitsDetail?: HabitsDetail;
}

export interface CreateHabitResult {
  id: number;
  [key: string]: unknown;
}

export interface GetDailyItemParams {
  dailyItemId: number;
}

export interface TrackDailyItemPayload {
  dailyItemId: number;
  status?: "tracked" | string;
}

export interface TrackDailyItemResult {
  currentStreak?: number;
  longestStreak?: number;
  milestoneHabit?: unknown;
  nextMilestone?: unknown;
  streakBroken?: boolean;
  [key: string]: unknown;
}

export interface DeleteDailyItemPayload {
  dailyItemId: number;
}

/**
 * Helper — finds whichever shape the habit payload uses to surface today's
 * daily item. Returns `undefined` if the upstream doesn't provide one (in
 * which case the UI shows the habit read-only with a note).
 */
export function readTodayDailyItem(habit: Habit | null | undefined): HabitDailyItem | undefined {
  if (!habit) return undefined;
  if (habit.todayDailyItem?.id) return habit.todayDailyItem;
  if (habit.todayItem?.id) return habit.todayItem;
  if (Array.isArray(habit.dailyItems) && habit.dailyItems.length > 0) {
    // Prefer an item with today's date if present, otherwise just the first.
    const today = new Date().toISOString().slice(0, 10);
    return (
      habit.dailyItems.find((d) => d.date === today) ?? habit.dailyItems[0]
    );
  }
  return undefined;
}
