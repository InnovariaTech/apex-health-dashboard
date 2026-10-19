// GENERATED from apex-form-renderer/src — do not edit here. Edit there, then run `npm run sync`.
/**
 * The types the shared form renderer works with. Kept loose on purpose (string keys) so each
 * app's own, stricter types — the admin's `branding_types`, the patient app's `theme_types` and
 * `intake_types` — are accepted as they are.
 */

export type ThemeElementStyle = {
  /** `hidden` (rules v5) is the one boolean: the element is not drawn. */
  [property: string]: string | number | boolean | Record<string, string | number> | undefined;
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

/**
 * The buttons whose words a theme may change. `nextWithTitle` (rules v5) is a template with
 * `{title}`, e.g. "Next: {title}"; read it through `nextLabel`, never on its own.
 */
export type FormLabelKey = "back" | "next" | "submit" | "pay" | "start" | "nextWithTitle";

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

/** What a choice shows as a product card (the `cards` widget). Never a price: see `plan`. */
export interface OptionCardContent {
  image?: QuestionImage;
  badge?: string;
  subtitle?: string;
  features?: string[];
}

/**
 * The plan a choice sells, as the step serves it: the only price a card may show, so the figure on
 * screen is the one charged. `available: false` when the plan is archived or gone.
 */
export interface OptionPlan {
  checkoutFormId: string;
  title: string;
  cost: number | null;
  compareAtCost: number | null;
  currency: string;
  /** `upfront`: the cost covers every month. `per_cycle`: charged every month. */
  billingMode: "upfront" | "per_cycle";
  totalCycles: number | null;
  available: boolean;
}

/** A choice as both the patient walk and the builder preview describe it. */
export interface ChoiceOption {
  key: string;
  label: string;
  helpText?: string | null;
  /** "None of these": picking it clears the rest, and picking anything else clears it. */
  exclusive?: boolean;
  /** Drawn by the `cards` widget. */
  card?: OptionCardContent | null;
  /** The plan this choice sells, with its live price (added by the server when a step is served). */
  plan?: OptionPlan | null;
}

export type ContentSeverity = "info" | "warning" | "crisis";

/** Authored clinical copy shown with a question or a result. Markdown. */
export interface ContentBlockData {
  ref?: string;
  severity: ContentSeverity;
  body: string;
}
