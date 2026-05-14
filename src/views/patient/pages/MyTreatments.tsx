// @ts-nocheck
import React from "react";
import MyTreatmentsComponent from "@/components/health/MyTreatments";

export default function MyTreatments() {
  return (
    <div className="p-4 md:p-9 max-w-[1480px] mx-auto bg-background text-foreground min-h-screen">
      {/* Page head */}
      <div className="mb-6 pb-5 border-b border-border">
        <div className="apex-eyebrow mb-2">Protocol</div>
        <h1 className="apex-page-title">
          My <em>treatments</em>
        </h1>
        <p className="text-[13px] text-ink-2 mt-2">
          Your personalized treatment stack prescribed by Apex MD.
        </p>
      </div>
      <MyTreatmentsComponent />
    </div>
  );
}
