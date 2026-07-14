// @ts-nocheck
import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { AlertCircle, FileText, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  findRangeFor,
  parseRangesFromLabReport,
  selectLabReportText,
  selectObservations,
} from "@/types/tasso/patient_types";
import { useTassoTestResult } from "@/hooks/tasso/usePatientTasso";
import AnalyteRow from "./AnalyteRow";

/**
 * Detail dialog for a single test result. Two tabs:
 *   - "Summary"    → analyte rows from the FHIR Observations, with
 *                    reference ranges extracted from the plain-text
 *                    lab report and HIGH/LOW interpretation badges.
 *   - "Lab report" → the canonical plain-text PDF blob in a <pre> so
 *                    everything (methodology, lab director, etc.) is
 *                    visible without parsing.
 */
export default function TestResultDetailDrawer({
  testResultId,
  onClose,
}: {
  testResultId: string | null;
  onClose: () => void;
}) {
  const open = Boolean(testResultId);
  const { data, isLoading, isError, error } = useTassoTestResult(
    testResultId ?? undefined,
  );

  const observations = useMemo(
    () => selectObservations(data?.renderedResults),
    [data?.renderedResults],
  );
  const labReport = useMemo(
    () => selectLabReportText(data?.renderedResults),
    [data?.renderedResults],
  );
  const ranges = useMemo(
    () => parseRangesFromLabReport(labReport),
    [labReport],
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileText className="w-4 h-4 text-primary" />
            Lab result
            {data?.createdAt && (
              <Badge variant="outline" className="font-mono text-xs">
                {safeFormat(data.createdAt, "MMM d, yyyy")}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="flex items-start gap-2 p-3 rounded-md border border-destructive/30 bg-destructive/5 text-destructive text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              {(error as { message?: string } | undefined)?.message ??
                "Couldn't load this result."}
            </span>
          </div>
        ) : !data ? null : (
          <Tabs defaultValue="summary" className="space-y-4">
            <TabsList className="grid grid-cols-2 max-w-sm">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="lab-report">Lab report</TabsTrigger>
            </TabsList>

            <TabsContent value="summary">
              {observations.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  No structured results available for this report.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b-2 border-border">
                        <th className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground pb-2 pr-3">
                          Analyte
                        </th>
                        <th className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground pb-2 pr-3">
                          Value
                        </th>
                        <th className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground pb-2 pr-3">
                          Range
                        </th>
                        <th className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground pb-2 text-right">
                          Flag
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {observations.map((o, i) => (
                        <AnalyteRow
                          key={`${o.code?.text ?? "obs"}-${i}`}
                          observation={o}
                          range={findRangeFor(o, ranges)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="text-[11px] text-muted-foreground mt-4">
                Reference ranges are extracted from your lab's report
                text. If a range is missing, the underlying observation
                doesn't carry one — view the Lab report tab for the
                lab's full formatting.
              </p>
            </TabsContent>

            <TabsContent value="lab-report">
              {labReport ? (
                <pre className="text-[11px] font-mono whitespace-pre-wrap border border-border rounded-md p-4 bg-card max-h-[60vh] overflow-y-auto">
                  {labReport}
                </pre>
              ) : (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  No lab report attached to this result.
                </p>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

function safeFormat(iso: string, pattern: string): string {
  try {
    return format(parseISO(iso), pattern);
  } catch {
    return iso;
  }
}
