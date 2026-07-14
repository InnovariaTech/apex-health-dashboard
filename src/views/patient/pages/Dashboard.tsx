// @ts-nocheck
import React from "react";
import { usePatientHomeData } from "@/views/patient/hooks/usePatientHomeData";

import DashboardPageHead from "@/views/patient/components/home/DashboardPageHead";
import CareHubRow from "@/views/patient/components/home/CareHubRow";
import HealthScoreCardNew from "@/views/patient/components/home/HealthScoreCardNew";
import BioAgeCard from "@/views/patient/components/home/BioAgeCard";
import TrainerizeVitalsRow from "@/views/patient/components/home/TrainerizeVitalsRow";
import ProgressPhotosCard from "@/views/patient/components/home/ProgressPhotosCard";

/**
 * Patient dashboard — recomposed to mirror the `New Ui` mockup:
 *   1. Page head (title + last-sync + patient chip)
 *   2. Care hub row (Messages · Tasks · Store featured)
 *   3. Hero (Health score · Biological age)
 *   4. Vitals & body composition (6 tiles)
 *   5. Progress photos + before/after slider
 *
 * Older "Quick access" tiles, AI section preview, and habits card were
 * removed from this surface to keep the dashboard a "health snapshot"
 * rather than a navigation hub. Those features still live on their own
 * pages — Habits, HealthAnalysis, Workouts, etc.
 */
export default function Dashboard() {
  const { isLoading } = usePatientHomeData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-9 max-w-[1280px] mx-auto bg-background text-foreground">
      <DashboardPageHead />

      <CareHubRow />

      <div className="grid grid-cols-1 lg:grid-cols-[1.32fr_1fr] gap-[22px] mb-[22px]">
        <HealthScoreCardNew />
        <BioAgeCard />
      </div>

      <TrainerizeVitalsRow />

      <ProgressPhotosCard />
    </div>
  );
}
