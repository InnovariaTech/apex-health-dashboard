import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Pill, ArrowRight, Clock } from "lucide-react";
import { useEnvironment } from "@/lib/EnvironmentContext";

const mockTreatments = [
  { name: "Testosterone Cypionate", dose: "200mg / week", status: "active", next: "Mon" },
  { name: "Vitamin D3", dose: "5,000 IU / day", status: "active", next: "Daily" },
  { name: "Semaglutide", dose: "0.5mg / week", status: "active", next: "Wed" },
];

export default function TreatmentsGlance({ userId }) {
  const { environment } = useEnvironment();
  const [treatments, setTreatments] = useState(mockTreatments);

  return (
    <Card className="border-2 shadow-md h-full">
      <CardHeader className="border-b pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase text-foreground">
            <Pill className="w-4 h-4" style={{ color: environment.primaryColor }} />
            My Treatments
          </CardTitle>
          <Link to={createPageUrl("MyTreatments")} className="flex items-center gap-1 text-xs font-bold hover:underline" style={{ color: environment.primaryColor }}>
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        {treatments.map((t, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:border-primary transition-colors" style={{ borderColor: "#e5e7eb" }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: environment.primaryColor + "15" }}>
                <Pill className="w-4 h-4" style={{ color: environment.primaryColor }} />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground font-medium">{t.dose}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
              <Clock className="w-3 h-3" />
              {t.next}
            </div>
          </div>
        ))}
        <Link to={createPageUrl("MyTreatments")}>
          <div className="flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold border-2 border-dashed transition-colors hover:border-primary cursor-pointer" style={{ borderColor: "#d1d5db", color: environment.primaryColor }}>
            <ArrowRight className="w-3.5 h-3.5" />
            Manage All Treatments
          </div>
        </Link>
      </CardContent>
    </Card>
  );
}