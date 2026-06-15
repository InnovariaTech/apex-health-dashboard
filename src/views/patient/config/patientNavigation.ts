// @ts-nocheck
/**
 * Patient (member) portal — sidebar links for end-user / preview-as-patient flows.
 */
import {
  Home,
  MessageSquare,
  FolderOpen,
  CreditCard,
  UserCircle,
  Pill,
  FlaskConical,
  Sparkles,
  Dumbbell,
  TrendingUp,
  MessagesSquare,
  ListChecks,
  CalendarDays,
  Apple,
} from "lucide-react";
import { createPageUrl } from "@/utils";

/** Full clinical nav (Apex MD environment). */
export const apexPatientNavItems = [
  { title: "Dashboard", url: createPageUrl("Dashboard"), icon: Home },
  { title: "Health Analysis", url: createPageUrl("HealthAnalysis"), icon: Sparkles },
  { title: "My Cases", url: createPageUrl("MyCases"), icon: Pill },
  // { title: "My Treatments", url: createPageUrl("MyTreatments"), icon: Pill },

  { title: "Chat", url: createPageUrl("Chat"), icon: MessageSquare },
  { title: "Biomarkers", url: createPageUrl("Biomarkers"), icon: FlaskConical },
  { title: "Workouts", url: createPageUrl("Workouts"), icon: Dumbbell },
  { title: "Progress", url: createPageUrl("Progress"), icon: TrendingUp },
  { title: "Trainer Messages", url: createPageUrl("TrainerChat"), icon: MessagesSquare },
  { title: "Habits", url: createPageUrl("Habits"), icon: ListChecks },
  { title: "Appointments", url: createPageUrl("Appointments"), icon: CalendarDays },
  { title: "Nutrition", url: createPageUrl("Nutrition"), icon: Apple },

  // { title: "Advanced Biomarkers", url: createPageUrl("AdvancedBiomarkers"), icon: Dna },
  // { title: "Sleep", url: createPageUrl("Sleep"), icon: Moon },
  // { title: "Store", url: createPageUrl("Marketplace"), icon: ShoppingBag },
  // { title: "Health", url: createPageUrl("Health"), icon: Activity },
  { title: "Documents", url: createPageUrl("Documents"), icon: FolderOpen },
  // { title: "Sync Devices", url: createPageUrl("SyncDevices"), icon: Watch },
  // { title: "Referral", url: createPageUrl("Referral"), icon: Gift },
  // { title: "Rewards", url: createPageUrl("Rewards"), icon: Trophy },
  { title: "Browse Treatments", url: createPageUrl("BrowseTreatments"), icon: Pill },
  { title: "Profile", url: createPageUrl("Profile"), icon: UserCircle },
  // { title: "Billing", url: createPageUrl("Billing"), icon: CreditCard },
];

/** Gym-branded portals — fitness-focused subset. */
export const gymPatientNavItems = [
  { title: "My Cases", url: createPageUrl("MyCases"), icon: Pill },
  { title: "My Treatments", url: createPageUrl("MyTreatments"), icon: Pill },
  { title: "browse-treatments", url: createPageUrl("BrowseTreatments"), icon: Pill },
  { title: "Chat", url: createPageUrl("Chat"), icon: MessageSquare },
  { title: "Biomarkers", url: createPageUrl("Biomarkers"), icon: FlaskConical },
  { title: "Workouts", url: createPageUrl("Workouts"), icon: Dumbbell },
  { title: "Progress", url: createPageUrl("Progress"), icon: TrendingUp },
  { title: "Trainer Messages", url: createPageUrl("TrainerChat"), icon: MessagesSquare },
  { title: "Habits", url: createPageUrl("Habits"), icon: ListChecks },
  { title: "Appointments", url: createPageUrl("Appointments"), icon: CalendarDays },
  { title: "Nutrition", url: createPageUrl("Nutrition"), icon: Apple },
  // { title: "Advanced Biomarkers", url: createPageUrl("AdvancedBiomarkers"), icon: Dna },
  // { title: "Nutrition", url: createPageUrl("Nutrition"), icon: Apple },
  // { title: "Sleep", url: createPageUrl("Sleep"), icon: Moon },
  // { title: "Store", url: createPageUrl("Marketplace"), icon: ShoppingBag },
  { title: "Documents", url: createPageUrl("Documents"), icon: FolderOpen },
  // { title: "Sync Devices", url: createPageUrl("SyncDevices"), icon: Watch },
  // { title: "Referral", url: createPageUrl("Referral"), icon: Gift },
  // { title: "Rewards", url: createPageUrl("Rewards"), icon: Trophy },
  { title: "Profile", url: createPageUrl("Profile"), icon: UserCircle },
  // { title: "Billing", url: createPageUrl("Billing"), icon: CreditCard },
];

export function getPatientNavItems(isGymEnv) {
  return isGymEnv ? gymPatientNavItems : apexPatientNavItems;
}
