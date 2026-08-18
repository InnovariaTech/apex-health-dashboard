/**
 * Password policy for account creation.
 *
 * The backend (`POST /api/auth/signup`) only enforces a minimum of 8
 * characters. The uppercase and symbol rules below are an *additional*
 * client-side requirement — the server will happily accept a password that
 * fails them, so these must not be relied on as a security control. They
 * exist to steer users toward a stronger password at the point of choosing.
 */

export interface PasswordRule {
  id: string;
  /** Shown next to the live pass/fail indicator on the signup form. */
  label: string;
  test: (value: string) => boolean;
}

/** Anything that isn't a letter, a digit, or whitespace counts as a symbol. */
const SYMBOL_RE = /[^A-Za-z0-9\s]/;

export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: "length",
    label: "At least 8 characters",
    test: (v) => v.length >= 8,
  },
  {
    id: "uppercase",
    label: "One uppercase letter",
    test: (v) => /[A-Z]/.test(v),
  },
  {
    id: "symbol",
    label: "One symbol (e.g. ! ? @ #)",
    test: (v) => SYMBOL_RE.test(v),
  },
];

/** True only when every rule in `PASSWORD_RULES` passes. */
export function isPasswordValid(value: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(value));
}
