// GENERATED from apex-form-renderer/src — do not edit here. Edit there, then run `npm run sync`.
import type { ReactNode } from "react";
import { isHidden } from "../theme/themeKit";
import { ThemedQuestion, useImagePlacement, useThemeValues } from "./ThemeScope";
import type { QuestionImage } from "../types";

/**
 * One question as patients see it: prompt, help text, the answer (`children`), its error, and
 * the question's image where the theme puts it — top, middle (default), bottom, or a column on
 * the left / right that stacks on top when the form is narrow. The builder preview renders the
 * very same component, so what staff see is what patients get.
 *
 * The theme may hide (rules v5) the help text and the image, for this question, its type or the
 * whole form; a hidden image takes its column with it. The prompt, answer and error always show.
 */
export function FormQuestion({
  fieldKey,
  type,
  prompt,
  labelMode = "question",
  required,
  helpText,
  image,
  error,
  hint,
  children,
}: {
  fieldKey: string;
  type: string;
  prompt: ReactNode;
  /**
   * How a layout shows the prompt: `question` (the usual), `title` (as the page title), `label`
   * (a small label above the answer) or `hidden` (screen readers only).
   */
  labelMode?: "question" | "title" | "label" | "hidden" | undefined;
  required?: boolean | undefined;
  helpText?: string | null | undefined;
  image?: QuestionImage | null | undefined;
  error?: string | null | undefined;
  /** Builder only: a line under the prompt (e.g. the field key). */
  hint?: ReactNode;
  children: ReactNode;
}) {
  const values = useThemeValues();
  const place = { type, key: fieldKey };
  const placement = useImagePlacement(fieldKey, type);
  const shownImage = image && !isHidden(values, "questionImage", place) ? image : null;
  const shownHelp = helpText && !isHidden(values, "helpText", place) ? helpText : null;
  const side = shownImage && (placement === "left" || placement === "right") ? placement : undefined;
  const picture = shownImage && (
    <div className="apx-question-image-row">
      <img className="apx-question-image" src={shownImage.url} alt={shownImage.alt} loading="lazy" />
    </div>
  );

  return (
    <ThemedQuestion type={type} fieldKey={fieldKey} imageSide={side}>
      {/* First in the DOM for left/right too, so a narrow form that drops the columns shows it on top. */}
      {(side || placement === "top") && picture}
      <div className="apx-question-body gap-1.5">
        {(() => {
          const star = required && <span style={{ color: "var(--apx-color-error, #b23a3a)" }}> *</span>;
          if (labelMode === "title") return <h2 className="apx-title apx-field-title">{prompt}{star}</h2>;
          if (labelMode === "label") return <p className="apx-field-label">{prompt}{star}</p>;
          if (labelMode === "hidden") return <p className="apx-sr-only">{prompt}</p>;
          return <p className="apx-question-text">{prompt}{star}</p>;
        })()}
        {shownHelp && <p className="apx-help-text">{shownHelp}</p>}
        {hint}
        {placement === "middle" && picture}
        {children}
        {error && (
          <p className="apx-error" role="alert">
            {error}
          </p>
        )}
        {placement === "bottom" && picture}
      </div>
    </ThemedQuestion>
  );
}
