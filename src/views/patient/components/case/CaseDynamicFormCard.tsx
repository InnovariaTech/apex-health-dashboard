import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  type DynamicCaseForm,
  fieldValueToLines,
} from "@/views/patient/utils/caseFormUtils";

interface CaseDynamicFormCardProps {
  form: DynamicCaseForm;
}

export default function CaseDynamicFormCard({ form }: CaseDynamicFormCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{form.name}</CardTitle>
        {form.description && (
          <p className="text-[13px] text-muted-foreground">{form.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {form.fields.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">
            No question responses available for this form.
          </p>
        ) : (
          form.fields.map((field) => {
            const lines = fieldValueToLines(field.value);

            return (
              <div
                key={field.responseId}
                className="rounded-[10px] border border-border bg-surface-2 p-3.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[13px] font-medium text-foreground leading-snug">
                    {field.label}
                  </p>
                  {field.isPHI && (
                    <Badge variant="warning" className="shrink-0">
                      PHI
                    </Badge>
                  )}
                </div>

                {lines.length === 0 ? (
                  <p className="text-[13px] text-muted-foreground mt-1.5">—</p>
                ) : lines.length === 1 ? (
                  <p className="text-[13px] text-ink-2 mt-2">{lines[0]}</p>
                ) : (
                  <ul className="mt-2 space-y-1">
                    {lines.map((line, idx) => (
                      <li
                        key={`${field.responseId}-${idx}`}
                        className="text-[13px] text-ink-2 flex gap-2"
                      >
                        <span className="text-muted-foreground">–</span>
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
