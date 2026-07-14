// @ts-nocheck
import React from "react";
import ReactMarkdown from "react-markdown";
import { InlineText } from "./chatInline";
import type {
  ChatCalloutBlock,
  ChatIntroBlock,
  ChatLabSnapshotBlock,
  ChatMarker,
  ChatMarkdownBlock,
  ChatPhasePlanBlock,
  ChatPriorityBlock,
  ChatProductRecBlock,
  ChatSectionBlock,
  ResponseBlock,
} from "@/types/ai-agent/ai_chat";

/* ─── Inline SVG icons (ported from the mockup's icons.js) ─── */
const ICON_PATHS: Record<string, React.ReactNode> = {
  spark: <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />,
  check: <path d="M5 12l4 4L19 6" />,
  warn: (
    <>
      <path d="M12 8v5M12 16.5v.5" />
      <path d="M10.3 4.3 3 17a2 2 0 0 0 1.7 3h14.6A2 2 0 0 0 21 17L13.7 4.3a2 2 0 0 0-3.4 0z" />
    </>
  ),
  strategy: (
    <>
      <path d="M6.5 6.5h11v11h-11z" />
      <path d="M3 9v6M21 9v6" />
    </>
  ),
  workouts: <path d="M4 12h16M8 8v8M16 8v8" />,
};

function Icon({ name }: { name: keyof typeof ICON_PATHS }) {
  return <svg viewBox="0 0 24 24">{ICON_PATHS[name]}</svg>;
}

/* ─── Category map for phase_plan items ─── */
const CAT: Record<string, [string, string]> = {
  strength: ["p-str", "Strength"],
  cardio: ["p-car", "Cardio"],
  nutrition: ["p-nut", "Nutrition"],
  hydration: ["p-hyd", "Hydration"],
  recovery: ["p-rec", "Recovery"],
};

/* ─── Individual block renderers ─── */

function Marker({ m }: { m: ChatMarker }) {
  return (
    <div className="marker">
      <span className="mk-dot" />
      <span className="mk-name">
        <InlineText text={m.name} />
        {m.note ? <em>{m.note}</em> : null}
      </span>
      <span className="mk-val">{m.value}</span>
    </div>
  );
}

function IntroBlock({ block }: { block: ChatIntroBlock }) {
  return (
    <div className="intro">
      <InlineText text={block.text} />
    </div>
  );
}

function SectionBlock({ block }: { block: ChatSectionBlock }) {
  return <div className="section-eyebrow">{block.label}</div>;
}

