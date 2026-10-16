// GENERATED from apex-form-renderer/src — do not edit here. Edit there, then run `npm run sync`.
/**
 * The types the shared form renderer works with. Kept loose on purpose (string keys) so each
 * app's own, stricter types — the admin's `branding_types`, the patient app's `theme_types` and
 * `intake_types` — are accepted as they are.
 */

export type ThemeElementStyle = {
  [property: string]: string | number | Record<string, string | number> | undefined;
  hover?: Record<string, string | number>;
  focus?: Record<string, string | number>;
};

export type ThemeElements = Partial<Record<string, ThemeElementStyle>>;

export type IdentityThemeField = "firstName" | "lastName" | "email" | "phone" | "dob";

/** A merged theme as the backend sends it (`theme.values`). Apply as-is. */
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
  identity?: Partial<Record<IdentityThemeField, ThemeElements>>;
  /** Button texts (rules v3): the form's per key, else the organization's. */
  labels?: Partial<Record<FormLabelKey, string>>;
}

/** The buttons whose words a theme may change. */
export type FormLabelKey = "back" | "next" | "submit" | "pay" | "start";

/** Which properties each element accepts, and its hover/focus states (the backend's rules). */
export interface ThemeRulesTable {
  version?: number;
  elements: Record<
    string,
    {
      properties: { name: string; variable: string | null }[];
      states: { name: string; properties: { name: string; variable: string | null }[] }[];
    }
  >;
}

/** An image on a question: where it goes is the theme's call (`questionImage.placement`). */
export interface QuestionImage {
  url: string;
  alt: string;
}

/** A choice as both the patient walk and the builder preview describe it. */
export interface ChoiceOption {
  key: string;
  label: string;
  helpText?: string | null;
  /** "None of these": picking it clears the rest, and picking anything else clears it. */
  exclusive?: boolean;
}

export type ContentSeverity = "info" | "warning" | "crisis";

/** Authored clinical copy shown with a question or a result. Markdown. */
export interface ContentBlockData {
  ref?: string;
  severity: ContentSeverity;
  body: string;
}
