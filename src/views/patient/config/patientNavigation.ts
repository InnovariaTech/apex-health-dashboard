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
  TestTube,
  ShoppingBag,
  Watch,
  Dna,
} from "lucide-react";
import { createPageUrl } from "@/utils";

/** Apex MD (clinical) section — top of sidebar. */
export const apexMdNavItems = [
  { title: "Dashboard", url: createPageUrl("Dashboard"), icon: Home },
  { title: "Health Analysis", url: createPageUrl("HealthAnalysis"), icon: Sparkles },
  { title: "My Cases", url: createPageUrl("MyCases"), icon: Pill },
  { title: "Chat", url: createPageUrl("Chat"), icon: MessageSquare },
  { title: "Biomarkers", url: createPageUrl("Biomarkers"), icon: FlaskConical },
  { title: "Genetics", url: createPageUrl("Genetics"), icon: Dna },
  { title: "Progress", url: createPageUrl("Progress"), icon: TrendingUp },
  { title: "Lab Kits", url: createPageUrl("LabKits"), icon: TestTube },
  { title: "Wearables", url: createPageUrl("Wearables"), icon: Watch },
  // { title: "Appointments", url: createPageUrl("Appointments"), icon: CalendarDays }, // hidden — no backend yet
  { title: "Documents", url: createPageUrl("Documents"), icon: FolderOpen },
  { title: "My Treatments", url: createPageUrl("BrowseTreatments"), icon: Pill },
  { title: "Shop", url: createPageUrl("Shop"), icon: ShoppingBag },
];

/** Apex Fit section — merged into the single sidebar list (no separate divider/logo). */
export const apexFitNavItems = [
  { title: "Workouts", url: createPageUrl("Workouts"), icon: Dumbbell },
  { title: "Nutrition", url: createPageUrl("Nutrition"), icon: Apple },
  { title: "Habits", url: createPageUrl("Habits"), icon: ListChecks },
  { title: "Trainer Messages", url: createPageUrl("TrainerChat"), icon: MessagesSquare },
];

/** Profile — always pinned to the very bottom of the sidebar. */
export const profileNavItem = {
  title: "Profile",
  url: createPageUrl("Profile"),
  icon: UserCircle,
};

/** Legacy flat list — used by callers that iterate without group context. */
export const apexPatientNavItems = [...apexMdNavItems, ...apexFitNavItems, profileNavItem];

/** Gym-branded portals — fitness-focused subset. */
export const gymPatientNavItems = [
  { title: "My Cases", url: createPageUrl("MyCases"), icon: Pill },
  { title: "My Treatments", url: createPageUrl("MyTreatments"), icon: Pill },
  { title: "browse-treatments", url: createPageUrl("BrowseTreatments"), icon: Pill },
  { title: "Chat", url: createPageUrl("Chat"), icon: MessageSquare },
  { title: "Biomarkers", url: createPageUrl("Biomarkers"), icon: FlaskConical },
  { title: "Lab Kits", url: createPageUrl("LabKits"), icon: TestTube },
  { title: "Workouts", url: createPageUrl("Workouts"), icon: Dumbbell },
  { title: "Progress", url: createPageUrl("Progress"), icon: TrendingUp },
  { title: "Wearables", url: createPageUrl("Wearables"), icon: Watch },
  { title: "Trainer Messages", url: createPageUrl("TrainerChat"), icon: MessagesSquare },
  { title: "Habits", url: createPageUrl("Habits"), icon: ListChecks },
  { title: "Appointments", url: createPageUrl("Appointments"), icon: CalendarDays },
  { title: "Nutrition", url: createPageUrl("Nutrition"), icon: Apple },
  { title: "Documents", url: createPageUrl("Documents"), icon: FolderOpen },
  { title: "Shop", url: createPageUrl("Shop"), icon: ShoppingBag },
  { title: "Profile", url: createPageUrl("Profile"), icon: UserCircle },
];

/** Flat nav items — used by callers that only need a single list (e.g. breadcrumb lookup). */
export function getPatientNavItems(isGymEnv) {
  return isGymEnv ? gymPatientNavItems : apexPatientNavItems;
}

/** Grouped nav items for the sidebar. Everything now lives in a single list
 *  (`md`); the Fit items are merged in and Profile is pinned to the bottom. */
export function getPatientNavGroups(isGymEnv) {
  if (isGymEnv) {
    return { md: gymPatientNavItems, fit: [] };
  }
  return { md: [...apexMdNavItems, ...apexFitNavItems, profileNavItem], fit: [] };
}
