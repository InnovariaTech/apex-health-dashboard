// GENERATED from apex-form-renderer/src — do not edit here. Edit there, then run `npm run sync`.
import type { ReactNode } from "react";
import { ThemedQuestion, useImagePlacement } from "./ThemeScope";
import type { QuestionImage } from "../types";

/**
 * One question as patients see it: prompt, help text, the answer (`children`), its error, and
 * the question's image where the theme puts it — top, middle (default), bottom, or a column on
 * the left / right that stacks on top when the form is narrow. The builder preview renders the
 * very same component, so what staff see is what patients get.
 */
export function FormQuestion({
  fieldKey,
  type,
  prompt,
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
  required?: boolean | undefined;
  helpText?: string | null | undefined;
  image?: QuestionImage | null | undefined;
  error?: string | null | undefined;
  /** Builder only: a line under the prompt (e.g. the field key). */
  hint?: ReactNode;
  children: ReactNode;
}) {
  const placement = useImagePlacement(fieldKey, type);
  const side = image && (placement === "left" || placement === "right") ? placement : undefined;
  const picture = image && (
    <div className="apx-question-image-row">
      <img className="apx-question-image" src={image.url} alt={image.alt} loading="lazy" />
    </div>
  );

  return (
    <ThemedQuestion type={type} fieldKey={fieldKey} imageSide={side}>
      {/* First in the DOM for left/right too, so a narrow form that drops the columns shows it on top. */}
      {(side || placement === "top") && picture}
      <div className="apx-question-body gap-1.5">
        <p className="apx-question-text">
          {prompt}
          {required && <span style={{ color: "var(--apx-color-error, #b23a3a)" }}> *</span>}
        </p>
        {helpText && <p className="apx-help-text">{helpText}</p>}
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
