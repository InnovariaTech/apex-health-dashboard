// GENERATED from apex-form-renderer/src — do not edit here. Edit there, then run `npm run sync`.
import { usePlaceholder } from "./ThemeScope";

/**
 * A typed answer: several lines for free text, a number field, or a single line for a date typed
 * as text. Placeholder words come from the theme (question → type → form); a date keeps a format
 * hint when the theme sets none.
 */
export function TextAnswer({
  id,
  fieldKey,
  type,
  value,
  onChange,
  maxLength,
  dateHint = "mm/dd/yyyy",
}: {
  id?: string | undefined;
  fieldKey: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  maxLength?: number | undefined;
  /** Placeholder for a date typed as text when the theme sets none. */
  dateHint?: string | undefined;
}) {
  const themed = usePlaceholder(fieldKey, type);
  const placeholder = themed || (type === "date_text" ? dateHint : "") || undefined;

  if (type === "free_text") {
    return (
      <textarea
        id={id}
        className="apx-input"
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  return (
    <input
      id={id}
      type={type === "number" ? "number" : "text"}
      inputMode={type === "number" ? "decimal" : undefined}
      className="apx-input"
      value={value}
      placeholder={placeholder}
      maxLength={maxLength}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
