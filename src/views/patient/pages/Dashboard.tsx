// @ts-nocheck
import React from "react";
import { usePatientHomeData } from "@/views/patient/hooks/usePatientHomeData";

import QuickActionTiles from "@/views/patient/components/home/QuickActionTiles";
import DashboardHero from "@/views/patient/components/home/DashboardHero";
import AnalyzeHealthSection from "@/views/patient/components/health-analysis/AnalyzeHealthSection";
import LatestSummaryPreview from "@/views/patient/components/health-analysis/LatestSummaryPreview";

export default function Dashboard() {
  const {
    // currentUser,
    // weekSessions,
    // todayHabits,
    // recentCheckIn,
    isLoading,
    // reload,
  } = usePatientHomeData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // const healthScore = currentUser?.health_score ? Math.round(currentUser.health_score) : 78;
  // const firstName = currentUser?.full_name?.split(' ')[0] || 'Patient';

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-background text-foreground">
      <DashboardHero />

      {/* AI Health Analysis + Latest Summary */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6 items-stretch">
        <AnalyzeHealthSection />
        <LatestSummaryPreview />
      </div>

      {/* Row 3: Quick action tiles */}
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Quick Access</p>
        <QuickActionTiles />
      </div>

      {/* Row 4: Weekly activity
      <WeeklyProgress sessions={weekSessions} />
      */}
    </div>
  );
}
