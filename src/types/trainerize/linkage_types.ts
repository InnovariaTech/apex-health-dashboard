/**
 * Trainerize linkage, profile, and settings — backs `src/api/trainerize/linkage.ts`.
 * See `docs/trainerize/client-apis.md` Phase 1 and
 * `docs/trainerize/CLIENT_DASHBOARD_INTEGRATION.md` Section 1.
 */

export type AssignmentStatus = "assigned" | "pending" | "unassigned";

/** `GET /api/trainerize/me/link` — `null` if the client has no Trainerize account. */
export interface TrainerizeLink {
  authUserId: string;
  trainerizeUserId: number;
  groupId: string;
  trainerUserId: number | null;
  assignmentStatus: AssignmentStatus;
}

/** `GET /api/trainerize/me/profile` — `null` if not linked. */
export interface TrainerizeProfile {
  trainerizeUserId: number;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  status: string | null;
}

export type WeightUnit = "lbs" | "kg";
export type DistanceUnit = "miles" | "km";
export type BodystatUnit = "inches" | "cm";

export interface NotificationToggles {
  newMessage?: boolean;
  newUserGroupMessage?: boolean;
  comment?: boolean;
  paymentEvent?: boolean;
  reminders?: boolean;
  trainerUpdates?: boolean;
  clientDailySummary?: boolean;
  weeklyFollowup?: boolean;
  news?: boolean;
  zapierEvents?: boolean;
  clientFirstWorkout?: boolean;
  clientSubsequentWorkout?: boolean;
  clientMilestoneCardio?: boolean;
  clientAllCardio?: boolean;
  clientHitGoal?: boolean;
  clientPersonalBest?: boolean;
}

/** `GET /api/trainerize/me/settings` — source of truth for unit display. */
export interface TrainerizeSettings {
  firstName?: string;
  lastName?: string;
  timezone?: number;
  unitWeight: WeightUnit;
  unitDistance: DistanceUnit;
  unitBodystat: BodystatUnit;
  reminderTime?: number;
  level?: number;
  trainerID?: number;
  skypeEnabled?: boolean;
  withingsConnected?: boolean;
  mobileVideoQuality?: number;
  fbLandingPage?: string;
  mfpConnected?: boolean;
  fitbitConnected?: boolean;
  mfpUsername?: string | boolean | null;
  hasMobileSetup?: boolean;
  hasMobileTrackerWizard?: boolean;
  hasMobileSwitchIntoWizard?: boolean;
  email?: NotificationToggles;
  notification?: NotificationToggles;
  timeline?: { showMissWorkout?: boolean };
}

/** Subset extracted by `useTrainerizeUnits()`. */
export interface TrainerizeUnits {
  unitWeight: WeightUnit;
  unitDistance: DistanceUnit;
  unitBodystat: BodystatUnit;
}
