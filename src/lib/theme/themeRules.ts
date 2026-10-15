import type { ThemeRulesTable } from "@/types/intake/theme_types";
import { kebab } from "./themeKit";

/**
 * Which theme properties each form part accepts — a copy of the backend's rules
 * (`packages/modules/branding/theme.rules.ts`, `GET /admin/branding/rules`, version 1). That route
 * is admin-only, so the patient app carries the table. When the backend bumps the rules version,
 * regenerate this from `describeRules()`. A property missing here simply isn't themed (the Apex
 * look shows); nothing breaks.
 */

const TABLE: Record<string, { p: string[]; s: Record<string, string[]> }> = {
  page: { p: ["color", "background", "borderColor"], s: {  } },
  container: { p: ["color", "background", "borderColor", "borderWidth", "borderStyle", "borderRadius", "paddingX", "paddingY", "gap", "marginBottom", "maxWidth", "shadow"], s: {  } },
  header: { p: ["fontSize", "fontWeight", "fontStyle", "textAlign", "lineHeight", "letterSpacing", "textTransform", "color", "background", "borderColor", "borderWidth", "borderStyle", "borderRadius", "paddingX", "paddingY", "gap", "marginBottom"], s: {  } },
  logo: { p: ["marginBottom", "height", "maxWidth"], s: {  } },
  title: { p: ["fontSize", "fontWeight", "fontStyle", "textAlign", "lineHeight", "letterSpacing", "textTransform", "color", "marginBottom"], s: {  } },
  progress: { p: ["color", "background", "borderColor", "borderWidth", "borderStyle", "borderRadius", "height"], s: {  } },
  progressBar: { p: ["background", "borderRadius"], s: {  } },
  questionText: { p: ["fontSize", "fontWeight", "fontStyle", "textAlign", "lineHeight", "letterSpacing", "textTransform", "color", "marginBottom"], s: {  } },
  helpText: { p: ["fontSize", "fontWeight", "fontStyle", "textAlign", "lineHeight", "letterSpacing", "textTransform", "color", "marginBottom"], s: {  } },
  input: { p: ["fontSize", "fontWeight", "fontStyle", "textAlign", "lineHeight", "letterSpacing", "textTransform", "color", "background", "borderColor", "borderWidth", "borderStyle", "borderRadius", "paddingX", "paddingY", "gap", "marginBottom", "width", "height", "shadow"], s: { hover: ["color", "background", "borderColor", "borderWidth", "borderStyle", "borderRadius"], focus: ["color", "background", "borderColor", "borderWidth", "borderStyle", "borderRadius"] } },
  placeholder: { p: ["text", "fontStyle", "fontWeight", "color"], s: {  } },
  option: { p: ["fontSize", "fontWeight", "fontStyle", "textAlign", "lineHeight", "letterSpacing", "textTransform", "color", "background", "borderColor", "borderWidth", "borderStyle", "borderRadius", "paddingX", "paddingY", "gap", "marginBottom", "width", "shadow"], s: { hover: ["color", "background", "borderColor", "borderWidth", "borderStyle", "borderRadius"] } },
  optionSelected: { p: ["fontWeight", "color", "background", "borderColor", "borderWidth", "borderStyle", "borderRadius", "shadow"], s: {  } },
  optionLabel: { p: ["fontSize", "fontWeight", "fontStyle", "textAlign", "lineHeight", "letterSpacing", "textTransform", "color"], s: {  } },
  optionHelpText: { p: ["fontSize", "fontWeight", "fontStyle", "textAlign", "lineHeight", "letterSpacing", "textTransform", "color"], s: {  } },
  upload: { p: ["fontSize", "fontWeight", "fontStyle", "textAlign", "lineHeight", "letterSpacing", "textTransform", "color", "background", "borderColor", "borderWidth", "borderStyle", "borderRadius", "paddingX", "paddingY", "gap", "marginBottom", "height"], s: { hover: ["color", "background", "borderColor", "borderWidth", "borderStyle", "borderRadius"] } },
  error: { p: ["fontSize", "fontWeight", "fontStyle", "textAlign", "lineHeight", "letterSpacing", "textTransform", "color", "marginBottom"], s: {  } },
  content: { p: ["fontSize", "fontWeight", "fontStyle", "textAlign", "lineHeight", "letterSpacing", "textTransform", "color", "background", "borderColor", "borderWidth", "borderStyle", "borderRadius", "paddingX", "paddingY", "gap", "marginBottom"], s: {  } },
  plan: { p: ["fontSize", "fontWeight", "fontStyle", "textAlign", "lineHeight", "letterSpacing", "textTransform", "color", "background", "borderColor", "borderWidth", "borderStyle", "borderRadius", "paddingX", "paddingY", "gap", "marginBottom", "shadow"], s: { hover: ["color", "background", "borderColor", "borderWidth", "borderStyle", "borderRadius"] } },
  planSelected: { p: ["fontWeight", "color", "background", "borderColor", "borderWidth", "borderStyle", "borderRadius", "shadow"], s: {  } },
  buttonPrimary: { p: ["fontSize", "fontWeight", "fontStyle", "textAlign", "lineHeight", "letterSpacing", "textTransform", "color", "background", "borderColor", "borderWidth", "borderStyle", "borderRadius", "paddingX", "paddingY", "gap", "marginBottom", "width", "height", "shadow"], s: { hover: ["color", "background", "borderColor", "borderWidth", "borderStyle", "borderRadius"], focus: ["color", "background", "borderColor", "borderWidth", "borderStyle", "borderRadius"] } },
  buttonSecondary: { p: ["fontSize", "fontWeight", "fontStyle", "textAlign", "lineHeight", "letterSpacing", "textTransform", "color", "background", "borderColor", "borderWidth", "borderStyle", "borderRadius", "paddingX", "paddingY", "gap", "marginBottom", "width", "height", "shadow"], s: { hover: ["color", "background", "borderColor", "borderWidth", "borderStyle", "borderRadius"], focus: ["color", "background", "borderColor", "borderWidth", "borderStyle", "borderRadius"] } },
};

const variableFor = (element: string, property: string, state?: string) =>
  `--apx-${kebab(element)}-${kebab(property)}${state ? `-${state}` : ""}`;

export const THEME_RULES: ThemeRulesTable = {
  version: 1,
  elements: Object.fromEntries(
    Object.entries(TABLE).map(([element, { p, s }]) => [
      element,
      {
        // `text` is placeholder words, not CSS: it has no variable.
        properties: p.map((name) => ({ name, variable: name === "text" ? null : variableFor(element, name) })),
        states: Object.entries(s).map(([name, props]) => ({
          name,
          properties: props.map((prop) => ({ name: prop, variable: variableFor(element, prop, name) })),
        })),
      },
    ]),
  ),
};
