// GENERATED from apex-form-renderer/src — do not edit here. Edit there, then run `npm run sync`.
/**
 * The Apex look for themed forms: what every `apx-*` part looks like when a theme doesn't set it.
 *
 * The backend's default theme is still `{}`, so these values ARE the Apex look until it isn't
 * (README "Known gaps"). They follow the new portal design (warm ground, ink text, Apex red) and
 * read the theme's global variables first, so an organization's colours, radius and font flow
 * into every element that doesn't override them.
 *
 * Framework-free on purpose: the patient app will use the same file.
 */

/** Element → property → CSS value (shadow values are preset names). */
export const APEX_BASE: Record<string, Record<string, string>> = {
  page: {
    color: "var(--apx-color-text, #17140f)",
    background: "var(--apx-color-background, #faf8f6)",
  },
  container: {
    color: "var(--apx-color-text, #17140f)",
    background: "var(--apx-color-surface, #ffffff)",
    borderColor: "var(--apx-color-border, #e4dfd9)",
    borderWidth: "1px",
    borderStyle: "solid",
    borderRadius: "var(--apx-radius, 14px)",
    paddingX: "24px",
    paddingY: "24px",
    gap: "18px",
    maxWidth: "var(--apx-container-max-width, 560px)",
    shadow: "sm",
  },
  header: { gap: "10px", textAlign: "left" },
  logo: { height: "32px", maxWidth: "160px" },
  title: {
    fontSize: "22px",
    fontWeight: "800",
    lineHeight: "1.2",
    letterSpacing: "-0.5px",
    color: "var(--apx-color-text, #17140f)",
  },
  progress: {
    background: "#efebe6",
    height: "6px",
    borderRadius: "9999px",
    borderStyle: "none",
  },
  progressBar: { background: "var(--apx-color-primary, #d30704)", borderRadius: "9999px" },
  questionText: {
    fontSize: "16px",
    fontWeight: "600",
    lineHeight: "1.4",
    color: "var(--apx-color-text, #17140f)",
    marginBottom: "2px",
  },
  helpText: {
    fontSize: "13px",
    fontWeight: "400",
    lineHeight: "1.5",
    color: "var(--apx-color-muted-text, #5f5952)",
    marginBottom: "6px",
  },
  input: {
    fontSize: "14px",
    lineHeight: "1.4",
    color: "var(--apx-color-text, #17140f)",
    background: "var(--apx-color-surface, #ffffff)",
    borderColor: "var(--apx-color-border, #e4dfd9)",
    borderWidth: "1px",
    borderStyle: "solid",
    borderRadius: "var(--apx-radius, 10px)",
    paddingX: "12px",
    paddingY: "10px",
    width: "100%",
  },
  placeholder: { color: "#9a938a", fontStyle: "normal", fontWeight: "400" },
  option: {
    fontSize: "14px",
    lineHeight: "1.4",
    textAlign: "left",
    color: "var(--apx-color-text, #17140f)",
    background: "var(--apx-color-surface, #ffffff)",
    borderColor: "var(--apx-color-border, #e4dfd9)",
    borderWidth: "1px",
    borderStyle: "solid",
    borderRadius: "var(--apx-radius, 12px)",
    paddingX: "14px",
    paddingY: "11px",
    gap: "10px",
    width: "100%",
    shadow: "none",
  },
  optionSelected: {
    fontWeight: "600",
    color: "var(--apx-color-text, #17140f)",
    background: "color-mix(in srgb, var(--apx-color-primary, #d30704) 7%, #ffffff)",
    borderColor: "var(--apx-color-primary, #d30704)",
  },
  optionLabel: {},
  optionHelpText: { fontSize: "12px", color: "var(--apx-color-muted-text, #5f5952)" },
  upload: {
    fontSize: "13px",
    color: "var(--apx-color-muted-text, #5f5952)",
    background: "var(--apx-color-background, #faf8f6)",
    borderColor: "var(--apx-color-border, #e4dfd9)",
    borderWidth: "1px",
    borderStyle: "dashed",
    borderRadius: "var(--apx-radius, 12px)",
    paddingX: "14px",
    paddingY: "14px",
    gap: "8px",
  },
  error: { fontSize: "12.5px", color: "var(--apx-color-error, #b23a3a)" },
  // The picture itself. Its row's alignment and spacing (`textAlign`, `marginBottom`) are in the
  // structure rules below, since they apply to the row, not the image.
  questionImage: {
    width: "100%",
    borderRadius: "var(--apx-radius, 12px)",
    borderStyle: "none",
    shadow: "none",
  },
  content: {
    fontSize: "13.5px",
    lineHeight: "1.55",
    color: "var(--apx-color-text, #17140f)",
    background: "#f3f6fa",
    borderColor: "#d6e2ef",
    borderWidth: "1px",
    borderStyle: "solid",
    borderRadius: "var(--apx-radius, 12px)",
    paddingX: "14px",
    paddingY: "12px",
    gap: "8px",
  },
  plan: {
    fontSize: "14px",
    color: "var(--apx-color-text, #17140f)",
    background: "var(--apx-color-surface, #ffffff)",
    borderColor: "var(--apx-color-border, #e4dfd9)",
    borderWidth: "1px",
    borderStyle: "solid",
    borderRadius: "var(--apx-radius, 12px)",
    paddingX: "16px",
    paddingY: "14px",
    gap: "10px",
    shadow: "none",
  },
  planSelected: {
    fontWeight: "600",
    background: "color-mix(in srgb, var(--apx-color-primary, #d30704) 7%, #ffffff)",
    borderColor: "var(--apx-color-primary, #d30704)",
  },
  buttonPrimary: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#ffffff",
    background: "var(--apx-color-primary, #d30704)",
    borderColor: "var(--apx-color-primary, #d30704)",
    borderWidth: "1px",
    borderStyle: "solid",
    borderRadius: "var(--apx-radius, 10px)",
    paddingX: "18px",
    paddingY: "10px",
    gap: "8px",
    shadow: "none",
  },
  buttonSecondary: {
    fontSize: "14px",
    fontWeight: "600",
    color: "var(--apx-color-text, #17140f)",
    background: "var(--apx-color-surface, #ffffff)",
    borderColor: "var(--apx-color-border, #e4dfd9)",
    borderWidth: "1px",
    borderStyle: "solid",
    borderRadius: "var(--apx-radius, 10px)",
    paddingX: "16px",
    paddingY: "10px",
    gap: "6px",
    shadow: "none",
  },
};

