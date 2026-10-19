// GENERATED from apex-form-renderer/src — do not edit here. Edit there, then run `npm run sync`.
import type { FormLabelKey, IdentityThemeField, Theme, ThemeElementStyle, ThemeElements, ThemeRulesTable } from "../types";
import { APEX_BASE, APEX_BASE_STATES, APEX_STRUCTURE_CSS } from "./apexBase";

/**
 * Turns a theme into CSS, the way `rendering-the-theme.md` describes: theme JSON → CSS variables,
 * and one generated stylesheet whose rules read those variables. No component reads theme JSON.
 *
 * Unlike the backend's reference page this does not use CSS cascade layers: Tailwind 3's reset is
 * unlayered and would beat any layered rule. Instead each themed property reads its variable and
 * falls back to the Apex base value (`apexBase.ts`); everything is scoped under one selector so the
 * surrounding admin UI is untouched.
 *
 * Framework-free on purpose: the patient app will use the same file.
 */

export const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

export const SHADOWS: Record<string, string> = {
  none: "none",
  sm: "0 1px 2px rgba(20,28,20,.06)",
  md: "0 4px 12px rgba(20,28,20,.10)",
  lg: "0 12px 32px rgba(20,28,20,.14)",
};

/** Google Fonts families for the theme's font choices (`system` needs none). */
const GOOGLE_FONTS: Record<string, string> = {
  Archivo: "Archivo:wght@400;500;600;700;800",
  Inter: "Inter:wght@300;400;500;600;700;800",
  Roboto: "Roboto:wght@300;400;500;700",
  "Open Sans": "Open+Sans:wght@300;400;500;600;700;800",
  Lato: "Lato:wght@300;400;700",
  Poppins: "Poppins:wght@300;400;500;600;700;800",
  Montserrat: "Montserrat:wght@300;400;500;600;700;800",
  "Source Serif 4": "Source+Serif+4:wght@300;400;500;600;700;800",
};

export function fontStack(fontFamily: string): string {
  return fontFamily === "system" ? "system-ui, sans-serif" : `"${fontFamily}", sans-serif`;
}

/** Adds the font's stylesheet once per page. */
export function loadThemeFont(fontFamily: string | undefined | null): void {
  if (!fontFamily || fontFamily === "system" || typeof document === "undefined") return;
  const family = GOOGLE_FONTS[fontFamily];
  if (!family) return;
  const id = `apx-font-${kebab(fontFamily.replace(/\s+/g, ""))}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${family}&display=swap`;
  document.head.appendChild(link);
}

/** How fast hover/focus changes animate (theme `transition` preset → a duration). */
export const TRANSITIONS: Record<string, string> = { none: "0s", fast: "150ms", slow: "300ms" };
/** Hover motion presets: fixed, small amounts so nothing can cover content. */
export const MOTIONS: Record<string, string> = { none: "none", lift: "translateY(-2px)", grow: "scale(1.02)" };

/** Values the frontend reads (words, links, places, layout choices, `hidden`), never written as CSS. */
export const VALUE_ONLY = new Set(["text", "placement", "attach", "align", "arrange", "link", "hidden"]);

const cssValue = (property: string, value: string | number) => {
  const v = String(value);
  if (property === "shadow") return SHADOWS[v] ?? "none";
  if (property === "transition") return TRANSITIONS[v] ?? v;
  if (property === "motion") return MOTIONS[v] ?? "none";
  return v;
};

export type CssVars = Record<string, string>;

function blockVariables(element: string, block: ThemeElementStyle | undefined, out: CssVars): CssVars {
  for (const [key, value] of Object.entries(block ?? {})) {
    if (VALUE_ONLY.has(key) || value === undefined) continue; // read by the layout, not CSS
    if ((key === "hover" || key === "focus") && typeof value === "object") {
      for (const [p, v] of Object.entries(value)) out[`--apx-${kebab(element)}-${kebab(p)}-${key}`] = cssValue(p, v);
    } else if (typeof value === "string" || typeof value === "number") {
      out[`--apx-${kebab(element)}-${kebab(key)}`] = cssValue(key, value);
    }
  }
  return out;
}

