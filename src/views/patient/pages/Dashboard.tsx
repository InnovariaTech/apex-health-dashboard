// @ts-nocheck
import React from "react";
import { Bolt, ShieldCheck, Clock } from "lucide-react";
import { usePatientHomeData } from "@/views/patient/hooks/usePatientHomeData";

import QuickActionTiles from "@/views/patient/components/home/QuickActionTiles";
import RecentBiomarkers from "@/views/patient/components/home/RecentBiomarkers";
import DashboardHero from "@/views/patient/components/home/DashboardHero";
import AnalyzeHealthSection from "@/views/patient/components/health-analysis/AnalyzeHealthSection";
import LatestSummaryPreview from "@/views/patient/components/health-analysis/LatestSummaryPreview";

function SectionLabel({ icon: Icon, children }) {
  return (
    <div className="apex-eyebrow flex items-center gap-1.5 mb-3">
      {Icon && <Icon className="w-3 h-3" style={{ color: "var(--apex-accent)" }} />}
      {children}
    </div>
  );
}

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
    <div className="p-4 md:p-9 max-w-[1480px] mx-auto bg-background text-foreground">
      <DashboardHero />

      {/* AI Health Analysis + Latest Summary */}
      <div className="mb-6">
        <SectionLabel>Health intelligence</SectionLabel>
        <div className="grid lg:grid-cols-2 gap-3.5 items-stretch">
          <AnalyzeHealthSection />
          <LatestSummaryPreview />
        </div>
      </div>

      {/* Quick access tiles */}
      <div className="mb-6">
        <SectionLabel icon={Bolt}>Quick access</SectionLabel>
        <QuickActionTiles />
      </div>

      {/* Recent biomarkers cross-link strip */}
      <RecentBiomarkers />

      {/* Status bar / footer */}
      <div className="apex-status-bar">
        <div className="section">
          <ShieldCheck className="w-3 h-3" />
          <strong>End-to-end encrypted</strong>
        </div>
        <div className="section">
          <Clock className="w-3 h-3" />
          uptime <strong>99.98%</strong>
        </div>
        <div className="section">
          data refresh <strong>live</strong>
        </div>
        <div className="flex-1" />
        <div className="section">
          build <strong>v4.7.2</strong>
        </div>
      </div>
    </div>
  );
}
