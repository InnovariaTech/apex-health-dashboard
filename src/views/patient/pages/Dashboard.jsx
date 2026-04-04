import React from "react";
import { format } from "date-fns";
import { usePatientHomeData } from "@/views/patient/hooks/usePatientHomeData";

import HealthScoreCard from "@/views/patient/components/home/HealthScoreCard";
import TreatmentsGlance from "@/views/patient/components/home/TreatmentsGlance";
import UpcomingTasks from "@/views/patient/components/home/UpcomingTasks";
import QuickActionTiles from "@/views/patient/components/home/QuickActionTiles";
import HabitTracker from "@/views/patient/components/home/HabitTracker";
import WeeklyProgress from "@/views/patient/components/home/WeeklyProgress";

export default function Dashboard() {
  const {
    currentUser,
    weekSessions,
    todayHabits,
    recentCheckIn,
    isLoading,
    reload,
  } = usePatientHomeData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const healthScore = currentUser?.health_score ? Math.round(currentUser.health_score) : 78;
  const firstName = currentUser?.full_name?.split(' ')[0] || 'Patient';

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-background text-foreground">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
          Patient Dashboard
        </h1>
      </div>

      {/* Row 1: Health Score (large) + Treatments */}
      <div className="grid lg:grid-cols-5 gap-6 mb-6">
        <div className="lg:col-span-3">
          <HealthScoreCard score={healthScore} userName={firstName} />
        </div>
        <div className="lg:col-span-2">
          <TreatmentsGlance userId={currentUser?.email} />
        </div>
      </div>

      {/* Row 2: Upcoming Tasks + Habit Tracker */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <UpcomingTasks />
        </div>
        <div>
          <HabitTracker
            userId={currentUser?.email}
            todayHabits={todayHabits}
            onUpdate={reload}
          />
        </div>
      </div>

      {/* Row 3: Quick action tiles */}
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Quick Access</p>
        <QuickActionTiles />
      </div>

      {/* Row 4: Weekly activity */}
      <WeeklyProgress sessions={weekSessions} />
    </div>
  );
}