function elementsVariables(elements: ThemeElements | undefined): CssVars {
  const out: CssVars = {};
  for (const [element, block] of Object.entries(elements ?? {})) blockVariables(element, block, out);
  return out;
}

export interface ThemeVariables {
  /** `global` and `elements`: set on the page element. */
  page: CssVars;
  /** `questionTypes.<type>`: set on every question of that type. */
  byType: Record<string, CssVars>;
  /** `questions.<key>`: set on that one question (after its type's, so it wins). */
  byKey: Record<string, CssVars>;
}

export function themeToVariables(values: Theme | null | undefined): ThemeVariables {
  const v = values ?? {};
  const page: CssVars = {};
  const g = v.global ?? {};
  if (g.fontFamily) page["--apx-font-family"] = fontStack(g.fontFamily);
  if (g.radius) page["--apx-radius"] = g.radius;
  if (g.containerMaxWidth) page["--apx-container-max-width"] = g.containerMaxWidth;
  for (const [c, color] of Object.entries(g.colors ?? {})) if (color) page[`--apx-color-${kebab(c)}`] = color;
  Object.assign(page, elementsVariables(v.elements));

  const byType: Record<string, CssVars> = {};
  for (const [type, els] of Object.entries(v.questionTypes ?? {})) byType[type] = elementsVariables(els);
  const byKey: Record<string, CssVars> = {};
  for (const [key, els] of Object.entries(v.questions ?? {})) byKey[key] = elementsVariables(els);
  return { page, byType, byKey };
}

/** Variables for one question (or follow-up field): its type's, then its own. */
export function questionVariables(vars: ThemeVariables, type: string, key: string): CssVars {
  return { ...(vars.byType[type] ?? {}), ...(vars.byKey[key] ?? {}) };
}

/** Variables for one details-page field (`identity.<field>`), set on that field so it wins. */
export function identityVariables(values: Theme | null | undefined, field: IdentityThemeField): CssVars {
  return elementsVariables(values?.identity?.[field]);
}

/** Placeholder words for a details-page field: the theme's, else the page's own default. */
export function identityPlaceholder(values: Theme | null | undefined, field: IdentityThemeField, fallback: string): string {
  const t = values?.identity?.[field]?.placeholder?.text;
  return typeof t === "string" ? t : fallback;
}

/** Where an element is drawn, for the levels below `elements`: a question, or a details-page field. */
export type ThemePlace = { type: string; key: string } | { identity: IdentityThemeField } | null;

/**
 * Whether the theme switches an element off (rules v5, `hidden: true`): the most specific level
 * that says either way wins — `questions.<key>`, then `questionTypes.<type>`, then `elements`
 * (`identity.<field>`, then `elements`, on the details pages). `false` shows it again. A hidden
 * element is not drawn at all; parents (`header`, `progress`) are checked by their callers.
 */
export function isHidden(values: Theme | null | undefined, element: string, place: ThemePlace = null): boolean {
  const v = values ?? {};
  const read = (els?: ThemeElements) => {
    const h = els?.[element]?.hidden;
    return typeof h === "boolean" ? h : undefined;
  };
  let own: boolean | undefined;
  if (place && "identity" in place) own = read(v.identity?.[place.identity]);
  else if (place && "key" in place) own = read(v.questions?.[place.key]) ?? read(v.questionTypes?.[place.type]);
  return (own ?? read(v.elements)) === true;
}

export type ImagePlacement = "top" | "middle" | "bottom" | "left" | "right";
const PLACEMENTS = new Set<string>(["top", "middle", "bottom", "left", "right"]);

/** Where a question's image goes: the question's own, then its type's, then the form's, else middle. */
export function imagePlacement(values: Theme | null | undefined, key: string, type: string): ImagePlacement {
  const v = values ?? {};
  const read = (els?: ThemeElements) => {
    const p = els?.questionImage?.placement;
    return typeof p === "string" && PLACEMENTS.has(p) ? (p as ImagePlacement) : undefined;
  };
  return read(v.questions?.[key]) ?? read(v.questionTypes?.[type]) ?? read(v.elements) ?? "middle";
}

