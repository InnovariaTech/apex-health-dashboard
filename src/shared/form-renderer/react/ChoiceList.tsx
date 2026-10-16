// GENERATED from apex-form-renderer/src — do not edit here. Edit there, then run `npm run sync`.
import type { ReactNode } from "react";
import type { ChoiceOption } from "../types";

/**
 * What picking `key` does to a selection: one choice replaces the last; with several allowed, an
 * exclusive option ("None of these") clears the rest and is cleared by any other.
 */
export function nextSelection(current: string[], key: string, multi: boolean, options: ChoiceOption[]): string[] {
  if (!multi) return [key];
  const option = options.find((o) => o.key === key);
  if (option?.exclusive) return current.includes(key) ? [] : [key];
  const exclusive = new Set(options.filter((o) => o.exclusive).map((o) => o.key));
  const base = current.filter((k) => !exclusive.has(k));
  return base.includes(key) ? base.filter((k) => k !== key) : [...base, key];
}

/** A question's choices as themed option cards, with real radio / checkbox inputs. */
export function ChoiceList({
  name,
  options,
  selected,
  multi,
  onChange,
  renderBelow,
}: {
  /** Groups the inputs (the question key). */
  name: string;
  options: ChoiceOption[];
  selected: string[];
  multi: boolean;
  onChange: (next: string[]) => void;
  /** Shown under a chosen option, e.g. its follow-up field. */
  renderBelow?: (option: ChoiceOption) => ReactNode;
}) {
  return (
    <div className="apx-options" role={multi ? "group" : "radiogroup"}>
      {options.map((o) => {
        const on = selected.includes(o.key);
        return (
          <div key={o.key}>
            <label className={`apx-option ${on ? "apx-option-selected" : ""}`}>
              <input
                type={multi ? "checkbox" : "radio"}
                name={name}
                checked={on}
                onChange={() => onChange(nextSelection(selected, o.key, multi, options))}
                className="mt-[3px] h-4 w-4 shrink-0 accent-[var(--apx-color-primary,#d30704)]"
              />
              <span className="apx-option-text">
                <span className="apx-option-label">{o.label}</span>
                {o.helpText && <span className="apx-option-help-text">{o.helpText}</span>}
              </span>
            </label>
            {on && renderBelow?.(o)}
          </div>
        );
      })}
    </div>
  );
}
