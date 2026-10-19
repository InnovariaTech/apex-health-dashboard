// GENERATED from apex-form-renderer/src — do not edit here. Edit there, then run `npm run sync`.
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { formLabel, frameLayout, nextLabel, type FrameLayout } from "../theme/themeKit";
import type { FormLabelKey, Theme, ThemeRulesTable } from "../types";
import { ThemeScope, useHidden, useThemeValues } from "./ThemeScope";

/**
 * The page a form sits in (rules v3, "page frame"): the themed page, the header (logo, the
 * organization's header button, the form's title), the form box and the content inside it, and a
 * place for the Back / Next area. Every screen of a walk and the builder's preview use this, so the
 * layout choices (`header.attach`, `logo.align`, `headerButton.align`, `container.align`, `container.verticalAlign`,
 * `step.align`, `actions.attach`, `actions.arrange`) are drawn the same everywhere.
 *
 * - `header.attach: page` makes the header a bar across the top of the page, and the title moves to
 *   the top of the form box; `form` (the default) keeps both inside the box.
 * - The header button shows only with both words and an https link; it opens in a new tab so the
 *   walk stays open.
 * - The theme may hide (rules v5) the whole header, or only its logo, header button or form title;
 *   hiding the header hides all three. The form title has its own element, `formTitle`
 *   (`.apx-form-title`), which falls back to `title`'s values.
 * - `actions.attach: page` puts `FormActions` in a bar at the bottom of the screen. The guide
 *   (rendering-the-theme.md §11) suggests `position: fixed` plus bottom padding on the page; this
 *   uses `position: sticky` at the end of the page instead, which looks the same, never covers the
 *   last question, and also works inside the admin's preview (the page is a CSS container, which
 *   would pin a fixed bar to the page instead of the screen).
 */

/** The bottom bar inside a frame (null until it mounts); undefined outside any frame. */
const SlotContext = createContext<HTMLElement | null | undefined>(undefined);

export function FormFrame({
  values,
  rules,
  logoUrl,
  title,
  minHeight,
  className = "",
  children,
}: {
  /** The merged theme (`theme.values`). */
  values: Theme | null | undefined;
  rules?: ThemeRulesTable | null | undefined;
  /** The partner's (or form's) logo; none, no logo (the apps pass Apex's as their fallback). */
  logoUrl?: string | null | undefined;
  /** The form's title. */
  title?: string | null | undefined;
  /** The page's height: the screen by default; a preview passes its own (e.g. "100%"). */
  minHeight?: string | undefined;
  className?: string;
  children: ReactNode;
}) {
  const [slot, setSlot] = useState<HTMLElement | null>(null);

  return (
    <ThemeScope values={values} rules={rules} className={className} frameMinHeight={minHeight}>
      <SlotContext.Provider value={slot}>
        <FrameBody logoUrl={logoUrl} title={title}>
          {children}
        </FrameBody>
        {frameLayout(values).actionsAttach === "page" && <div className="apx-actions-bar" ref={setSlot} />}
      </SlotContext.Provider>
    </ThemeScope>
  );
}

/** Inside the scope, so it can ask what the theme hides. */
function FrameBody({
  logoUrl,
  title,
  children,
}: {
  logoUrl?: string | null | undefined;
  title?: string | null | undefined;
  children: ReactNode;
}) {
  const values = useThemeValues();
  const layout = useMemo(() => frameLayout(values), [values]);
  const pageHeader = layout.headerAttach === "page";
  const hideHeader = useHidden("header");
  const hideTitle = useHidden("formTitle");
  const titleEl = title && !hideHeader && !hideTitle ? <h1 className="apx-form-title">{title}</h1> : null;
  const header = (attach: "form" | "page", withTitle?: ReactNode) =>
    hideHeader ? null : <FrameHeader layout={layout} logoUrl={logoUrl} attach={attach} title={withTitle} />;

  return (
    <>
      {pageHeader && header("page")}
      <div className="apx-frame-body" data-valign={layout.containerVerticalAlign}>
        <div className="apx-container" data-align={layout.containerAlign}>
          {pageHeader ? titleEl : header("form", titleEl)}
          <div className="apx-step" data-align={layout.stepAlign}>
            {children}
          </div>
        </div>
      </div>
    </>
  );
}

function FrameHeader({
  layout,
  logoUrl,
  attach,
  title,
}: {
  layout: FrameLayout;
  logoUrl?: string | null | undefined;
  attach: "form" | "page";
  title?: ReactNode;
}) {
  const hideLogo = useHidden("logo");
  const hideButton = useHidden("headerButton");
  const logo = logoUrl && !hideLogo;
  const button = layout.button && !hideButton;
  // Nothing left to draw: no empty header box.
  if (!logo && !button && !title) return null;
  return (
    <div className="apx-header" data-attach={attach}>
      <div className="apx-header-row" data-logo={layout.logoAlign}>
        {logo && <img className="apx-logo" data-side={layout.logoAlign} src={logoUrl} alt="" />}
        {button && layout.button && (
          <a
            className="apx-header-button"
            data-side={layout.buttonAlign}
            href={layout.button.link}
            target="_blank"
            rel="noopener noreferrer"
          >
            {layout.button.text}
          </a>
        )}
      </div>
      {title}
    </div>
  );
}

/**
 * The Back / Next area. Inside the form by default; with `actions.attach: page` it renders into the
 * bar at the bottom of the screen. `arrange` decides how its buttons share it.
 */
export function FormActions({ className = "", children }: { className?: string; children: ReactNode }) {
  const values = useThemeValues();
  const layout = useMemo(() => frameLayout(values), [values]);
  const slot = useContext(SlotContext);
  const area = (
    <div className={`apx-actions ${className}`} data-arrange={layout.arrange}>
      {children}
    </div>
  );
  if (layout.actionsAttach === "page" && slot !== undefined) return slot ? createPortal(area, slot) : null;
  return area;
}

/** A button's words: the theme's `labels.<key>`, else `fallback`. */
export function useFormLabel(key: FormLabelKey, fallback: string): string {
  return formLabel(useThemeValues(), key, fallback);
}

/**
 * The Next button's words: `labels.nextWithTitle` with the next titled page's name ("Next:
 * Medical history") when the theme sets it and the result fits; else `labels.next`, else `fallback`.
 */
export function useNextLabel(nextTitle: string | null | undefined, fallback: string): string {
  return nextLabel(useThemeValues(), nextTitle, fallback);
}

/** A button's words as an element, for pages that build their buttons outside the frame. */
export function FormLabel({ name, fallback }: { name: FormLabelKey; fallback: string }) {
  return <>{useFormLabel(name, fallback)}</>;
}

/**
 * The page title above a page (rules v5, `.apx-step-title`): a question step's `stepTitle`, or a
 * details page's `title`. Nothing when there is none or the theme hides `stepTitle`.
 */
export function StepTitle({ title }: { title?: string | null | undefined }) {
  const hidden = useHidden("stepTitle");
  if (!title || hidden) return null;
  return <div className="apx-step-title">{title}</div>;
}

/**
 * How far through the form the patient is. The theme may hide the whole indicator (`progress`)
 * or only its fill (`progressBar`), rules v5.
 */
export function FormProgress({ percent }: { percent: number }) {
  const hideProgress = useHidden("progress");
  const hideBar = useHidden("progressBar");
  if (hideProgress) return null;
  return (
    <div className="apx-progress">
      {!hideBar && <div className="apx-progress-bar" style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />}
    </div>
  );
}
