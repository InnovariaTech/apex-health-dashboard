import { Check } from "lucide-react";
import type { CaseDetailsItem } from "@/types/care-validate/case_types";
import { Card, CardContent } from "@/components/ui/card";
import { deriveCaseTimeline, formatTimelineDate } from "@/views/patient/utils/caseTimelineUtils";

interface CaseTimelineProps {
  caseDetails: CaseDetailsItem;
}

function getCircleClass(status: "completed" | "current" | "pending") {
  if (status === "completed") {
    return "bg-primary text-primary-foreground border-primary";
  }
  if (status === "current") {
    return "bg-primary/10 text-primary border-primary ring-2 ring-primary/40";
  }
  return "bg-muted text-muted-foreground border-border";
}

function getConnectorClass(status: "completed" | "current" | "pending") {
  if (status === "completed") return "bg-primary";
  return "bg-border";
}

export default function CaseTimeline({ caseDetails }: CaseTimelineProps) {
  const timeline = deriveCaseTimeline(caseDetails);

  return (
    <Card className="border-2 border-border">
      <CardContent className="p-4 md:p-6 space-y-6">
        <div>
          <p className="text-sm text-muted-foreground">Status:</p>
          <p className="text-lg font-bold text-foreground">{timeline.statusLabel}</p>
          {timeline.caseShortId && (
            <p className="text-xs text-muted-foreground mt-1">ID: {timeline.caseShortId}</p>
          )}
          {timeline.referralCode && (
            <p className="text-xs text-muted-foreground mt-1">
              Referral Code: {timeline.referralCode}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {timeline.stages.map((stage, index) => {
            const isLast = index === timeline.stages.length - 1;
            const formattedTimestamp = formatTimelineDate(stage.timestamp);

            return (
              <div key={stage.key} className="relative">
                {!isLast && (
                  <div className="hidden md:block absolute top-4 left-8 w-[calc(100%-1rem)] h-0.5">
                    <div className={`w-full h-full ${getConnectorClass(stage.status)}`} />
                  </div>
                )}

                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold relative z-10 ${getCircleClass(stage.status)}`}
                >
                  {stage.status === "completed" ? <Check className="w-4 h-4" /> : stage.number}
                </div>

                <p className="text-sm font-semibold text-foreground mt-2">{stage.label}</p>
                {formattedTimestamp && (
                  <p className="text-xs text-muted-foreground mt-1">{formattedTimestamp}</p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

