// @ts-nocheck
import { Badge } from "@/components/ui/badge";
import {
  getInterpretation,
  getObservationName,
  parseObservationValue,
  type ParsedReferenceRange,
  type TassoFhirObservation,
} from "@/types/tasso/patient_types";

/**
 * Single row in the test-result detail table. Range comes from the
 * plain-text lab report extraction (see `parseRangesFromLabReport` in
 * `patient_types.ts`); when no match is found we just omit the range
 * column for that row.
 */
export default function AnalyteRow({
  observation,
  range,
}: {
  observation: TassoFhirObservation;
  range: ParsedReferenceRange | null;
}) {
  const name = getObservationName(observation);
  const parsed = parseObservationValue(observation);
  const interpretation = getInterpretation(observation);

  const valueText = parsed.unit ? `${parsed.value} ${parsed.unit}` : parsed.value;
  const rangeText =
    range && typeof range.low === "number" && typeof range.high === "number"
      ? `${range.low} – ${range.high}${range.unit ? ` ${range.unit}` : ""}`
      : null;

  return (
    <tr className="border-b border-border last:border-b-0">
      <td className="py-2.5 pr-3 text-sm font-medium text-foreground">
        {name}
      </td>
      <td className="py-2.5 pr-3 text-sm text-foreground font-mono">
        {valueText || "—"}
      </td>
      <td className="py-2.5 pr-3 text-xs text-muted-foreground font-mono">
        {rangeText ?? ""}
      </td>
      <td className="py-2.5 text-right">
        {interpretation && (
          <Badge
            variant="outline"
            className={
              interpretation === "HIGH"
                ? "border-amber-500 text-amber-600"
                : interpretation === "LOW"
                  ? "border-amber-500 text-amber-600"
                  : interpretation === "NORMAL"
                    ? "border-emerald-500 text-emerald-600"
                    : "text-muted-foreground"
            }
          >
            {interpretation}
          </Badge>
        )}
      </td>
    </tr>
  );
}
