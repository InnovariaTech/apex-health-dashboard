// GENERATED from apex-form-renderer/src — do not edit here. Edit there, then run `npm run sync`.
import type { ThemeRulesTable } from "../types";
import { kebab } from "./themeKit";

/**
 * Which theme properties each form part accepts — a copy of the backend's rules
 * (`packages/modules/branding/theme.rules.ts`, `GET /admin/branding/rules`, version 6:
 * page frame, hover effects, the layout elements, `hidden`, `formTitle` and `stepTitle`,
 * `container.verticalAlign`,
 * generated from `describeRules()` on 2026-10-19). That route
 * is admin-only, so the patient app carries the table. When the backend bumps the rules version,
 * regenerate this from `describeRules()`. A property missing here simply isn't themed (the Apex
 * look shows); nothing breaks.
 */

const TABLE: Record<string, { p: string[]; s: Record<string, string[]> }> = {
  page: { p: ["color", "background", "borderColor"], s: {} },
  container: { p: ["color", "background", "borderColor", "borderWidth", "borderStyle", "borderRadius", "paddingX", "paddingY", "gap", "marginBottom", "width", "maxWidth", "shadow", "align", "verticalAlign"], s: {} },
  step: { p: ["color", "background", "borderColor", "borderWidth", "borderStyle", "borderRadius", "paddingX", "paddingY", "gap", "marginBottom", "width", "maxWidth", "align", "textAlign"], s: {} },
  header: { p: ["fontSize", "fontWeight", "fontStyle", "textAlign", "lineHeight", "letterSpacing", "textTransform", "color", "background", "borderColor", "borderWidth", "borderStyle", "borderRadius", "paddingX", "paddingY", "gap", "marginBottom", "attach", "maxWidth", "height", "shadow", "hidden"], s: {} },
  logo: { p: ["marginBottom", "height", "maxWidth", "align", "hidden"], s: {} },
  headerButton: { p: ["fontSize", "fontWeight", "fontStyle", "textAlign", "lineHeight", "letterSpacing", "textTransform", "color", "background", "borderColor", "borderWidth", "borderStyle", "borderRadius", "paddingX", "paddingY", "gap", "marginBottom", "width", "height", "shadow", "align", "text", "link", "transition", "hidden"], s: {"hover":["color", "background", "borderColor", "borderWidth", "borderStyle", "borderRadius", "shadow", "motion"],"focus":["color", "background", "borderColor", "borderWidth", "borderStyle", "borderRadius", "shadow"]} },
  formTitle: { p: ["fontSize", "fontWeight", "fontStyle", "textAlign", "lineHeight", "letterSpacing", "textTransform", "color", "marginBottom", "hidden"], s: {} },
  title: { p: ["fontSize", "fontWeight", "fontStyle", "textAlign", "lineHeight", "letterSpacing", "textTransform", "color", "marginBottom", "hidden"], s: {} },
  stepTitle: { p: ["fontSize", "fontWeight", "fontStyle", "textAlign", "lineHeight", "letterSpacing", "textTransform", "color", "marginBottom", "hidden"], s: {} },
  progress: { p: ["color", "background", "borderColor", "borderWidth", "borderStyle", "borderRadius", "height", "hidden"], s: {} },
  progressBar: { p: ["background", "borderRadius", "hidden"], s: {} },
  questionText: { p: ["fontSize", "fontWeight", "fontStyle", "textAlign", "lineHeight", "letterSpacing", "textTransform", "color", "marginBottom"], s: {} },
  helpText: { p: ["fontSize", "fontWeight", "fontStyle", "textAlign", "lineHeight", "letterSpacing", "textTransform", "color", "marginBottom", "hidden"], s: {} },
  input: { p: ["fontSize", "fontWeight", "fontStyle", "textAlign", "lineHeight", "letterSpacing", "textTransform", "color", "background", "borderColor", "borderWidth", "borderStyle", "borderRadius", "paddingX", "paddingY", "gap", "marginBottom", "width", "height", "shadow", "transition"], s: {"hover":["color", "background", "borderColor", "borderWidth", "borderStyle", "borderRadius", "shadow", "motion"],"focus":["color", "background", "borderColor", "borderWidth", "borderStyle", "borderRadius", "shadow"]} },
  placeholder: { p: ["text", "fontStyle", "fontWeight", "color"], s: {} },
  option: { p: ["fontSize", "fontWeight", "fontStyle", "textAlign", "lineHeight", "letterSpacing", "textTransform", "color", "background", "borderColor", "borderWidth", "borderStyle", "borderRadius", "paddingX", "paddingY", "gap", "marginBottom", "width", "shadow", "transition"], s: {"hover":["color", "background", "borderColor", "borderWidth", "borderStyle", "borderRadius", "shadow", "motion"]} },
  optionSelected: { p: ["fontWeight", "color", "background", "borderColor", "borderWidth", "borderStyle", "borderRadius", "shadow"], s: {} },
  optionLabel: { p: ["fontSize", "fontWeight", "fontStyle", "textAlign", "lineHeight", "letterSpacing", "textTransform", "color"], s: {} },
  optionHelpText: { p: ["fontSize", "fontWeight", "fontStyle", "textAlign", "lineHeight", "letterSpacing", "textTransform", "color", "hidden"], s: {} },
  upload: { p: ["fontSize", "fontWeight", "fontStyle", "textAlign", "lineHeight", "letterSpacing", "textTransform", "color", "background", "borderColor", "borderWidth", "borderStyle", "borderRadius", "paddingX", "paddingY", "gap", "marginBottom", "height", "transition"], s: {"hover":["color", "background", "borderColor", "borderWidth", "borderStyle", "borderRadius", "motion"]} },
  error: { p: ["fontSize", "fontWeight", "fontStyle", "textAlign", "lineHeight", "letterSpacing", "textTransform", "color", "marginBottom"], s: {} },
  questionImage: { p: ["placement", "width", "maxWidth", "borderRadius", "borderWidth", "borderStyle", "borderColor", "textAlign", "marginBottom", "shadow", "hidden"], s: {} },
  content: { p: ["fontSize", "fontWeight", "fontStyle", "textAlign", "lineHeight", "letterSpacing", "textTransform", "color", "background", "borderColor", "borderWidth", "borderStyle", "borderRadius", "paddingX", "paddingY", "gap", "marginBottom"], s: {} },
  plan: { p: ["fontSize", "fontWeight", "fontStyle", "textAlign", "lineHeight", "letterSpacing", "textTransform", "color", "background", "borderColor", "borderWidth", "borderStyle", "borderRadius", "paddingX", "paddingY", "gap", "marginBottom", "shadow", "transition"], s: {"hover":["color", "background", "borderColor", "borderWidth", "borderStyle", "borderRadius", "shadow", "motion"]} },
  planSelected: { p: ["fontWeight", "color", "background", "borderColor", "borderWidth", "borderStyle", "borderRadius", "shadow"], s: {} },
  actions: { p: ["color", "background", "borderColor", "borderWidth", "borderStyle", "borderRadius", "paddingX", "paddingY", "gap", "marginBottom", "maxWidth", "shadow", "attach", "arrange"], s: {} },
  buttonPrimary: { p: ["fontSize", "fontWeight", "fontStyle", "textAlign", "lineHeight", "letterSpacing", "textTransform", "color", "background", "borderColor", "borderWidth", "borderStyle", "borderRadius", "paddingX", "paddingY", "gap", "marginBottom", "width", "height", "shadow", "transition"], s: {"hover":["color", "background", "borderColor", "borderWidth", "borderStyle", "borderRadius", "shadow", "motion"],"focus":["color", "background", "borderColor", "borderWidth", "borderStyle", "borderRadius", "shadow"]} },
  buttonSecondary: { p: ["fontSize", "fontWeight", "fontStyle", "textAlign", "lineHeight", "letterSpacing", "textTransform", "color", "background", "borderColor", "borderWidth", "borderStyle", "borderRadius", "paddingX", "paddingY", "gap", "marginBottom", "width", "height", "shadow", "transition"], s: {"hover":["color", "background", "borderColor", "borderWidth", "borderStyle", "borderRadius", "shadow", "motion"],"focus":["color", "background", "borderColor", "borderWidth", "borderStyle", "borderRadius", "shadow"]} },
  eyebrow: { p: ["fontSize", "fontWeight", "fontStyle", "textAlign", "lineHeight", "letterSpacing", "textTransform", "color", "marginBottom", "hidden"], s: {} },
  titleAccent: { p: ["color", "fontWeight", "fontStyle", "hidden"], s: {} },
  callout: { p: ["fontSize", "fontWeight", "fontStyle", "textAlign", "lineHeight", "letterSpacing", "textTransform", "color", "background", "borderColor", "borderWidth", "borderStyle", "borderRadius", "paddingX", "paddingY", "gap", "marginBottom", "hidden"], s: {} },
  card: { p: ["color", "background", "borderColor", "borderWidth", "borderStyle", "borderRadius", "paddingX", "paddingY", "gap", "marginBottom", "shadow", "hidden"], s: {} },
  metric: { p: ["fontSize", "fontWeight", "fontStyle", "textAlign", "lineHeight", "letterSpacing", "textTransform", "color", "background", "borderColor", "borderWidth", "borderStyle", "borderRadius", "paddingX", "paddingY", "gap", "marginBottom", "hidden"], s: {} },
  columns: { p: ["gap", "marginBottom"], s: {} },
};

/** Values the frontend reads (words, links, places, layout), never turned into CSS. */
const NOT_CSS = new Set(["text", "placement", "attach", "align", "verticalAlign", "arrange", "link", "hidden"]);

const variableFor = (element: string, property: string, state?: string) =>
  `--apx-${kebab(element)}-${kebab(property)}${state ? `-${state}` : ""}`;

export const THEME_RULES: ThemeRulesTable = {
  version: 6,
  elements: Object.fromEntries(
    Object.entries(TABLE).map(([element, { p, s }]) => [
      element,
      {
        // Words, links, places and layout choices are not CSS: no variable.
        properties: p.map((name) => ({ name, variable: NOT_CSS.has(name) ? null : variableFor(element, name) })),
        states: Object.entries(s).map(([name, props]) => ({
          name,
          properties: props.map((prop) => ({ name: prop, variable: variableFor(element, prop, name) })),
        })),
      },
    ]),
  ),
};
