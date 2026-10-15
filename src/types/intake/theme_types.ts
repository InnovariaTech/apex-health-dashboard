/**
 * The theme patient intake pages wear: `theme` on `GET /api/intake/:token/manifest` (and on the
 * public product page). See `Documents/Intake-Form/Branding and partner onboarding/branding/`.
 * The backend has already merged Apex default → partner → form override; apply it as-is.
 */

export type ThemeElementStyle = {
  [property: string]: string | number | Record<string, string | number> | undefined;
  hover?: Record<string, string | number>;
  focus?: Record<string, string | number>;
};

export type ThemeElements = Partial<Record<string, ThemeElementStyle>>;

export interface Theme {
  global?: {
    fontFamily?: string;
    colors?: Partial<Record<string, string>>;
    radius?: string;
    containerMaxWidth?: string;
  };
  elements?: ThemeElements;
  questionTypes?: Partial<Record<string, ThemeElements>>;
  questions?: Record<string, ThemeElements>;
  /** The details page of a public form: one entry per field, applied on top of `elements`. */
  identity?: Partial<Record<IdentityThemeField, ThemeElements>>;
}

/** The details-page fields a theme can style (`identity.<field>`). */
export type IdentityThemeField = "firstName" | "lastName" | "email" | "phone" | "dob";

export interface ResolvedTheme {
  /** Changes whenever the partner theme, form override or logo changes. */
  version: string;
  logoUrl: string | null;
  values: Theme;
}

/** Which properties each element accepts, and its hover/focus states (from the backend's rules). */
export interface ThemeRulesTable {
  version: number;
  elements: Record<
    string,
    {
      properties: { name: string; variable: string | null }[];
      states: { name: string; properties: { name: string; variable: string }[] }[];
    }
  >;
}