/** Placeholder words: the question's own, then its type's, then the default, else empty. */
export function placeholderText(values: Theme | null | undefined, key: string, type: string): string {
  const v = values ?? {};
  const read = (els?: ThemeElements) => {
    const t = els?.placeholder?.text;
    return typeof t === "string" ? t : undefined;
  };
  return read(v.questions?.[key]) ?? read(v.questionTypes?.[type as keyof NonNullable<Theme["questionTypes"]>]) ?? read(v.elements) ?? "";
}

// ── The page frame (rules v3) ────────────────────────────────────────────────

export type Side = "left" | "center" | "right";
export type Attach = "form" | "page";
export type Arrange = "spread" | "left" | "center" | "right" | "stretch";

/** The layout choices of the frame: value-only properties the layout reads, never CSS. */
export interface FrameLayout {
  headerAttach: Attach;
  logoAlign: Side;
  /** Where the header button sits: its own side, else the side opposite the logo (never the same). */
  buttonAlign: Side;
  /** The header button: shown only when it has both words and an https link. */
  button: { text: string; link: string } | null;
  containerAlign: Side;
  stepAlign: Side;
  actionsAttach: Attach;
  arrange: Arrange;
}

const pick = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
  typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
const SIDES = ["left", "center", "right"] as const;

export function frameLayout(values: Theme | null | undefined): FrameLayout {
  const el = values?.elements ?? {};
  const logoAlign = pick(el.logo?.align, SIDES, "left");
  const opposite: Side = logoAlign === "right" ? "left" : "right";
  let buttonAlign = pick(el.headerButton?.align, SIDES, opposite);
  if (buttonAlign === logoAlign) buttonAlign = opposite;
  const text = el.headerButton?.text;
  const link = el.headerButton?.link;
  const button =
    typeof text === "string" && text.trim() && typeof link === "string" && /^https:\/\//i.test(link)
      ? { text: text.trim(), link }
      : null;
  return {
    headerAttach: pick(el.header?.attach, ["form", "page"] as const, "form"),
    logoAlign,
    buttonAlign,
    button,
    containerAlign: pick(el.container?.align, SIDES, "center"),
    stepAlign: pick(el.step?.align, SIDES, "center"),
    actionsAttach: pick(el.actions?.attach, ["form", "page"] as const, "form"),
    arrange: pick(el.actions?.arrange, ["spread", "left", "center", "right", "stretch"] as const, "spread"),
  };
}

/** A button's words: the theme's, else the page's own. */
export function formLabel(values: Theme | null | undefined, key: FormLabelKey, fallback: string): string {
  const t = values?.labels?.[key];
  return typeof t === "string" && t.trim() ? t : fallback;
}

/**
 * The Next button's words when the next page has a title (rules v5): `labels.nextWithTitle` with
 * `{title}` filled in, if that fits in 40 characters; else `labels.next`, else `fallback`. The
 * title is a label, not a promise — a condition may still skip that page.
 */
export function nextLabel(values: Theme | null | undefined, nextTitle: string | null | undefined, fallback: string): string {
  const template = values?.labels?.nextWithTitle;
  if (typeof template === "string" && template.includes("{title}") && nextTitle) {
    const text = template.replace("{title}", nextTitle);
    if (text.length <= 40) return text;
  }
  return formLabel(values, "next", fallback);
}

// ── The generated stylesheet ─────────────────────────────────────────────────

/** Two declarations for the shorthand-free padding keys. */
const DECLARATIONS: Record<string, string[]> = {
  paddingX: ["padding-left", "padding-right"],
  paddingY: ["padding-top", "padding-bottom"],
  shadow: ["box-shadow"],
  transition: ["transition-duration"],
  motion: ["transform"],
};

const SELECTORS: Record<string, string> = {
  placeholder: ".apx-input::placeholder",
  // Crisis content is exempt from every theme value: its theme rule never matches it.
  content: '.apx-content:not([data-severity="crisis"])',
  optionSelected: ".apx-option.apx-option-selected",
  planSelected: ".apx-plan.apx-plan-selected",
};

