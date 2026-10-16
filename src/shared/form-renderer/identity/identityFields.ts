// GENERATED from apex-form-renderer/src — do not edit here. Edit there, then run `npm run sync`.
import type { IdentityThemeField as IdentityField } from "../types";

/**
 * The patient details page a public form opens with: its fields, their words, and the checks shown
 * under each. Shared by the patient page and the admin preview (same file in both apps), so what
 * staff style in the theme's `identity` section is exactly what patients see.
 */

export interface IdentityFieldSpec {
  field: IdentityField;
  label: string;
  inputType: "text" | "email" | "tel" | "date";
  optional?: boolean;
  /** Shown under the label (`.apx-help-text`, styled by `identity.<field>.helpText`). */
  help?: string;
  /** Used when the theme sets no `identity.<field>.placeholder.text`. */
  placeholder?: string;
}

export const IDENTITY_FIELDS: Record<IdentityField, IdentityFieldSpec> = {
  firstName: { field: "firstName", label: "First name", inputType: "text" },
  lastName: { field: "lastName", label: "Last name", inputType: "text" },
  dob: { field: "dob", label: "Date of birth", inputType: "date", help: "As it appears on your ID." },
  email: {
    field: "email",
    label: "Email",
    inputType: "email",
    help: "We'll contact you about this form here.",
    placeholder: "you@example.com",
  },
  phone: {
    field: "phone",
    label: "Phone",
    inputType: "tel",
    optional: true,
    help: "In case your care team needs to reach you.",
    placeholder: "+1 512 555 0100",
  },
};

/** What's wrong with one field's value, or null. Phone is optional and not checked here. */
export function identityError(field: IdentityField, value: string): string | null {
  const v = value.trim();
  switch (field) {
    case "firstName":
      return v ? null : "Enter your first name.";
    case "lastName":
      return v ? null : "Enter your last name.";
    case "dob":
      if (!v) return "Enter your date of birth.";
      return v > new Date().toISOString().slice(0, 10) ? "Date of birth can't be in the future." : null;
    case "email":
      return /.+@.+\..+/.test(v) ? null : "Enter a valid email address.";
    default:
      return null;
  }
}
