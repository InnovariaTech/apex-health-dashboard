/**
 * Patient (member) portal — sidebar links for end-user / preview-as-patient flows.
 */
import {
  Home,
  Dumbbell,
  Apple,
  TrendingUp,
  MessageSquare,
  ShoppingBag,
  FlaskConical,
  FolderOpen,
  CreditCard,
  UserCircle,
  CalendarDays,
  Pill,
  Gift,
  Trophy,
  Moon,
  Activity,
  Watch,
  Dna,
} from "lucide-react";
import { createPageUrl } from "@/utils";

/** Full clinical nav (Apex MD environment). */
export const apexPatientNavItems = [
  { title: "Dashboard", url: createPageUrl("Dashboard"), icon: Home },
  { title: "My Treatments", url: createPageUrl("MyTreatments"), icon: Pill },
  { title: "Chat", url: createPageUrl("Chat"), icon: MessageSquare },
  { title: "Biomarkers", url: createPageUrl("Biomarkers"), icon: FlaskConical },
  { title: "Advanced Biomarkers", url: createPageUrl("AdvancedBiomarkers"), icon: Dna },
  { title: "Schedule", url: createPageUrl("Schedule"), icon: CalendarDays },
  { title: "Workouts", url: createPageUrl("Workouts"), icon: Dumbbell },
  { title: "Progress", url: createPageUrl("Progress"), icon: TrendingUp },
  { title: "Nutrition", url: createPageUrl("Nutrition"), icon: Apple },
  { title: "Sleep", url: createPageUrl("Sleep"), icon: Moon },
  { title: "Store", url: createPageUrl("Marketplace"), icon: ShoppingBag },
  { title: "Health", url: createPageUrl("Health"), icon: Activity },
  { title: "Documents", url: createPageUrl("Documents"), icon: FolderOpen },
  { title: "Sync Devices", url: createPageUrl("SyncDevices"), icon: Watch },
  { title: "Referral", url: createPageUrl("Referral"), icon: Gift },
  { title: "Rewards", url: createPageUrl("Rewards"), icon: Trophy },
  { title: "Profile", url: createPageUrl("Profile"), icon: UserCircle },
  { title: "Billing", url: createPageUrl("Billing"), icon: CreditCard },
];

/** Gym-branded portals — fitness-focused subset. */
export const gymPatientNavItems = [
  { title: "Dashboard", url: createPageUrl("Dashboard"), icon: Home },
  { title: "My Treatments", url: createPageUrl("MyTreatments"), icon: Pill },
  { title: "Chat", url: createPageUrl("Chat"), icon: MessageSquare },
  { title: "Biomarkers", url: createPageUrl("Biomarkers"), icon: FlaskConical },
  { title: "Advanced Biomarkers", url: createPageUrl("AdvancedBiomarkers"), icon: Dna },
  { title: "Schedule", url: createPageUrl("Schedule"), icon: CalendarDays },
  { title: "Workouts", url: createPageUrl("Workouts"), icon: Dumbbell },
  { title: "Progress", url: createPageUrl("Progress"), icon: TrendingUp },
  { title: "Nutrition", url: createPageUrl("Nutrition"), icon: Apple },
  { title: "Sleep", url: createPageUrl("Sleep"), icon: Moon },
  { title: "Store", url: createPageUrl("Marketplace"), icon: ShoppingBag },
  { title: "Documents", url: createPageUrl("Documents"), icon: FolderOpen },
  { title: "Sync Devices", url: createPageUrl("SyncDevices"), icon: Watch },
  { title: "Referral", url: createPageUrl("Referral"), icon: Gift },
  { title: "Rewards", url: createPageUrl("Rewards"), icon: Trophy },
  { title: "Profile", url: createPageUrl("Profile"), icon: UserCircle },
  { title: "Billing", url: createPageUrl("Billing"), icon: CreditCard },
];

export function getPatientNavItems(isGymEnv) {
  return isGymEnv ? gymPatientNavItems : apexPatientNavItems;
}
