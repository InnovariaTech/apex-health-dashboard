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
    width: "100%",
    maxWidth: "var(--apx-container-max-width, 560px)",
    shadow: "sm",
  },
  // The content inside the form box: takes the box's spacing between parts unless themed.
  step: { gap: "var(--apx-container-gap, 18px)", width: "100%" },
  header: { gap: "10px", textAlign: "left" },
  logo: { height: "32px", maxWidth: "160px" },
  title: {
    fontSize: "22px",
    fontWeight: "800",
    lineHeight: "1.2",
    letterSpacing: "-0.5px",
    color: "var(--apx-color-text, #17140f)",
  },
  // The page title above a page (rules v5). Only its colour is set: the backend has not settled an
  // eyebrow-like default yet (Documents/hidden-details-pages-titles.md §3.2), so a theme sets the rest.
  stepTitle: { color: "var(--apx-color-muted-text, #5f5952)" },
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
    transition: "150ms",
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
    transition: "150ms",
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
    transition: "150ms",
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
    transition: "150ms",
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
    transition: "150ms",
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
  // The Back / Next area: the gap between its buttons (layout — attach, arrange — is the frame's).
  actions: { gap: "10px" },
  headerButton: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#ffffff",
    background: "var(--apx-color-primary, #d30704)",
    borderColor: "var(--apx-color-primary, #d30704)",
    borderWidth: "1px",
    borderStyle: "solid",
    borderRadius: "9999px",
    paddingX: "16px",
    paddingY: "8px",
    transition: "150ms",
    shadow: "none",
  },
  buttonSecondary: {
    transition: "150ms",
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
  // Layout parts (rules version 4, rendering-the-theme.md §12). Tones and variants are structure.
  eyebrow: {
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--apx-color-muted-text, #6b6259)",
    marginBottom: "6px",
  },
  titleAccent: { color: "var(--apx-color-primary, #d30704)" },
  callout: {
    fontSize: "14px",
    lineHeight: "1.5",
    color: "var(--apx-color-text, #17140f)",
    // The info tone; warning and success are structure rules that read the theme's value first.
    background: "#eff6ff",
    borderColor: "#bfdbfe",
    borderWidth: "1px",
    borderStyle: "solid",
    borderRadius: "var(--apx-radius, 12px)",
    paddingX: "14px",
    paddingY: "12px",
  },
  card: {
    background: "var(--apx-color-surface, #ffffff)",
    borderRadius: "var(--apx-radius, 14px)",
    paddingX: "18px",
    paddingY: "16px",
    gap: "12px",
  },
  metric: {
    fontSize: "14px",
    color: "var(--apx-color-text, #17140f)",
    background: "#f7f4f0",
    borderRadius: "var(--apx-radius, 12px)",
    paddingX: "16px",
    paddingY: "14px",
  },
  columns: { gap: "12px" },
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
/* The frame: the page is a column (header bar, the form, the Back/Next bar); left / centre / right
   place the form box and its content (container.align, step.align). */
%S { display: flex; flex-direction: column; min-height: var(--apx-frame-min-height, 100vh); }
%S .apx-frame-body { flex: 1 0 auto; padding: 32px 16px; }
@container apx (min-width: 640px) { %S .apx-frame-body { padding: 48px 24px; } }
%S .apx-container[data-align="left"] { margin-left: 0; margin-right: auto; }
%S .apx-container[data-align="right"] { margin-left: auto; margin-right: 0; }
%S .apx-step { display: flex; flex-direction: column; margin-left: auto; margin-right: auto; }
/* Never wider than the screen, whatever width the theme sets (the more specific selectors beat the
   generated max-width rules, and still read the theme's value). */
%S .apx-frame-body > .apx-container { max-width: min(100%, var(--apx-container-max-width, 560px)); }
%S .apx-container > .apx-step { max-width: min(100%, var(--apx-step-max-width, 100%)); }
%S .apx-step[data-align="left"] { margin-left: 0; margin-right: auto; }
%S .apx-step[data-align="right"] { margin-left: auto; margin-right: 0; }
/* The header: a row with three places (logo and button on different sides), then the title. */
%S .apx-header { display: flex; flex-direction: column; }
%S .apx-header-row { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); align-items: center; gap: 12px; }
%S .apx-header-row > [data-side="left"] { grid-column: 1; justify-self: start; }
%S .apx-header-row > [data-side="center"] { grid-column: 2; justify-self: center; }
%S .apx-header-row > [data-side="right"] { grid-column: 3; justify-self: end; }
%S .apx-header-row > * { grid-row: 1; min-width: 0; }
/* Phones: with a centred logo, the button goes under it. */
@container apx (max-width: 639px) {
  %S .apx-header-row[data-logo="center"] { display: flex; flex-direction: column; align-items: center; }
}
/* Across the page: a bar at the top. Reads the header's own variables first, so the theme wins. */
/* header.maxWidth is the width of the bar's inside (logo and button), centred; the bar spans the page. */
%S .apx-header[data-attach="page"] > .apx-header-row { width: 100%; max-width: var(--apx-header-max-width, none); margin-left: auto; margin-right: auto; }
%S .apx-header[data-attach="page"] {
  width: 100%; max-width: none;
  background: var(--apx-header-background, var(--apx-color-surface, #ffffff));
  border-bottom: var(--apx-header-border-width, 1px) var(--apx-header-border-style, solid) var(--apx-header-border-color, var(--apx-color-border, #e4dfd9));
  padding: var(--apx-header-padding-y, 12px) var(--apx-header-padding-x, 20px);
}
%S .apx-logo { display: block; width: auto; object-fit: contain; }
%S .apx-header-button { white-space: nowrap; max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
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
%S .apx-option, %S .apx-plan { display: flex; align-items: flex-start; cursor: pointer; transition-property: border-color, background-color, color, box-shadow, transform; }
%S .apx-option-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
%S .apx-input { display: block; }
%S textarea.apx-input { min-height: 84px; resize: vertical; }
%S .apx-upload { display: flex; align-items: center; cursor: pointer; }
/* Back / Next. arrange: spread (Back left, Next right), grouped left / centre / right, or full width. */
%S .apx-actions { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
%S .apx-actions[data-arrange="left"] { justify-content: flex-start; }
%S .apx-actions[data-arrange="center"] { justify-content: center; }
%S .apx-actions[data-arrange="right"] { justify-content: flex-end; }
%S .apx-actions[data-arrange="stretch"] > * { flex: 1 1 0; }
%S .apx-actions[data-arrange="spread"] > .apx-button-primary { flex: 1 1 auto; }
@container apx (min-width: 640px) {
  %S .apx-actions[data-arrange="spread"] > .apx-button-primary { flex: 0 0 auto; }
  %S .apx-actions:not([data-arrange="stretch"]) > .apx-button-primary { min-width: 160px; }
}
/* A lone button (details page, payment) fills a spread area, as it always has. */
%S .apx-actions[data-arrange="spread"] > .apx-button-primary:only-child { flex: 1 1 auto; }
/* Across the page: a bar that stays at the bottom of the screen. The bar carries the area's
   background, border and shadow; the buttons inside keep its width, spacing and arrangement. */
%S .apx-actions-bar:empty { display: none; }
%S .apx-actions-bar {
  position: sticky; bottom: 0; z-index: 5; margin-top: auto;
  background: var(--apx-actions-background, var(--apx-color-surface, #ffffff));
  border-top: var(--apx-actions-border-width, 1px) var(--apx-actions-border-style, solid) var(--apx-actions-border-color, var(--apx-color-border, #e4dfd9));
  box-shadow: var(--apx-actions-shadow, 0 -6px 18px rgba(23, 20, 15, .06));
}
%S .apx-actions-bar > .apx-actions {
  background: transparent; border: 0; box-shadow: none; width: 100%; margin-left: auto; margin-right: auto;
  max-width: var(--apx-actions-max-width, var(--apx-container-max-width, 560px));
  padding: var(--apx-actions-padding-y, 12px) var(--apx-actions-padding-x, 16px);
}
%S .apx-button-primary, %S .apx-button-secondary, %S .apx-header-button { display: inline-flex; align-items: center; justify-content: center; cursor: pointer; text-decoration: none; transition-property: filter, background-color, border-color, color, box-shadow, transform; }
%S .apx-input, %S .apx-upload { transition-property: border-color, background-color, color, box-shadow, transform; }
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
%S .apx-upload:focus-visible, %S .apx-button-primary:focus-visible, %S .apx-button-secondary:focus-visible, %S .apx-header-button:focus-visible {
  outline: 2px solid var(--apx-color-primary, #d30704); outline-offset: 2px;
}
/* ── Page layouts (forms/steps-layout-computed.md §5, rendering-the-theme.md §12) ──────────────
   Structure only; looks come from the theme's eyebrow / titleAccent / callout / card / metric /
   columns elements. Tones and variants read the theme's variable first, so a themed value still
   applies to every tone, as the guide says. */
%S .apx-layout, %S .apx-stack { display: flex; flex-direction: column; min-width: 0; }
%S .apx-stack { gap: 16px; }
%S .apx-stack[data-gap="none"] { gap: 0; }
%S .apx-stack[data-gap="sm"] { gap: 8px; }
%S .apx-stack[data-gap="lg"] { gap: 24px; }
%S .apx-stack[data-align="center"] { align-items: stretch; text-align: center; }
%S .apx-stack[data-align="end"] { text-align: right; }
%S .apx-stack[data-align="center"] .apx-input, %S .apx-stack[data-align="center"] .apx-options,
%S .apx-stack[data-align="center"] .apx-option, %S .apx-stack[data-align="center"] .apx-callout { text-align: left; }
%S .apx-columns { display: grid; grid-template-columns: var(--apx-columns-template, 1fr 1fr); align-items: start; min-width: 0; }
%S .apx-columns > * { min-width: 0; }
%S .apx-columns[data-gap="none"] { gap: 0; }
%S .apx-columns[data-gap="sm"] { gap: 8px; }
%S .apx-columns[data-gap="lg"] { gap: 24px; }
/* The form's own width, not the window's, so the builder's phone preview collapses like a phone. */
@container apx (max-width: 600px) {
  %S .apx-columns[data-collapse="mobile"] { grid-template-columns: minmax(0, 1fr); }
}
%S .apx-card { display: flex; flex-direction: column; }
%S .apx-card[data-variant="muted"] { background: var(--apx-card-background, #f3f1ee); }
%S .apx-card[data-variant="outlined"] {
  border-width: var(--apx-card-border-width, 1px); border-style: var(--apx-card-border-style, solid);
  border-color: var(--apx-card-border-color, var(--apx-color-border, #e4dfd9));
}
%S .apx-eyebrow { margin-top: 0; }
%S .apx-heading { margin: 0; }
%S .apx-heading[data-level="2"] { font-size: 18px; }
%S .apx-layout-text { font-size: 14.5px; line-height: 1.55; }
%S .apx-layout-text p, %S .apx-callout p { margin: 0 0 6px; }
%S .apx-layout-text p:last-child, %S .apx-callout p:last-child { margin-bottom: 0; }
%S .apx-layout-text ul, %S .apx-callout ul { list-style: disc; padding-left: 1.2em; }
%S .apx-layout-text a, %S .apx-callout a { text-decoration: underline; font-weight: 500; }
%S .apx-callout[data-tone="warning"] { background: var(--apx-callout-background, #fffbeb); border-color: var(--apx-callout-border-color, #fde68a); }
%S .apx-callout[data-tone="success"] { background: var(--apx-callout-background, #f0fdf4); border-color: var(--apx-callout-border-color, #bbf7d0); }
%S .apx-metric { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px; }
%S .apx-metric-value { font-size: 26px; font-weight: 700; line-height: 1.1; color: var(--apx-metric-color, var(--apx-color-primary, #d30704)); }
%S .apx-metric-unit { font-size: 14px; font-weight: 600; }
%S .apx-metric-empty { opacity: .7; }
%S .apx-stack[data-align="center"] .apx-metric { justify-content: center; }
%S .apx-layout-image { display: block; max-width: 100%; height: auto; border-radius: var(--apx-radius, 12px); }
%S .apx-divider { border: 0; border-top: 1px solid var(--apx-color-border, #e4dfd9); margin: 0; }
%S .apx-spacer { height: 16px; }
%S .apx-spacer[data-size="sm"] { height: 8px; }
%S .apx-spacer[data-size="lg"] { height: 32px; }
/* Fields placed by a layout: label modes, and fields in a row line up. */
%S .apx-field-label { font-size: 13px; font-weight: 600; margin: 0 0 4px; }
%S .apx-field-title { margin: 0 0 6px; }
%S .apx-sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
/* Widgets. */
%S .apx-buttons { display: grid; gap: 8px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
%S .apx-buttons[data-columns="1"] { grid-template-columns: minmax(0, 1fr); }
%S .apx-buttons[data-columns="3"] { grid-template-columns: repeat(3, minmax(0, 1fr)); }
%S .apx-buttons[data-columns="4"] { grid-template-columns: repeat(4, minmax(0, 1fr)); }
%S .apx-option-button { justify-content: center; text-align: center; font: inherit; }
%S .apx-parts { display: grid; gap: 8px; }
%S .apx-parts[data-parts="2"] { grid-template-columns: repeat(2, minmax(0, 1fr)); }
%S .apx-parts[data-parts="3"] { grid-template-columns: 1.4fr 1fr 1.2fr; }
%S select.apx-input { appearance: auto; }
/* Product cards (the cards widget): the options' theme applies; the price is the plan's. */
%S .apx-cards { display: grid; gap: 14px; align-items: stretch; grid-template-columns: repeat(3, minmax(0, 1fr)); }
%S .apx-cards[data-columns="1"] { grid-template-columns: minmax(0, 1fr); }
%S .apx-cards[data-columns="2"] { grid-template-columns: repeat(2, minmax(0, 1fr)); }
%S .apx-cards[data-columns="4"] { grid-template-columns: repeat(4, minmax(0, 1fr)); }
@container apx (max-width: 859px) {
  %S .apx-cards:not([data-columns="1"]) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@container apx (max-width: 519px) {
  %S .apx-cards { grid-template-columns: minmax(0, 1fr); }
}
%S .apx-option-card { position: relative; flex-direction: column; align-items: stretch; gap: 10px; text-align: left; font: inherit; height: 100%; }
%S .apx-option-card[data-unavailable] { opacity: .55; cursor: not-allowed; }
%S .apx-card-check {
  position: absolute; top: 10px; right: 10px; z-index: 1; width: 22px; height: 22px; border-radius: 999px;
  border: 2px solid var(--apx-color-border, #d6d0c8); background: var(--apx-color-surface, #ffffff);
}
%S .apx-option-card.apx-option-selected .apx-card-check {
  border-color: var(--apx-color-primary, #d30704); background: var(--apx-color-primary, #d30704);
  box-shadow: inset 0 0 0 4px var(--apx-color-surface, #ffffff);
}
%S .apx-card-badge {
  position: absolute; top: 10px; left: 10px; z-index: 1; padding: 3px 9px; border-radius: 999px;
  background: var(--apx-color-primary, #d30704); color: #ffffff; font-size: 11px; font-weight: 600; line-height: 1.4;
}
%S .apx-card-media {
  display: flex; align-items: center; justify-content: center; overflow: hidden; aspect-ratio: 1 / 1;
  border-radius: 10px; background: var(--apx-card-media-background, #f3f1ee);
}
%S .apx-card-media > img { width: 100%; height: 100%; object-fit: cover; display: block; }
%S .apx-card-price { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 8px; margin-top: 2px; }
%S .apx-card-price-now { font-size: 1.1em; font-weight: 700; }
%S .apx-card-price-was { font-size: .85em; opacity: .55; }
%S .apx-card-unavailable { font-size: .85em; font-weight: 600; color: var(--apx-color-error, #b23a3a); }
%S .apx-card-subtitle { font-size: .9em; opacity: .85; }
%S .apx-card-features { margin: 4px 0 0; padding-left: 1.1em; list-style: disc; font-size: .9em; line-height: 1.45; display: flex; flex-direction: column; gap: 2px; }
/* A decorative image a layout hides on phones. */
@container apx (max-width: 600px) {
  %S .apx-layout-image[data-mobile="hide"] { display: none; }
}
/* The details form inside a details-page layout. */
%S .apx-details-fields { display: flex; flex-direction: column; gap: var(--apx-container-gap, 18px); }
%S .apx-details-row { display: flex; flex-direction: column; gap: var(--apx-container-gap, 18px); }
%S .apx-details-fields[data-columns="2"] .apx-details-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
@container apx (max-width: 519px) {
  %S .apx-details-fields[data-columns="2"] .apx-details-row { grid-template-columns: minmax(0, 1fr); }
}
%S .apx-input-wrap { position: relative; display: block; }
%S .apx-input-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 17px; height: 17px; opacity: .55; pointer-events: none; }
%S .apx-input-wrap > .apx-input { padding-left: 38px; }
`;