/** Base look for hover/focus, used only when neither the state nor the element is themed. */
export const APEX_BASE_STATES: Record<string, Partial<Record<"hover" | "focus", Record<string, string>>>> = {
  input: {
    hover: { borderColor: "#b3aca3" },
    focus: { borderColor: "var(--apx-color-primary, #d30704)" },
  },
  option: { hover: { borderColor: "#b3aca3" } },
  plan: { hover: { borderColor: "#b3aca3" } },
  upload: { hover: { borderColor: "var(--apx-color-primary, #d30704)" } },
};

/** Default font when the theme sets none: Archivo, as in the portal design. */
export const APEX_FONT_STACK = '"Archivo", "Helvetica Neue", Arial, sans-serif';

/**
 * Layout and safety rules that are never themed: how parts are arranged, crisis content's fixed
 * look, and a visible keyboard focus ring. `%S` is the scope selector.
 */
export const APEX_STRUCTURE_CSS = `
%S { font-family: var(--apx-font-family, ${APEX_FONT_STACK}); container: apx / inline-size; }
%S .apx-container { display: flex; flex-direction: column; margin-left: auto; margin-right: auto; width: 100%; }
%S .apx-header { display: flex; flex-direction: column; }
%S .apx-logo { display: block; width: auto; object-fit: contain; }
%S .apx-progress { overflow: hidden; }
%S .apx-progress-bar { height: 100%; transition: width .25s ease; }
%S .apx-question { display: flex; flex-direction: column; }
%S .apx-question-body { display: flex; flex-direction: column; min-width: 0; }
/* Question images: top / middle / bottom sit in a row; left / right make two columns, where the
   theme's width sizes the column and the picture fills it. Under 640px the columns stack (the image
   is first in the DOM, so it shows on top). */
%S .apx-question-image-row {
  text-align: var(--apx-question-image-text-align, center);
  margin-bottom: var(--apx-question-image-margin-bottom, 12px);
}
%S .apx-question-image { display: inline-block; height: auto; vertical-align: top; }
/* The theme's maxWidth applies, but never wider than the card. */
%S .apx-question-image-row > .apx-question-image { max-width: min(100%, var(--apx-question-image-max-width, 100%)); }
%S .apx-question[data-image] {
  display: grid; gap: 16px; align-items: start;
  grid-template-columns: var(--apx-question-image-width, 40%) minmax(0, 1fr);
}
%S .apx-question[data-image="right"] { grid-template-columns: minmax(0, 1fr) var(--apx-question-image-width, 40%); }
%S .apx-question[data-image="right"] .apx-question-image-row { order: 2; }
%S .apx-question[data-image] .apx-question-image-row { margin-bottom: 0; }
%S .apx-question[data-image] .apx-question-image { width: 100%; }
/* The form's own width, not the window's: a phone preview in the builder stacks like a phone. */
@container apx (max-width: 639px) {
  %S .apx-question[data-image] { display: flex; flex-direction: column; }
  %S .apx-question[data-image] .apx-question-image-row { margin-bottom: var(--apx-question-image-margin-bottom, 12px); }
}
%S .apx-options, %S .apx-plans { display: flex; flex-direction: column; gap: 8px; }
%S .apx-option, %S .apx-plan { display: flex; align-items: flex-start; cursor: pointer; transition: border-color .15s, background-color .15s; }
%S .apx-option-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
%S .apx-input { display: block; }
%S textarea.apx-input { min-height: 84px; resize: vertical; }
%S .apx-upload { display: flex; align-items: center; cursor: pointer; }
%S .apx-actions { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
%S .apx-button-primary, %S .apx-button-secondary { display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: filter .15s, background-color .15s; }
%S .apx-button-primary:hover:not(:disabled) { filter: brightness(1.08); }
%S .apx-button-primary:disabled, %S .apx-button-secondary:disabled { opacity: .5; cursor: default; }
%S .apx-content { display: flex; }
%S .apx-content[data-severity="warning"] {
  background: var(--apx-content-background, #fbf1e4);
  border-color: var(--apx-content-border-color, #f0d7b4);
}
/* Crisis content keeps a fixed, high-visibility look: the theme never reaches it. */
%S .apx-content[data-severity="crisis"] {
  display: flex; gap: 8px; padding: 12px 14px; border: 2px solid #b42318; border-radius: 12px;
  background: #fef3f2; color: #7a271a; font-size: 14px; line-height: 1.55; font-weight: 500;
}
/* A visible keyboard focus ring: outline is not a theme property and is never removed. */
%S .apx-input:focus-visible, %S .apx-option:focus-visible, %S .apx-plan:focus-visible,
%S .apx-upload:focus-visible, %S .apx-button-primary:focus-visible, %S .apx-button-secondary:focus-visible {
  outline: 2px solid var(--apx-color-primary, #d30704); outline-offset: 2px;
}
`;