function LabSnapshotBlock({ block }: { block: ChatLabSnapshotBlock }) {
  const strengths = block.strengths || [];
  const watch = block.watch || [];
  const hasStrengths = strengths.length > 0;
  const hasWatch = watch.length > 0;

  // Nothing to show — skip the whole card rather than render an empty panel.
  if (!hasStrengths && !hasWatch) return null;

  // Drop whichever column is empty; a lone column spans the full width.
  const single = !(hasStrengths && hasWatch);

  return (
    <div className="mod">
      <div className="mod-head">
        <span className="mod-eyebrow">{block.eyebrow || "Signal Read"}</span>
        <span className="mod-title">{block.title || "Lab Snapshot"}</span>
        {block.tag ? <span className="mod-tag">{block.tag}</span> : null}
      </div>
      <div className={`snap${single ? " single" : ""}`}>
        {hasStrengths && (
          <div className="snap-col pos">
            <div className="col-label">
              <span className="ic">
                <Icon name="check" />
              </span>
              <span className="t">Strengths</span>
            </div>
            {strengths.map((m, i) => (
              <Marker key={`s${i}`} m={m} />
            ))}
          </div>
        )}
        {hasWatch && (
          <div className="snap-col watch">
            <div className="col-label">
              <span className="ic">
                <Icon name="warn" />
              </span>
              <span className="t">{block.watchLabel || "Areas to Address"}</span>
            </div>
            {watch.map((m, i) => (
              <Marker key={`w${i}`} m={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PhasePlanBlock({ block }: { block: ChatPhasePlanBlock }) {
  return (
    <div className="mod">
      <div className="mod-head">
        <span className="mod-eyebrow">{block.eyebrow || "Protocol"}</span>
        <span className="mod-title">{block.title || "Optimization Plan"}</span>
        {block.tag ? <span className="mod-tag">{block.tag}</span> : null}
      </div>
      <div className="plan">
        <div className="spine">
          {(block.phases || []).map((p, pi) => (
            <div className={`phase${p.retest ? " retest" : ""}`} key={`p${pi}`}>
              <div className="node">{p.num}</div>
              <div className="ph-head">
                <span className="wk">{p.weeks}</span>
                <span className="ph-name">
                  <InlineText text={p.name} />
                </span>
              </div>
              <div className="ph-goal">
                <InlineText text={p.goal} />
              </div>
              <div className="rows">
                {(p.items || []).map((it, ii) => {
                  const c = CAT[it.cat] || ["p-str", it.cat || ""];
                  return (
                    <div className="line" key={`i${ii}`}>
                      <span className={`pill ${c[0]}`}>
                        <span className="pd" />
                        {c[1]}
                      </span>
                      <span className="line-txt">
                        {it.freq ? (
                          <>
                            <span className="freq">{it.freq}</span>
                            {" — "}
                          </>
                        ) : null}
                        <InlineText text={it.text} />
                        {it.sub ? (
                          <span className="sub">
                            <InlineText text={it.sub} />
                          </span>
                        ) : null}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PriorityBlock({ block }: { block: ChatPriorityBlock }) {
  return (
    <div className="pcard">
      <div className="p-head">
        <div className="pnum">{block.num}</div>
        <div className="p-title">
          <InlineText text={block.title} />
        </div>
        {block.driver ? (
          <div className="driver">
            {(block.driver.markers || []).map((d, i) => (
              <React.Fragment key={`d${i}`}>
                {i > 0 ? " " : null}
                {d.label} <span className="dv">{d.value}</span>
              </React.Fragment>
            ))}
            {block.driver.note ? ` ${block.driver.note}` : null}
          </div>
        ) : null}
      </div>
      <div className="p-body">
        <div className="gym-wrap">
          <div className="sub-label">
            <Icon name="strategy" />
            {block.strategyLabel || "Gym Strategy"}
          </div>
          {(block.strategy || []).map((s, i) => {
            const warn = s.status === "warn";
            return (
              <div className={`crow${warn ? " warn-row" : ""}`} key={`c${i}`}>
                <span className={`ci ${warn ? "warn" : "ok"}`}>
                  <Icon name={warn ? "warn" : "check"} />
                </span>
                <span className="ctxt">
                  <InlineText text={s.text} />
                </span>
              </div>
            );
          })}
        </div>
        <div className="sub-label">
          <Icon name="workouts" />
          Workouts
        </div>
        <div className="wo-list">
          {(block.workouts || []).map((w, i) => {
            const kind = w.badge && w.badge.kind === "label" ? "lbl" : "freq";
            return (
              <div className="wrow" key={`w${i}`}>
                <span className={`wbadge ${kind}`}>{w.badge ? w.badge.value : ""}</span>
                <span className="wtxt">
                  <InlineText text={w.text} />
                  {w.sub ? <span className="ex">{w.sub}</span> : null}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CalloutBlock({ block }: { block: ChatCalloutBlock }) {
  return (
    <div className="closer">
      <Icon name="spark" />
      <span>
        <InlineText text={block.text} />
      </span>
    </div>
  );
}

function ProductRecBlock({ block }: { block: ChatProductRecBlock }) {
  const items = block.items || [];
  // No items → skip the whole group rather than render an empty card.
  if (items.length === 0) return null;

  return (
    <div className="rec">
      {block.label ? <div className="rec-cat">{block.label}</div> : null}
      <div className="rec-items">
        {items.map((it, i) => (
          <div className="rec-card" key={`r${i}`}>
            <div className="rec-head">
              <span className="rec-name">
                <InlineText text={it.name} />
              </span>
              {it.dose ? <span className="rec-dose">{it.dose}</span> : null}
            </div>
            {it.rationale ? (
              <div className="rec-why">
                <InlineText text={it.rationale} />
              </div>
            ) : null}
            {it.caution ? (
              <div className="rec-caution">
                <span className="rec-caution-ic">
                  <Icon name="warn" />
                </span>
                <span>
                  <InlineText text={it.caution} />
                </span>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function MarkdownBlock({ block }: { block: ChatMarkdownBlock }) {
  return (
    <div className="intro md-block">
      <ReactMarkdown>{block.text || ""}</ReactMarkdown>
    </div>
  );
}

function renderBlock(block: ResponseBlock, key: React.Key): React.ReactNode {
  switch (block.type) {
    case "intro":
      return <IntroBlock key={key} block={block} />;
    case "section":
      return <SectionBlock key={key} block={block} />;
    case "lab_snapshot":
      return <LabSnapshotBlock key={key} block={block} />;
    case "phase_plan":
      return <PhasePlanBlock key={key} block={block} />;
    case "priority":
      return <PriorityBlock key={key} block={block} />;
    case "callout":
      return <CalloutBlock key={key} block={block} />;
    case "product_rec":
      return <ProductRecBlock key={key} block={block} />;
    case "markdown":
      return <MarkdownBlock key={key} block={block} />;
    default:
      // Forward compatibility (doc §4): render nothing for unknown types
      // rather than crashing.
      return null;
  }
}

/** Renders an ordered list of structured chat blocks. */
export default function ChatBlocks({ blocks }: { blocks: ResponseBlock[] }) {
  return <>{(blocks || []).map((b, i) => renderBlock(b, `blk-${i}`))}</>;
}
