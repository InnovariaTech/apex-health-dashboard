// GENERATED from apex-form-renderer/src — do not edit here. Edit there, then run `npm run sync`.
import { computeLive, formatComputed, type PublicComputed } from "../engine/computed";
import type { ChoiceOption } from "../types";

/**
 * Page layouts (forms/steps-layout-computed.md §2, §5): what a step of a form with pages carries,
 * and the logic the browser needs to draw it — live conditions, live computed values and quoted
 * values. React parts are in `react/PageLayout.tsx`; nothing here touches the DOM.
 */

export const LAYOUT_VERSION = 1;

/** One node of a page's tree. Its own props sit beside `type` (checked by the backend registry). */
export interface LayoutNode {
  type: string;
  id?: string;
  /** Display only; same subset as `fieldConditions`. */
  showWhen?: LayoutCondition;
  children?: LayoutNode[];
  [prop: string]: unknown;
}

/**
 * The conditions a browser evaluates: `selected`, `answered`, `all`, `any`, `not`, and comparisons
 * on `computed.<key>`. Anything else (a fact) is unknown here and reads as false.
 */
export type LayoutCondition =
  | { eq: [string, unknown] }
  | { in: [string, unknown[]] }
  | { between: [string, number, number] }
  | { gte: [string, number] }
  | { lte: [string, number] }
  | { selected: [string, string] }
  | { answered: string }
  | { all: LayoutCondition[] }
  | { any: LayoutCondition[] }
  | { not: LayoutCondition };

/** Earlier answers and the server's computed values, on pages that have a tree. */
export interface LayoutContext {
  /** As the patient reads them: a select's option labels joined by ", "; numbers as numbers. */
  answers: Record<string, string | number>;
  /** Option keys of earlier select answers (for `selected`). */
  selected: Record<string, string[]>;
  /** Server values, unrounded. */
  computed: Record<string, number | null>;
}

/** What a question looks like to the layout: enough to read and quote its answer. */
export interface LayoutField {
  key: string;
  type: string;
  prompt?: string;
  options?: ChoiceOption[];
}

/** An answer as the page holds it while the patient fills it in: keys for a select, text otherwise. */
export type PageValue = string | string[] | undefined;

export const NODE_TYPES = [
  "stack", "columns", "card", "eyebrow", "heading", "text", "image", "callout", "divider", "spacer", "detailsForm", "field",
  "metric", "content",
] as const;
export const WIDGETS = ["buttons", "cards", "dropdown", "heightInput", "dateParts", "email", "phone"] as const;

/**
 * Why this tree cannot be drawn, or null. An unknown version, node type or widget is a hard
 * failure (§2): never skip part of a page the patient must answer.
 */
export function unsupportedLayout(tree: LayoutNode | null | undefined, layoutVersion?: number | null): string | null {
  if (layoutVersion !== undefined && layoutVersion !== null && layoutVersion !== LAYOUT_VERSION) {
    return `layout version ${layoutVersion} is not supported`;
  }
  if (!tree) return null;
  const walk = (n: LayoutNode): string | null => {
    if (!(NODE_TYPES as readonly string[]).includes(n.type)) return `unknown layout part "${n.type}"`;
    if (n.type === "field" && typeof n.widget === "string" && !(WIDGETS as readonly string[]).includes(n.widget)) {
      return `unknown answer widget "${n.widget}"`;
    }
    for (const c of n.children ?? []) {
      const e = walk(c);
      if (e) return e;
    }
    return null;
  };
  return walk(tree);
}

// ── Values ────────────────────────────────────────────────────────────────────

const isBlank = (v: PageValue) => v === undefined || (Array.isArray(v) ? v.length === 0 : v.trim() === "");

/** A page's number answers for formulas: blank or not a number → unknown. */
export function pageNumbers(fields: LayoutField[], values: Record<string, PageValue>): Record<string, number | null> {
  const out: Record<string, number | null> = {};
  for (const f of fields) {
    if (f.type !== "number") continue;
    const v = values[f.key];
    const n = typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
    out[f.key] = Number.isFinite(n) ? n : null;
  }
  return out;
}

/** Everything a page's layout reads, worked out once per render. */
export interface LayoutEnv {
  /** Live computed values, unrounded. */
  computed: Record<string, number | null>;
  /** A computed value as text (rounded to its decimals, with no unit), "" while unknown. */
  formatComputed(key: string): string;
  /** A value quoted in a heading or text, "" when empty. */
  quote(scope: "answers" | "computed", key: string): string;
  /** A display condition. */
  test(c: LayoutCondition | undefined): boolean;
  unitOf(key: string): string | undefined;
}

/**
 * Build the environment for one page: this page's answers (live), earlier answers and the
 * server's values (`context`), and the formulas the page needs (`computed`).
 */
