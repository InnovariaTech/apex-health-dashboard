import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type DynamicCaseForm,
  fieldValueToLines,
} from "@/views/patient/utils/caseFormUtils";

interface CaseDynamicFormCardProps {
  form: DynamicCaseForm;
}

export default function CaseDynamicFormCard({ form }: CaseDynamicFormCardProps) {
  return (
    <Card className="border-2 border-border/80 bg-muted/30 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold text-foreground">{form.name}</CardTitle>
        {form.description && (
          <p className="text-sm text-muted-foreground">{form.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {form.fields.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No question responses available for this form.
          </p>
        ) : (
          form.fields.map((field) => {
            const lines = fieldValueToLines(field.value);

            return (
              <div
                key={field.responseId}
                className="rounded-md border border-border bg-background/95 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground leading-snug">{field.label}</p>
                  {field.isPHI && (
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                      PHI
                    </span>
                  )}
                </div>

                {lines.length === 0 ? (
                  <p className="text-sm text-muted-foreground mt-1">—</p>
                ) : lines.length === 1 ? (
                  <p className="text-sm text-muted-foreground mt-2">{lines[0]}</p>
                ) : (
                  <ul className="mt-2 space-y-1">
                    {lines.map((line, idx) => (
                      <li key={`${field.responseId}-${idx}`} className="text-sm text-muted-foreground">
                        - {line}
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

