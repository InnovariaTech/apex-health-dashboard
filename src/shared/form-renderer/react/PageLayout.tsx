// GENERATED from apex-form-renderer/src — do not edit here. Edit there, then run `npm run sync`.
import type { CSSProperties, ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import {
  ACCENT_HREF,
  hasEmptyValue,
  parseTemplate,
  templateToMarkdown,
  type LayoutCondition,
  type LayoutEnv,
  type LayoutField,
  type LayoutNode,
  type PageValue,
} from "../layout/layout";
import type { ContentBlockData } from "../types";
import { ChoiceList } from "./ChoiceList";
import { ContentBlocks } from "./ContentBlocks";
import { ButtonsWidget, CardsWidget, ContactWidget, DatePartsWidget, DropdownWidget, HeightWidget } from "./LayoutWidgets";
import { useHidden } from "./ThemeScope";
import { TextAnswer } from "./TextAnswer";

/**
 * A page drawn from its layout tree (forms/steps-layout-computed.md §5; theme elements in
 * rendering-the-theme.md §12). The layout decides structure; the theme decides looks; the app
 * decides answers — every `field` node is drawn by `renderField`, which owns the page's state.
 *
 * Check the tree with `unsupportedLayout` first: an unknown part is a hard failure, never skipped.
 *
 * The theme may hide (rules v5) headings (`title`), the accent words in them (`titleAccent`; the
 * rest of the heading stays), eyebrows, callouts, cards and metrics. Hidden parts are not drawn;
 * a hidden card takes its content with it (the backend refuses a hidden card that holds a field or
 * the details form: `HIDDEN_HIDES_INPUT`). A hidden metric's value still drives conditions.
 */

/** How the patient details page's `detailsForm` node asks for the details fields to be drawn. */
export interface DetailsFormSlot {
  /** 2: names side by side, email and phone side by side. */
  columns: 1 | 2;
  /** Month/Day/Year dropdowns (default) or one typed date. */
  dobWidget: "dateParts" | "text";
}

/** How a `field` node asks for its question to be drawn. */
export interface FieldSlot {
  widget?: string | undefined;
  widgetProps?: Record<string, unknown> | undefined;
  /** `question`: the usual prompt; `title`: the prompt as the page title; `label`: a small label; `hidden`: read by screen readers only. */
  label: "question" | "title" | "label" | "hidden";
}

const str = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);
const num = (v: unknown): number | undefined => (typeof v === "number" && Number.isFinite(v) ? v : undefined);

