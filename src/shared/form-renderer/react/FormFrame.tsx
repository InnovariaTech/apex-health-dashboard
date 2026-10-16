// GENERATED from apex-form-renderer/src — do not edit here. Edit there, then run `npm run sync`.
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { formLabel, frameLayout, type FrameLayout } from "../theme/themeKit";
import type { FormLabelKey, Theme, ThemeRulesTable } from "../types";
import { ThemeScope, useThemeValues } from "./ThemeScope";

/**
 * The page a form sits in (rules v3, "page frame"): the themed page, the header (logo, the
 * organization's header button, the form's title), the form box and the content inside it, and a
 * place for the Back / Next area. Every screen of a walk and the builder's preview use this, so the
 * layout choices (`header.attach`, `logo.align`, `headerButton.align`, `container.align`,
 * `step.align`, `actions.attach`, `actions.arrange`) are drawn the same everywhere.
 *
 * - `header.attach: page` makes the header a bar across the top of the page, and the title moves to
 *   the top of the form box; `form` (the default) keeps both inside the box.
 * - The header button shows only with both words and an https link; it opens in a new tab so the
 *   walk stays open.
 * - `actions.attach: page` puts `FormActions` in a bar at the bottom of the screen.
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
  const layout = useMemo(() => frameLayout(values), [values]);
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const pageHeader = layout.headerAttach === "page";
  const titleEl = title ? <h1 className="apx-title">{title}</h1> : null;

  return (
    <ThemeScope values={values} rules={rules} className={className} frameMinHeight={minHeight}>
      <SlotContext.Provider value={slot}>
        {pageHeader && <FrameHeader layout={layout} logoUrl={logoUrl} attach="page" />}
        <div className="apx-frame-body">
          <div className="apx-container" data-align={layout.containerAlign}>
            {pageHeader ? titleEl : <FrameHeader layout={layout} logoUrl={logoUrl} attach="form" title={titleEl} />}
            <div className="apx-step" data-align={layout.stepAlign}>
              {children}
            </div>
          </div>
        </div>
        {layout.actionsAttach === "page" && <div className="apx-actions-bar" ref={setSlot} />}
      </SlotContext.Provider>
    </ThemeScope>
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
  return (
    <div className="apx-header" data-attach={attach}>
      <div className="apx-header-row">
        {logoUrl && <img className="apx-logo" data-side={layout.logoAlign} src={logoUrl} alt="" />}
        {layout.button && (
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

/** A button's words as an element, for pages that build their buttons outside the frame. */
export function FormLabel({ name, fallback }: { name: FormLabelKey; fallback: string }) {
  return <>{useFormLabel(name, fallback)}</>;
}
