// GENERATED from apex-form-renderer/src — do not edit here. Edit there, then run `npm run sync`.
import { createContext, useContext, useEffect, useId, useMemo, type ReactNode } from "react";
import {
  buildThemeCss,
  identityPlaceholder,
  identityVariables,
  imagePlacement,
  isHidden,
  loadThemeFont,
  placeholderText,
  questionVariables,
  themeToVariables,
  varsToStyle,
  type ImagePlacement,
  type ThemePlace,
  type ThemeVariables,
} from "../theme/themeKit";
import type { IdentityThemeField, Theme, ThemeRulesTable } from "../types";
import { THEME_RULES } from "../theme/themeRules";

/**
 * Renders its children as a themed form page (`.apx-page`): the generated stylesheet, scoped to
 * this one element, plus the theme's page variables. Inside it, `ThemedQuestion` adds a question's
 * own variables and `usePlaceholder` resolves placeholder words — so components only use `apx-*`
 * class names and never read theme JSON.
 *
 * With no theme (or while it loads) it renders the Apex base look. Same component as the admin
 * preview (`apex-admin-dashboard/src/components/theme/ThemeScope.tsx`), so what staff preview is
 * what patients get.
 */

interface ThemeContextValue {
  values: Theme | null;
  vars: ThemeVariables;
}

const ThemeContext = createContext<ThemeContextValue>({ values: null, vars: themeToVariables(null) });

/** The question or details-page field being drawn, so `useHidden` reads its own levels first. */
const PlaceContext = createContext<ThemePlace>(null);

export function ThemeScope({
  values,
  rules,
  className = "",
  frameMinHeight,
  children,
}: {
  /** The merged theme (`theme.values` from a preview, manifest or product response). */
  values: Theme | null | undefined;
  /** Which properties each part accepts; defaults to the copy of the backend's rules. */
  rules?: ThemeRulesTable | null | undefined;
  className?: string;
  /** The page's minimum height (default: the screen). A preview passes its own. */
  frameMinHeight?: string | undefined;
  children: ReactNode;
}) {
  // A stable, CSS-safe id so two previews on one page never share a stylesheet.
  const scopeId = `apx-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const scope = `.apx-page[data-apx-scope="${scopeId}"]`;
  const css = useMemo(() => buildThemeCss(rules ?? THEME_RULES, scope), [rules, scope]);
  const vars = useMemo(() => themeToVariables(values), [values]);
  const style = useMemo(
    () => varsToStyle(frameMinHeight ? { ...vars.page, "--apx-frame-min-height": frameMinHeight } : vars.page),
    [vars, frameMinHeight],
  );
  const font = values?.global?.fontFamily;

  useEffect(() => {
    loadThemeFont(font ?? "Archivo");
  }, [font]);

  const ctx = useMemo(() => ({ values: values ?? null, vars }), [values, vars]);

  return (
    <ThemeContext.Provider value={ctx}>
      <style>{css}</style>
      <div className={`apx-page ${className}`} data-apx-scope={scopeId} style={style}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

/** The theme of the nearest `ThemeScope` (null for the Apex look). */
export function useThemeValues(): Theme | null {
  return useContext(ThemeContext).values;
}

/** A question (or follow-up field): carries its type's and its own theme variables. */
export function ThemedQuestion({
  type,
  fieldKey,
  imageSide,
  className = "",
  children,
}: {
  type: string;
  fieldKey: string;
  /** Its image sits beside it (`left`/`right`): the question becomes two columns. */
  imageSide?: "left" | "right" | undefined;
  className?: string;
  children: ReactNode;
}) {
  const { vars } = useContext(ThemeContext);
  const place = useMemo(() => ({ type, key: fieldKey }), [type, fieldKey]);
  return (
    <PlaceContext.Provider value={place}>
      <div
        className={`apx-question ${className}`}
        data-type={type}
        data-key={fieldKey}
        data-image={imageSide}
        style={varsToStyle(questionVariables(vars, type, fieldKey))}
      >
        {children}
      </div>
    </PlaceContext.Provider>
  );
}

/** Placeholder words for a question or follow-up: its own, then its type's, then the default. */
export function usePlaceholder(fieldKey: string, type: string): string {
  const { values } = useContext(ThemeContext);
  return placeholderText(values, fieldKey, type);
}

/**
 * A field of the public details page (`identity.<field>`): styled like a question, with that
 * field's own variables on top. `questionTypes` and `questions` never apply here.
 */
export function ThemedIdentityField({
  field,
  className = "",
  children,
}: {
  field: IdentityThemeField;
  className?: string;
  children: ReactNode;
}) {
  const { values } = useContext(ThemeContext);
  const style = useMemo(() => varsToStyle(identityVariables(values, field)), [values, field]);
  const place = useMemo(() => ({ identity: field }), [field]);
  return (
    <PlaceContext.Provider value={place}>
      <div className={`apx-question ${className}`} data-identity={field} style={style}>
        {children}
      </div>
    </PlaceContext.Provider>
  );
}

/** Placeholder words for a details-page field: the theme's, else `fallback`. */
export function useIdentityPlaceholder(field: IdentityThemeField, fallback: string): string {
  const { values } = useContext(ThemeContext);
  return identityPlaceholder(values, field, fallback);
}

/** Where a question's image goes (`questionImage.placement`): its own, its type's, the form's, else middle. */
export function useImagePlacement(fieldKey: string, type: string): ImagePlacement {
  const { values } = useContext(ThemeContext);
  return imagePlacement(values, fieldKey, type);
}

/**
 * Whether the theme hides `element` here (rules v5): inside a question or details-page field its
 * own levels come first. Hidden elements are not drawn; inputs, errors and the buttons that move
 * the patient on never ask.
 */
export function useHidden(element: string): boolean {
  const { values } = useContext(ThemeContext);
  return isHidden(values, element, useContext(PlaceContext));
}
