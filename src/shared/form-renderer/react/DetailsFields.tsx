// GENERATED from apex-form-renderer/src — do not edit here. Edit there, then run `npm run sync`.
import IdentityFieldInput from "./IdentityFieldInput";
import { IDENTITY_FIELDS } from "../identity/identityFields";
import { ALL_DETAILS_FIELDS } from "../layout/detailsPages";
import type { IdentityThemeField as IdentityField } from "../types";

/**
 * The patient details page's fields — first and last name, date of birth, email, phone — as a
 * details-page layout's `detailsForm` node asks for them: one column, or two, with the date of
 * birth as dropdowns or one date input. The checks and the Continue button stay the app's; this
 * only draws.
 *
 * `fields` is one details page's share, in its order. With two columns they pair up in that order
 * and the date of birth (or an odd one out) takes a full row. Without `fields`, the single page of all five as always:
 * names side by side, date of birth, then email and phone side by side.
 */
export function DetailsFields({
  values,
  onChange,
  onBlur,
  errors,
  columns = 1,
  dobWidget = "dateParts",
  fields,
}: {
  values: Record<IdentityField, string>;
  onChange: (field: IdentityField, value: string) => void;
  onBlur?: ((field: IdentityField) => void) | undefined;
  errors?: Partial<Record<IdentityField, string | null>> | undefined;
  columns?: 1 | 2 | undefined;
  dobWidget?: "dateParts" | "text" | undefined;
  fields?: IdentityField[] | undefined;
}) {
  const field = (f: IdentityField) => (
    <IdentityFieldInput
      key={f}
      spec={IDENTITY_FIELDS[f]}
      value={values[f] ?? ""}
      onChange={(v) => onChange(f, v)}
      onBlur={() => onBlur?.(f)}
      error={errors?.[f] ?? null}
      dateParts={f === "dob" && dobWidget === "dateParts"}
    />
  );
  const rows = pageRows(fields ?? ALL_DETAILS_FIELDS);
  return (
    <div className="apx-details-fields" data-columns={columns}>
      {rows.map((row) =>
        // A field left without a partner (and the date of birth) takes the full row.
        row.length === 1 ? (
          field(row[0]!)
        ) : (
          <div key={row.join("-")} className="apx-details-row">
            {row.map(field)}
          </div>
        ),
      )}
    </div>
  );
}

/** Fields two per row in page order; the date of birth always alone. */
function pageRows(fields: IdentityField[]): IdentityField[][] {
  const rows: IdentityField[][] = [];
  let open: IdentityField[] | null = null;
  for (const f of fields) {
    if (f === "dob") {
      rows.push(["dob"]);
      open = null;
    } else if (open && open.length === 1) {
      open.push(f);
      open = null;
    } else {
      open = [f];
      rows.push(open);
    }
  }
  return rows;
}
