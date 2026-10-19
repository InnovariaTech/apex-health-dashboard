// GENERATED from apex-form-renderer/src — do not edit here. Edit there, then run `npm run sync`.
import { evalFormula, parseFormula, type FormulaAst } from "./formula";

/**
 * Computed values in the browser (forms/steps-layout-computed.md §4): the formulas a page needs,
 * worked out live from the answers on the page, with the server's values (`context.computed`) for
 * anything whose inputs are on earlier pages.
 */

/** A computed value as a step sends it: its formula and how to show it. */
export interface PublicComputed {
  key: string;
  formula: string;
  unit?: string;
  /** Display rounding only; rules (on the server) see the full value. */
  decimals?: number;
}

const cache = new Map<string, FormulaAst | null>();
function astOf(formula: string): FormulaAst | null {
  if (!cache.has(formula)) {
    const r = parseFormula(formula);
    if (cache.size > 500) cache.clear();
    cache.set(formula, r.ok ? r.ast : null);
  }
  return cache.get(formula) ?? null;
}

const has = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k);

/**
 * Every value this page shows or tests, by key.
 *
 * - `answers`: numbers typed on this page (blank or not a number → unknown).
 * - `earlier`: answers from earlier pages that are numbers (`context.answers`).
 * - `server`: the server's values (`context.computed`), used for any key this page has no formula for.
 *
 * Formulas run in dependency order; a key inside a cycle is unknown, as on the server.
 */
export function computeLive(
  formulas: PublicComputed[] | null | undefined,
  answers: Record<string, number | null>,
  earlier: Record<string, unknown> = {},
  server: Record<string, number | null> = {},
): Record<string, number | null> {
  const byKey = new Map<string, PublicComputed>();
  for (const c of formulas ?? []) if (!byKey.has(c.key)) byKey.set(c.key, c);
  const out: Record<string, number | null> = {};
  const visiting: string[] = [];
  const cyclic = new Set<string>();

  const valueOf = (key: string): number | null => {
    if (has(out, key)) return out[key] ?? null;
    const c = byKey.get(key);
    if (!c) return has(server, key) ? server[key] ?? null : null;
    const at = visiting.indexOf(key);
    if (at !== -1) {
      for (const k of visiting.slice(at)) cyclic.add(k);
      return null;
    }
    visiting.push(key);
    const ast = astOf(c.formula);
    const value = ast
      ? evalFormula(ast, {
          answer: (k) => {
            if (has(answers, k)) return answers[k] ?? null;
            const e = has(earlier, k) ? earlier[k] : undefined;
            return typeof e === "number" && Number.isFinite(e) ? e : null;
          },
          // Facts never reach the browser; values built on them come from the server.
          fact: () => null,
          computed: valueOf,
        })
      : null;
    visiting.pop();
    // A formula that needs a fact the browser lacks is unknown here: fall back to the server's value.
    out[key] = value === null && has(server, key) ? server[key] ?? null : value;
    return out[key] ?? null;
  };

  for (const key of byKey.keys()) valueOf(key);
  for (const key of Object.keys(server)) if (!has(out, key)) out[key] = server[key] ?? null;
  for (const key of cyclic) out[key] = null;
  return out;
}

/** A value as a patient reads it: rounded to `decimals` (when set), "" while unknown. */
export function formatComputed(value: number | null | undefined, decimals?: number): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "";
  const rounded = decimals === undefined ? value : Math.round(value * 10 ** decimals) / 10 ** decimals;
  return rounded.toLocaleString("en-US", {
    maximumFractionDigits: decimals ?? 6,
    ...(decimals !== undefined ? { minimumFractionDigits: decimals } : {}),
  });
}
