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
    return "bg-[var(--info-soft)] text-[var(--info)] border-[var(--info)]";
  }
  return "bg-secondary text-muted-foreground border-border";
}

function getConnectorClass(status: "completed" | "current" | "pending") {
  if (status === "completed") return "bg-primary";
  return "bg-border";
}

export default function CaseTimeline({ caseDetails }: CaseTimelineProps) {
  const timeline = deriveCaseTimeline(caseDetails);

  return (
    <Card>
      <CardContent className="p-5 md:p-6 space-y-6">
        <div>
          <p className="apex-eyebrow">Case status</p>
          <p className="font-serif text-xl font-medium tracking-[-0.015em] text-foreground mt-1">
            {timeline.statusLabel}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
            {timeline.caseShortId && (
              <span>
                ID <span className="font-mono text-ink-2">{timeline.caseShortId}</span>
              </span>
            )}
            {timeline.referralCode && (
              <span>
                Referral{" "}
                <span className="font-mono text-ink-2">{timeline.referralCode}</span>
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {timeline.stages.map((stage, index) => {
            const isLast = index === timeline.stages.length - 1;
            const formattedTimestamp = formatTimelineDate(stage.timestamp);

            return (
              <div key={stage.key} className="relative">
                {!isLast && (
                  <div className="hidden md:block absolute top-4 left-8 w-[calc(100%-1rem)] h-px">
                    <div className={`w-full h-full ${getConnectorClass(stage.status)}`} />
                  </div>
                )}

                <div
                  className={`w-8 h-8 rounded-full border flex items-center justify-center text-[13px] font-mono font-medium relative z-10 ${getCircleClass(stage.status)}`}
                >
                  {stage.status === "completed" ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    stage.number
                  )}
                </div>

                <p className="text-[13px] font-medium text-foreground mt-2">
                  {stage.label}
                </p>
                {formattedTimestamp && (
                  <p className="text-[11px] font-mono text-muted-foreground mt-1">
                    {formattedTimestamp}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
