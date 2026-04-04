import React from "react";
import MyTreatmentsComponent from "@/components/health/MyTreatments";
import { Pill } from "lucide-react";

export default function MyTreatments() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Pill className="w-7 h-7 text-primary" />
          <h1 className="text-3xl font-black text-foreground uppercase tracking-wide">My Treatments</h1>
        </div>
        <p className="text-muted-foreground text-sm ml-10">Your personalized treatment stack prescribed by Apex MD</p>
      </div>
      <MyTreatmentsComponent />
    </div>
  );
}