export function layoutEnv(opts: {
  fields: LayoutField[];
  values: Record<string, PageValue>;
  computed?: PublicComputed[] | null | undefined;
  context?: LayoutContext | null | undefined;
}): LayoutEnv {
  const { fields, values } = opts;
  const context: LayoutContext = opts.context ?? { answers: {}, selected: {}, computed: {} };
  const onPage = new Map(fields.map((f) => [f.key, f]));
  const live = computeLive(opts.computed, pageNumbers(fields, values), context.answers, context.computed);
  const defs = new Map((opts.computed ?? []).map((c) => [c.key, c]));

  const selectedOf = (q: string): string[] => {
    if (onPage.has(q)) {
      const v = values[q];
      return Array.isArray(v) ? v : [];
    }
    return context.selected[q] ?? [];
  };
  const answered = (q: string): boolean => {
    if (onPage.has(q)) return !isBlank(values[q]);
    const v = context.answers[q];
    return v !== undefined && String(v).trim() !== "";
  };
  const read = (ref: string): unknown => (ref.startsWith("computed.") ? live[ref.slice(9)] ?? null : null);
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

  const test = (c: LayoutCondition | undefined): boolean => {
    if (!c) return true;
    if ("eq" in c) return read(c.eq[0]) === c.eq[1];
    if ("in" in c) return c.in[1].includes(read(c.in[0]));
    if ("between" in c) {
      const v = num(read(c.between[0]));
      return v !== null && v >= c.between[1] && v <= c.between[2];
    }
    if ("gte" in c) {
      const v = num(read(c.gte[0]));
      return v !== null && v >= c.gte[1];
    }
    if ("lte" in c) {
      const v = num(read(c.lte[0]));
      return v !== null && v <= c.lte[1];
    }
    if ("selected" in c) return selectedOf(c.selected[0]).includes(c.selected[1]);
    if ("answered" in c) return answered(c.answered);
    if ("all" in c) return c.all.every(test);
    if ("any" in c) return c.any.some(test);
    if ("not" in c) return !test(c.not);
    return false;
  };

  const format = (key: string) => formatComputed(live[key], defs.get(key)?.decimals);

  const quote = (scope: "answers" | "computed", key: string): string => {
    if (scope === "computed") return format(key);
    const f = onPage.get(key);
    if (!f) {
      const v = context.answers[key];
      return v === undefined ? "" : String(v);
    }
    const v = values[key];
    if (Array.isArray(v)) {
      return v.map((k) => f.options?.find((o) => o.key === k)?.label ?? k).join(", ");
    }
    return (v ?? "").trim();
  };

  return { computed: live, formatComputed: format, quote, test, unitOf: (key) => defs.get(key)?.unit };
}

// ── Quoted values and accent words ────────────────────────────────────────────

/** A piece of a heading or text: words, or a quoted value; either may be accented. */
export type TemplatePart =
  | { kind: "text"; text: string; accent: boolean }
  | { kind: "value"; scope: "answers" | "computed"; key: string; accent: boolean };

const PLACEHOLDER = /^\s*(answers|computed)\.([a-zA-Z][a-zA-Z0-9_]*)\s*$/;

/**
 * `{{answers.x}}` / `{{computed.x}}` quote a value; `[[words]]` are drawn in the accent colour
 * (they may contain a quoted value). A malformed `{{…}}` stays as text; the backend reports it.
 */
export function parseTemplate(text: string): TemplatePart[] {
  const parts: TemplatePart[] = [];
  let accent = false;
  let buf = "";
  const flush = () => {
    if (buf) parts.push({ kind: "text", text: buf, accent });
    buf = "";
  };
  let i = 0;
  while (i < text.length) {
    const two = text.slice(i, i + 2);
    if (two === "{{") {
      const end = text.indexOf("}}", i + 2);
      const m = end === -1 ? null : PLACEHOLDER.exec(text.slice(i + 2, end));
      if (m) {
        flush();
        parts.push({ kind: "value", scope: m[1] as "answers" | "computed", key: m[2]!, accent });
        i = end + 2;
        continue;
      }
    }
    if (two === "[[" || (two === "]]" && accent)) {
      flush();
      accent = two === "[[";
      i += 2;
      continue;
    }
    buf += text[i];
    i++;
  }
  flush();
  return parts;
}

/** Whether a quoted value in the text is empty right now (for a heading's `fallback`). */
export function hasEmptyValue(parts: TemplatePart[], env: LayoutEnv): boolean {
  return parts.some((p) => p.kind === "value" && env.quote(p.scope, p.key) === "");
}

/** Markdown punctuation a quoted value must not trigger: values are always plain text. */
const escapeMarkdown = (s: string) => s.replace(/([\\`*_{}[\]()#+\-.!|<>~])/g, "\\$1");

/** The marker an accented run becomes inside markdown; the renderer draws it as an accent span. */
export const ACCENT_HREF = "#apx-accent";

/** A `text` / `callout` node's markdown, with values filled in (escaped) and accents marked. */
export function templateToMarkdown(text: string, env: LayoutEnv): string {
  let out = "";
  let run = "";
  let inAccent = false;
  const close = () => {
    if (inAccent && run) out += `[${run}](${ACCENT_HREF})`;
    else out += run;
    run = "";
  };
  for (const p of parseTemplate(text)) {
    if (p.accent !== inAccent) {
      close();
      inAccent = p.accent;
    }
    run += p.kind === "text" ? p.text : escapeMarkdown(env.quote(p.scope, p.key));
  }
  close();
  return out;
}

