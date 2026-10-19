// GENERATED from apex-form-renderer/src — do not edit here. Edit there, then run `npm run sync`.
import { isHidden } from "../theme/themeKit";
import { ThemedIdentityField, useIdentityPlaceholder, useThemeValues } from "./ThemeScope";
import { DatePartsWidget } from "./LayoutWidgets";
import type { IdentityFieldSpec } from "../identity/identityFields";

/**
 * One field of the public details page, drawn with the theme's question parts: label
 * (`questionText`), help text, input and placeholder, error. Must sit inside a `ThemeScope`.
 * Same file in the patient app and the admin preview.
 */
export default function IdentityFieldInput({
  spec,
  value,
  onChange,
  onBlur,
  error,
  dateParts = false,
}: {
  spec: IdentityFieldSpec;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string | null;
  /** Date of birth as Month / Day / Year dropdowns (a details-page layout's `dobWidget`). Same `YYYY-MM-DD` value. */
  dateParts?: boolean | undefined;
}) {
  const placeholder = useIdentityPlaceholder(spec.field, spec.placeholder ?? "");
  // The theme may hide the help line (rules v5): this field's `identity` level, then the form's.
  const help = spec.help && !isHidden(useThemeValues(), "helpText", { identity: spec.field }) ? spec.help : null;
  const id = `identity-${spec.field}`;
  const describedBy = [help && `${id}-help`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;

  return (
    <ThemedIdentityField field={spec.field} className="gap-1.5">
      <label className="apx-question-text" htmlFor={id}>
        {spec.label}
        {spec.optional && <span className="opacity-60" style={{ fontWeight: 400 }}> (optional)</span>}
      </label>
      {help && (
        <p className="apx-help-text" id={`${id}-help`}>
          {help}
        </p>
      )}
      {dateParts && spec.inputType === "date" ? (
        <DatePartsWidget
          value={value}
          onChange={(v) => {
            onChange(v);
            // A complete date counts as leaving the field, so its check shows straight away.
            if (v) onBlur?.();
          }}
          maxYear={new Date().getFullYear()}
        />
      ) : (
      <input
        id={id}
        type={spec.inputType}
        className="apx-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
      />
      )}
      {error && (
        <p className="apx-error" id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </ThemedIdentityField>
  );
}
