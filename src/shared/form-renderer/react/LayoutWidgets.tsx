// GENERATED from apex-form-renderer/src — do not edit here. Edit there, then run `npm run sync`.
import { useEffect, useState } from "react";
import { Mail, Phone } from "lucide-react";
import { nextSelection } from "./ChoiceList";
import { useHidden, usePlaceholder } from "./ThemeScope";
import type { ChoiceOption, OptionPlan } from "../types";

/**
 * The answer widgets a layout's `field` node may ask for (forms/steps-layout-computed.md §5). A
 * widget changes the control, never the answer kind: buttons and dropdown still pick option keys,
 * `heightInput` still stores a number (total inches), `dateParts` still stores `YYYY-MM-DD`, and
 * email / phone are still free text checked by the question's pattern on the server.
 */

interface ChoiceWidgetProps {
  name: string;
  options: ChoiceOption[];
  selected: string[];
  multi: boolean;
  onChange: (next: string[]) => void;
}

/** Options as buttons side by side (Yes / No), `columns` per row. Themed as options. */
export function ButtonsWidget({ name, options, selected, multi, onChange, columns }: ChoiceWidgetProps & { columns?: number | undefined }) {
  const per = Math.min(Math.max(columns ?? Math.min(options.length, 4), 1), 4);
  return (
    <div className="apx-buttons" role={multi ? "group" : "radiogroup"} data-columns={per} aria-label={name}>
      {options.map((o) => {
        const on = selected.includes(o.key);
        return (
          <button
            key={o.key}
            type="button"
            role={multi ? "checkbox" : "radio"}
            aria-checked={on}
            className={`apx-option apx-option-button ${on ? "apx-option-selected" : ""}`}
            onClick={() => onChange(nextSelection(selected, o.key, multi, options))}
          >
            <span className="apx-option-label">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** "$249", "€30.50": whole amounts without cents. */
function money(amount: number, currency: string): string {
  const whole = Number.isInteger(amount);
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: whole ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

/**
 * A plan's price as the checkout screen words it: "$249 / month", "$249 / month for 3 months",
 * "$897 · covers 3 months". `was` is the crossed-out price, only when it is higher.
 */
export function planPrice(plan: OptionPlan): { now: string; was: string | null } | null {
  if (plan.cost === null || plan.cost === undefined) return null;
  const cost = Number(plan.cost);
  const amount = money(cost, plan.currency);
  const now =
    plan.billingMode === "per_cycle"
      ? `${amount} / month${plan.totalCycles ? ` for ${plan.totalCycles} months` : ""}`
      : plan.totalCycles && plan.totalCycles > 1
        ? `${amount} · covers ${plan.totalCycles} months`
        : amount;
  const was = plan.compareAtCost !== null && Number(plan.compareAtCost) > cost ? money(Number(plan.compareAtCost), plan.currency) : null;
  return { now, was };
}

/**
 * Options as product cards: each option's card (image, badge, subtitle, bullets) and, when it sells
 * a plan, that plan's price — the price actually charged. A plan that is archived or gone shows as
 * unavailable and can't be chosen. Themed as options, so the partner's choice styles apply.
 */
export function CardsWidget({ name, options, selected, multi, onChange, columns }: ChoiceWidgetProps & { columns?: number | undefined }) {
  const per = Math.min(Math.max(columns ?? 3, 1), 4);
  const hideHelp = useHidden("optionHelpText");
  return (
    <div className="apx-cards" role={multi ? "group" : "radiogroup"} data-columns={per} aria-label={name}>
      {options.map((o) => {
        const on = selected.includes(o.key);
        const card = o.card ?? {};
        const unavailable = o.plan ? !o.plan.available : false;
        const price = o.plan && !unavailable ? planPrice(o.plan) : null;
        return (
          <button
            key={o.key}
            type="button"
            role={multi ? "checkbox" : "radio"}
            aria-checked={on}
            aria-disabled={unavailable || undefined}
            disabled={unavailable && !on}
            className={`apx-option apx-option-card ${on ? "apx-option-selected" : ""}`}
            data-unavailable={unavailable || undefined}
            onClick={() => !unavailable && onChange(nextSelection(selected, o.key, multi, options))}
          >
            <span className="apx-card-check" aria-hidden="true" />
            {card.badge && <span className="apx-card-badge">{card.badge}</span>}
            {card.image && (
              <span className="apx-card-media">
                <img src={card.image.url} alt={card.image.alt} loading="lazy" />
              </span>
            )}
            <span className="apx-option-text">
              <span className="apx-option-label">{o.label}</span>
              {price && (
                <span className="apx-card-price">
                  <span className="apx-card-price-now">{price.now}</span>
                  {price.was && (
                    <s className="apx-card-price-was" aria-label={`was ${price.was}`}>
                      {price.was}
                    </s>
                  )}
                </span>
              )}
              {unavailable && <span className="apx-card-unavailable">Currently unavailable</span>}
              {card.subtitle && <span className="apx-card-subtitle">{card.subtitle}</span>}
              {o.helpText && !hideHelp && <span className="apx-option-help-text">{o.helpText}</span>}
              {card.features && card.features.length > 0 && (
                <ul className="apx-card-features">
                  {card.features.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Options in a dropdown (single select only). */
export function DropdownWidget({
  name,
  fieldKey,
  type,
  options,
  selected,
  onChange,
  placeholder,
}: Omit<ChoiceWidgetProps, "multi"> & { fieldKey: string; type: string; placeholder?: string | undefined }) {
  const themed = usePlaceholder(fieldKey, type);
  return (
    <select
      className="apx-input apx-select"
      aria-label={name}
      value={selected[0] ?? ""}
      onChange={(e) => onChange(e.target.value ? [e.target.value] : [])}
    >
      <option value="">{placeholder || themed || "Choose…"}</option>
      {options.map((o) => (
        <option key={o.key} value={o.key}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

const range = (from: number, to: number) => Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);

/** Feet + inches; the answer is total inches as a number ("65"). */
export function HeightWidget({
  value,
  onChange,
  minFeet = 3,
  maxFeet = 8,
}: {
  value: string;
  onChange: (v: string) => void;
  minFeet?: number | undefined;
  maxFeet?: number | undefined;
}) {
  const total = value.trim() === "" ? NaN : Number(value);
  // Kept while only one of the two is chosen, so picking feet first doesn't lose it.
  const [feet, setFeet] = useState<string>(Number.isFinite(total) ? String(Math.floor(total / 12)) : "");
  const [inches, setInches] = useState<string>(Number.isFinite(total) ? String(Math.round(total % 12)) : "");
  useEffect(() => {
    if (!Number.isFinite(total)) return;
    setFeet(String(Math.floor(total / 12)));
    setInches(String(Math.round(total % 12)));
  }, [total]);

  const set = (f: string, i: string) => {
    setFeet(f);
    setInches(i);
    onChange(f !== "" && i !== "" ? String(Number(f) * 12 + Number(i)) : "");
  };
  return (
    <div className="apx-parts" data-parts="2">
      <select className="apx-input apx-select" aria-label="Feet" value={feet} onChange={(e) => set(e.target.value, inches === "" ? "0" : inches)}>
        <option value="">Feet</option>
        {range(Math.min(minFeet, maxFeet), Math.max(minFeet, maxFeet)).map((n) => (
          <option key={n} value={n}>
            {n} ft
          </option>
        ))}
      </select>
      <select className="apx-input apx-select" aria-label="Inches" value={inches} onChange={(e) => set(feet, e.target.value)}>
        <option value="">Inches</option>
        {range(0, 11).map((n) => (
          <option key={n} value={n}>
            {n} in
          </option>
        ))}
      </select>
    </div>
  );
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const daysIn = (y: number, m: number) => new Date(Date.UTC(y || 2000, m, 0)).getUTCDate();
const pad = (n: string, len: number) => n.padStart(len, "0");

/** Month / Day / Year; the answer is `YYYY-MM-DD` once all three are chosen, blank before. */
export function DatePartsWidget({
  value,
  onChange,
  minYear,
  maxYear,
}: {
  value: string;
  onChange: (v: string) => void;
  minYear?: number | undefined;
  maxYear?: number | undefined;
}) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const [parts, setParts] = useState({ y: m?.[1] ?? "", mo: m ? String(Number(m[2])) : "", d: m ? String(Number(m[3])) : "" });
  useEffect(() => {
    if (m) setParts({ y: m[1]!, mo: String(Number(m[2])), d: String(Number(m[3])) });
    // Only an outside change of a complete date resets the parts.
  }, [value]);

  const thisYear = new Date().getFullYear();
  const top = maxYear ?? thisYear;
  const bottom = minYear ?? 1900;
  const set = (next: typeof parts) => {
    // A day past the end of the chosen month (31 → February) is cleared rather than rolled over.
    const max = next.mo ? daysIn(Number(next.y), Number(next.mo)) : 31;
    const fixed = next.d && Number(next.d) > max ? { ...next, d: "" } : next;
    setParts(fixed);
    onChange(fixed.y && fixed.mo && fixed.d ? `${fixed.y}-${pad(fixed.mo, 2)}-${pad(fixed.d, 2)}` : "");
  };
  return (
    <div className="apx-parts" data-parts="3">
      <select className="apx-input apx-select" aria-label="Month" value={parts.mo} onChange={(e) => set({ ...parts, mo: e.target.value })}>
        <option value="">Month</option>
        {MONTHS.map((name, i) => (
          <option key={name} value={i + 1}>
            {name}
          </option>
        ))}
      </select>
      <select className="apx-input apx-select" aria-label="Day" value={parts.d} onChange={(e) => set({ ...parts, d: e.target.value })}>
        <option value="">Day</option>
        {range(1, parts.mo ? daysIn(Number(parts.y), Number(parts.mo)) : 31).map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      <select className="apx-input apx-select" aria-label="Year" value={parts.y} onChange={(e) => set({ ...parts, y: e.target.value })}>
        <option value="">Year</option>
        {range(Math.min(bottom, top), Math.max(bottom, top))
          .reverse()
          .map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
      </select>
    </div>
  );
}

/** Email or phone: the right keyboard and an icon; the server still checks the question's pattern. */
export function ContactWidget({
  kind,
  fieldKey,
  value,
  onChange,
  maxLength,
}: {
  kind: "email" | "phone";
  fieldKey: string;
  value: string;
  onChange: (v: string) => void;
  maxLength?: number | undefined;
}) {
  const themed = usePlaceholder(fieldKey, "free_text");
  const Icon = kind === "email" ? Mail : Phone;
  return (
    <span className="apx-input-wrap">
      <input
        type={kind === "email" ? "email" : "tel"}
        inputMode={kind === "email" ? "email" : "tel"}
        autoComplete={kind === "email" ? "email" : "tel"}
        className="apx-input"
        value={value}
        placeholder={themed || (kind === "email" ? "you@example.com" : "(555) 555-5555")}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
      />
      <Icon className="apx-input-icon" aria-hidden="true" />
    </span>
  );
}