/** Hover must not repaint a selected option or plan over its selected style. */
const HOVER_SELECTORS: Record<string, string> = {
  option: ".apx-option:not(.apx-option-selected):hover",
  plan: ".apx-plan:not(.apx-plan-selected):hover",
};

/**
 * A selected option/plan falls back to the option's own themed value before the base. The form
 * title (rules v5) falls back to `title`, which styled it before it had its own element.
 */
const PARENT: Record<string, string> = { optionSelected: "option", planSelected: "plan", formTitle: "title" };

/** Properties an element's theme rule leaves to the structure rules (they style a wrapper). */
const WRAPPER_PROPERTIES: Record<string, string[]> = { questionImage: ["textAlign", "marginBottom"] };

const selectorFor = (element: string) => SELECTORS[element] ?? `.apx-${kebab(element)}`;
/** The page is the scope element itself, so its rule must not look for a descendant. */
const scoped = (scope: string, element: string) => (element === "page" ? scope : `${scope} ${selectorFor(element)}`);
const varFor = (element: string, property: string, state?: string) =>
  `--apx-${kebab(element)}-${kebab(property)}${state ? `-${state}` : ""}`;

function baseValue(element: string, property: string): string | null {
  const raw = APEX_BASE[element]?.[property];
  return raw === undefined ? null : property === "shadow" ? cssValue("shadow", raw) : raw;
}

/** The fallback chain for one property: its parent's themed value (if any), the base, else unset. */
function fallback(element: string, property: string): string {
  const own = baseValue(element, property);
  if (own !== null) return own;
  const parent = PARENT[element];
  if (parent) return `var(${varFor(parent, property)}, ${baseValue(parent, property) ?? "unset"})`;
  return "unset";
}

const declare = (property: string, value: string) =>
  (DECLARATIONS[property] ?? [kebab(property)]).map((d) => `${d}: ${value};`).join(" ");

/**
 * The full stylesheet for themed parts under `scope`. With the rules from
 * `GET /admin/branding/rules` every themeable property reads its variable; without them (still
 * loading) only the base look's properties are written, so the form never renders unstyled.
 */
export function buildThemeCss(rules: ThemeRulesTable | null | undefined, scope: string): string {
  const css: string[] = [APEX_STRUCTURE_CSS.replace(/%S/g, scope)];
  const elementNames = rules ? Object.keys(rules.elements) : Object.keys(APEX_BASE);

  for (const element of elementNames) {
    const rule = rules?.elements[element as keyof ThemeRulesTable["elements"]];
    const properties = rule
      ? rule.properties.filter((p) => p.variable).map((p) => p.name)
      : Object.keys(APEX_BASE[element] ?? {});
    const own = properties.filter((p) => !WRAPPER_PROPERTIES[element]?.includes(p));
    if (own.length === 0) continue;

    const selector = scoped(scope, element);
    css.push(`${selector} { ${own.map((p) => declare(p, `var(${varFor(element, p)}, ${fallback(element, p)})`)).join(" ")} }`);

    const states = rule
      ? rule.states.map((s) => ({ name: s.name, properties: s.properties.map((p) => p.name) }))
      : Object.entries(APEX_BASE_STATES[element] ?? {}).map(([name, props]) => ({ name, properties: Object.keys(props ?? {}) }));

    for (const state of states) {
      const target =
        state.name === "focus"
          ? `${selector}:focus-visible, ${selector}:focus`
          : `${scope} ${HOVER_SELECTORS[element] ?? `${selectorFor(element)}:hover`}`;
      const stateBase = APEX_BASE_STATES[element]?.[state.name as "hover" | "focus"] ?? {};
      // A state falls back to the element's own themed value, so hovering never undoes a theme.
      const decls = state.properties.map((p) => {
        const inner = stateBase[p] ?? fallback(element, p);
        return declare(p, `var(${varFor(element, p, state.name)}, var(${varFor(element, p)}, ${inner}))`);
      });
      if (decls.length) css.push(`${target} { ${decls.join(" ")} }`);
    }
  }
  return css.join("\n");
}

/** `{ "--a": "1" }` → a React style object (custom properties pass through as-is). */
export const varsToStyle = (vars: CssVars) => vars as unknown as React.CSSProperties;
