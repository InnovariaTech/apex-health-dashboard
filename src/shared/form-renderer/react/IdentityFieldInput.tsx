// GENERATED from apex-form-renderer/src — do not edit here. Edit there, then run `npm run sync`.
import { ThemedIdentityField, useIdentityPlaceholder } from "./ThemeScope";
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
}: {
  spec: IdentityFieldSpec;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string | null;
}) {
  const placeholder = useIdentityPlaceholder(spec.field, spec.placeholder ?? "");
  const id = `identity-${spec.field}`;
  const describedBy = [spec.help && `${id}-help`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;

  return (
    <ThemedIdentityField field={spec.field} className="gap-1.5">
      <label className="apx-question-text" htmlFor={id}>
        {spec.label}
        {spec.optional && <span className="opacity-60" style={{ fontWeight: 400 }}> (optional)</span>}
      </label>
      {spec.help && (
        <p className="apx-help-text" id={`${id}-help`}>
          {spec.help}
        </p>
      )}
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
      {error && (
        <p className="apx-error" id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </ThemedIdentityField>
  );
}