/** Markdown with `[[accent]]` runs and https links (opened in a new tab); any other link is text. */
function Markdown({ text, hideAccent }: { text: string; hideAccent: boolean }) {
  return (
    <ReactMarkdown
      components={{
        a: ({ href, children }) =>
          href === ACCENT_HREF ? (
            hideAccent ? null : <span className="apx-title-accent">{children}</span>
          ) : href?.startsWith("https://") ? (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ) : (
            <>{children}</>
          ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
}

/** A heading's words with quoted values as plain text, each accent run as one span (or left out when hidden). */
function HeadingText({ text, env, hideAccent }: { text: string; env: LayoutEnv; hideAccent: boolean }) {
  const runs: { accent: boolean; words: string }[] = [];
  for (const p of parseTemplate(text)) {
    const words = p.kind === "text" ? p.text : env.quote(p.scope, p.key);
    const last = runs[runs.length - 1];
    if (last && last.accent === p.accent) last.words += words;
    else runs.push({ accent: p.accent, words });
  }
  return (
    <>
      {runs.map((r, i) =>
        r.accent && hideAccent ? null : r.accent ? (
          <span key={i} className="apx-title-accent">
            {r.words}
          </span>
        ) : (
          <span key={i}>{r.words}</span>
        ),
      )}
    </>
  );
}

export function PageLayout({
  tree,
  env,
  renderField,
  fieldConditions,
  content,
  renderDetailsForm,
}: {
  tree: LayoutNode;
  env: LayoutEnv;
  renderField: (key: string, slot: FieldSlot) => ReactNode;
  /**
   * The patient details page only: draws its fields (names, email, phone, date of birth) where the
   * layout's `detailsForm` node is. Their checks and Continue button stay the app's.
   */
  renderDetailsForm?: ((slot: DetailsFormSlot) => ReactNode) | undefined;
  /** Same-page conditions on fields: a hidden field is not drawn (and the app must not send it). */
  fieldConditions?: Record<string, LayoutCondition> | null | undefined;
  /** Content blocks placed by `content` nodes, by ref (`layoutContent`). */
  content?: Record<string, ContentBlockData> | null | undefined;
}) {
  const hidden = {
    title: useHidden("title"),
    titleAccent: useHidden("titleAccent"),
    eyebrow: useHidden("eyebrow"),
    callout: useHidden("callout"),
    card: useHidden("card"),
    metric: useHidden("metric"),
  };
  const draw = (n: LayoutNode, key: string | number): ReactNode => {
    // `showWhen` hides a node without leaving a gap; fields use the page's fieldConditions instead.
    if (n.type !== "field" && n.showWhen && !env.test(n.showWhen)) return null;
    const kids = () => (n.children ?? []).map((c, i) => draw(c, c.id ?? i));
    const id = n.id ? { "data-node": n.id } : {};

    switch (n.type) {
      case "stack":
        return (
          <div key={key} className="apx-stack" data-gap={str(n.gap) ?? "md"} data-align={str(n.align) ?? "start"} {...id}>
            {kids()}
          </div>
        );
      case "columns": {
        const ratio = Array.isArray(n.ratio) ? (n.ratio as number[]) : [];
        const style = { "--apx-columns-template": ratio.map((r) => `${r}fr`).join(" ") } as CSSProperties;
        return (
          <div
            key={key}
            className="apx-columns"
            data-gap={str(n.gap) ?? "md"}
            data-collapse={str(n.collapse) ?? "mobile"}
            style={style}
            {...id}
          >
            {kids()}
          </div>
        );
      }
      case "card":
        if (hidden.card) return null;
        return (
          <div key={key} className="apx-card" data-variant={str(n.variant) ?? "plain"} {...id}>
            {kids()}
          </div>
        );
      case "eyebrow":
        if (hidden.eyebrow) return null;
        return (
          <p key={key} className="apx-eyebrow" {...id}>
            {str(n.text)}
          </p>
        );
      case "heading": {
        if (hidden.title) return null;
        const text = str(n.text) ?? "";
        const fallback = str(n.fallback);
        const shown = fallback && hasEmptyValue(parseTemplate(text), env) ? fallback : text;
        const level = Math.min(Math.max(num(n.level) ?? 1, 1), 3);
        const Tag = (["h2", "h3", "h4"] as const)[level - 1]!;
        return (
          <Tag key={key} className={level === 3 ? "apx-heading apx-question-text" : "apx-heading apx-title"} data-level={level} {...id}>
            <HeadingText text={shown} env={env} hideAccent={hidden.titleAccent} />
          </Tag>
        );
      }
      case "text":
        return (
          <div key={key} className="apx-layout-text" {...id}>
            <Markdown text={templateToMarkdown(str(n.text) ?? "", env)} hideAccent={hidden.titleAccent} />
          </div>
        );
      case "image":
        return (
          <img
            key={key}
            className="apx-layout-image"
            src={str(n.url)}
            alt={str(n.alt) ?? ""}
            loading="lazy"
            // "hide": a decorative side image that phones don't draw.
            data-mobile={str(n.mobile) === "hide" ? "hide" : undefined}
            {...id}
          />
        );
      case "detailsForm":
        if (!renderDetailsForm) {
          // Only the details page has these fields; anywhere else is a bug in the layout.
          return (
            <p key={key} className="apx-error" role="alert">
              The details form can only be on the patient details page.
            </p>
          );
        }
        return (
          <div key={key} className="apx-details-form" {...id}>
            {renderDetailsForm({
              columns: num(n.columns) === 2 ? 2 : 1,
              dobWidget: str(n.dobWidget) === "text" ? "text" : "dateParts",
            })}
          </div>
        );
      case "callout":
        if (hidden.callout) return null;
        return (
          <div key={key} className="apx-callout" data-tone={str(n.tone) ?? "info"} {...id}>
            <Markdown text={templateToMarkdown(str(n.text) ?? "", env)} hideAccent={hidden.titleAccent} />
          </div>
        );
      case "divider":
        return <hr key={key} className="apx-divider" {...id} />;
      case "spacer":
        return <div key={key} className="apx-spacer" data-size={str(n.size) ?? "md"} aria-hidden="true" {...id} />;
      case "field": {
        const bind = str(n.bind);
        if (!bind) return null;
        const condition = fieldConditions?.[bind];
        if (condition && !env.test(condition)) return null;
        const label = str(n.label);
        return (
          <div key={key} className="apx-layout-field" {...id}>
            {renderField(bind, {
              widget: str(n.widget),
              widgetProps: n.widgetProps && typeof n.widgetProps === "object" ? (n.widgetProps as Record<string, unknown>) : undefined,
              label: label === "title" || label === "label" || label === "hidden" ? label : "question",
            })}
          </div>
        );
      }
      case "metric": {
        if (hidden.metric) return null;
        const ref = str(n.bind) ?? "";
        const k = ref.replace(/^computed\./, "");
        const value = env.formatComputed(k);
        const empty = str(n.emptyText);
        if (!value && !empty) return null;
        const unit = env.unitOf(k);
        return (
          <div key={key} className="apx-metric" aria-live="polite" {...id}>
            <span className="apx-metric-label">{str(n.label)}</span>{" "}
            {value ? (
              <span className="apx-metric-value">
                {value}
                {unit ? <span className="apx-metric-unit"> {unit}</span> : null}
              </span>
            ) : (
              <span className="apx-metric-empty">{empty}</span>
            )}
          </div>
        );
      }
      case "content": {
        const block = content?.[str(n.ref) ?? ""];
        return block ? <ContentBlocks key={key} content={[block]} /> : null;
      }
      default:
        // `unsupportedLayout` refuses these before drawing; reaching here is a bug, so say so.
        return (
          <p key={key} className="apx-error" role="alert">
            This part of the page can't be shown ({n.type}).
          </p>
        );
    }
  };

  return <div className="apx-layout">{draw(tree, "root")}</div>;
}

/**
 * One question's control: the layout's widget when it asks for one, else the type's own control.
 * Uploads are the app's to draw (they talk to its storage); everything else is here, so the
 * patient form and the builder preview draw answers the same way.
 */
export function FieldControl({
  field,
  value,
  onChange,
  widget,
  widgetProps,
  maxLength,
  renderBelow,
}: {
  field: LayoutField;
  value: PageValue;
  onChange: (v: PageValue) => void;
  widget?: string | undefined;
  widgetProps?: Record<string, unknown> | undefined;
  maxLength?: number | undefined;
  /** Under a chosen option of a plain choice list, e.g. its follow-up. */
  renderBelow?: Parameters<typeof ChoiceList>[0]["renderBelow"];
}) {
  const text = typeof value === "string" ? value : "";
  const selected = Array.isArray(value) ? value : [];
  const options = field.options ?? [];
  const multi = field.type === "multi_select";
  const props = widgetProps ?? {};

  if (field.type === "single_select" || field.type === "multi_select") {
    if (widget === "cards") {
      return <CardsWidget name={field.key} options={options} selected={selected} multi={multi} onChange={onChange} columns={num(props.columns)} />;
    }
    if (widget === "buttons") {
      return <ButtonsWidget name={field.key} options={options} selected={selected} multi={multi} onChange={onChange} columns={num(props.columns)} />;
    }
    if (widget === "dropdown" && !multi) {
      return (
        <DropdownWidget
          name={field.key}
          fieldKey={field.key}
          type={field.type}
          options={options}
          selected={selected}
          onChange={onChange}
          placeholder={str(props.placeholder)}
        />
      );
    }
    return (
      <ChoiceList
        name={field.key}
        options={options}
        selected={selected}
        multi={multi}
        onChange={onChange}
        {...(renderBelow ? { renderBelow } : {})}
      />
    );
  }
  if (widget === "heightInput" && field.type === "number") {
    return <HeightWidget value={text} onChange={onChange} minFeet={num(props.minFeet)} maxFeet={num(props.maxFeet)} />;
  }
  if (widget === "dateParts" && field.type === "date_text") {
    return <DatePartsWidget value={text} onChange={onChange} minYear={num(props.minYear)} maxYear={num(props.maxYear)} />;
  }
  if ((widget === "email" || widget === "phone") && field.type === "free_text") {
    return <ContactWidget kind={widget} fieldKey={field.key} value={text} onChange={onChange} maxLength={maxLength} />;
  }
  return <TextAnswer fieldKey={field.key} type={field.type} value={text} onChange={onChange} maxLength={maxLength} />;
}
