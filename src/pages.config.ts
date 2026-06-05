/**
 * Route registration — patient portal only (`src/views/patient/pages`).
 * Editable: `mainPage` (must match a key in `PAGES`).
 */
import type { ComponentType, ReactNode } from "react";
import Dashboard from "./views/patient/pages/Dashboard";
import Exercises from "./views/patient/pages/Exercises";
import Workouts from "./views/patient/pages/Workouts";
import Marketplace from "./views/patient/pages/Marketplace";
import Chat from "./views/patient/pages/Chat";
import Affiliates from "./views/patient/pages/Affiliates";
import Nutrition from "./views/patient/pages/Nutrition";
import Health from "./views/patient/pages/Health";
import Biomarkers from "./views/patient/pages/Biomarkers";
import Documents from "./views/patient/pages/Documents";
import MyCases from "./views/patient/pages/MyCases";
import BrowseTreatments from "./views/patient/pages/BrowseTreatments";
import HealthAnalysis from "./views/patient/pages/HealthAnalysis";
import Progress from "./views/patient/pages/Progress";
import TrainerChat from "./views/patient/pages/TrainerChat";
import Habits from "./views/patient/pages/Habits";
import Appointments from "./views/patient/pages/Appointments";
import __Layout from "./layouts/AppLayout";

export type PageComponent = ComponentType<any>;
export type LayoutComponent = ComponentType<{ children?: ReactNode }>;

export const PAGES: Record<string, PageComponent> = {
  Dashboard,
  Exercises,
  Workouts,
  Marketplace,
  Chat,
  Affiliates,
  Nutrition,
  Health,
  Biomarkers,
  Documents,
  MyCases,
  BrowseTreatments,
  HealthAnalysis,
  Progress,
  TrainerChat,
  Habits,
  Appointments,
};

export interface PagesConfig {
  mainPage: string;
  Pages: Record<string, PageComponent>;
  Layout: LayoutComponent;
}

export const pagesConfig = {
  mainPage: "Dashboard",
  Pages: PAGES,
  Layout: __Layout as LayoutComponent,
} satisfies PagesConfig;
