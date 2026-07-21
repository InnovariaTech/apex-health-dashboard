import { Link } from "react-router-dom";
import { ArrowDown, ArrowRight, ArrowUp, Sparkles } from "lucide-react";
import type { BiologicalAge } from "@/types/ai-agent/ai_summary_types";
import { createPageUrl } from "@/utils";
import { BodyModel3D } from "@/components/hologram";
import BioAgeScale from "./BioAgeScale";
import { STATIC_BIO_AGE } from "./staticBioAge";

/**
 * Biological age card matching the mockup's `.bio-age-card`.
 *
 * Spec sources (`New Ui/2 Health Analysis/.../css/styles.css`):
 *   - .bio-age-card: padding 22px 26px 18px, gap 16
 *   - .bio-head .label: serif 24/700/accent-dark, bottom-border
 *   - .bio-num: mono 64/700/-0.04em
 *   - .bio-num .unit: 16px / ink-3 / weight 500
 *   - .bio-delta-large: opt-soft bg, opt color, mono 11.5/700, padding 5/11
 *   - .bio-foot: mono 10.5px / ink-3, top border, trend-vals colored ink
 *
 * Figures come from `STATIC_BIO_AGE`, not the summaries API — see that module.
 */
export default function AnalysisBioAgeCard() {
  const bioAge = STATIC_BIO_AGE;

  const hasAnalysis = true;
  const available = bioAge.available === true;

  return (
    <div
      className="apex-card flex flex-col gap-4 h-full"
      style={{ padding: "22px 26px 18px" }}
    >
      {/* bio-head */}
      <div className="flex items-baseline justify-between gap-3 pb-3.5 border-b border-[var(--line)]">
        <h3 className="apex-card-title">Biological age</h3>
        {available && bioAge && typeof bioAge.deltaYears === "number" && bioAge.deltaYears !== 0 && (
          <HeadDelta deltaYears={bioAge.deltaYears} />
        )}
      </div>

      {available && bioAge ? (
        <BioAgeBody bioAge={bioAge} />
      ) : (
        <EmptyBioAge hasAnalysis={hasAnalysis} reason={bioAge?.reason ?? null} />
      )}
    </div>
  );
}

// ─── Populated body ──────────────────────────────────────────────────────

function BioAgeBody({ bioAge }: { bioAge: BiologicalAge }) {
  const bio = bioAge.biologicalYears;
  const chrono = bioAge.chronologicalYears;
  const delta = bioAge.deltaYears ?? null;

  return (
    <div className="flex flex-col gap-[18px] flex-1">
      {/* Top row: bio number block on the left, 3D hologram on the right */}
      <div className="grid grid-cols-[1fr_auto] gap-4 items-center">
        <div className="flex flex-col gap-2 items-start min-w-0">
          <div
            className="font-mono tabular-nums leading-none text-ink inline-flex items-baseline gap-1.5"
            style={{ fontSize: 64, fontWeight: 700, letterSpacing: "-0.04em" }}
          >
            {bio !== null ? formatYears(bio) : "—"}
            <span
              className="font-sans text-ink-3"
              style={{ fontSize: 16, fontWeight: 500, letterSpacing: 0 }}
            >
              yrs
            </span>
          </div>
          {delta !== null && delta < 0 && (
            <span
              className="font-mono inline-flex items-center gap-1.5 rounded-full"
              style={{
                background: "var(--opt-soft)",
                color: "var(--opt)",
                padding: "5px 11px",
                fontSize: 11.5,
                fontWeight: 700,
                letterSpacing: "0.02em",
              }}
            >
              <ArrowDown className="w-3 h-3" strokeWidth={2.4} />
              {formatYears(Math.abs(delta))} yrs younger
            </span>
          )}
          {delta !== null && delta > 0 && (
            <span
              className="font-mono inline-flex items-center gap-1.5 rounded-full"
              style={{
                background: "var(--bord-soft)",
                color: "var(--bord)",
                padding: "5px 11px",
                fontSize: 11.5,
                fontWeight: 700,
                letterSpacing: "0.02em",
              }}
            >
              <ArrowUp className="w-3 h-3" strokeWidth={2.4} />
              {formatYears(delta)} yrs older
            </span>
          )}
          {chrono !== null && (
            <p
              className="font-mono text-ink-3"
              style={{ fontSize: 11, letterSpacing: "0.04em", marginTop: 0 }}
            >
              vs chronological {chrono} yrs
            </p>
          )}
        </div>
        <div
          className="relative w-[336px] h-[480px] shrink-0 -my-8"
          aria-hidden="true"
        >
          <BodyModel3D
            scanState="complete"
            color="#E11816"
            autoRotate
            autoRotateSpeed={1.2}
            className="absolute inset-0"
          />
        </div>
      </div>

      {/* Scale */}
      {bio !== null && chrono !== null && (
        <BioAgeScale bio={bio} chrono={chrono} />
      )}

      {/* Footer */}
      <div
        className="pt-3 border-t border-[var(--line)] flex justify-between items-center flex-wrap gap-2 font-mono"
        style={{ fontSize: 10.5, color: "var(--ink-3)", letterSpacing: "0.04em" }}
      >
        {bioAge.history.length > 1 ? (
          <span
            className="inline-flex items-center gap-1.5"
            style={{ color: "var(--ink)", fontWeight: 600 }}
          >
            {bioAge.history.map((h, i) => (
              <span key={i} className="inline-flex items-center gap-1.5">
                {h.biologicalYears.toFixed(1)}
                {i < bioAge.history.length - 1 && (
                  <span style={{ color: "var(--opt)", margin: "0 2px" }}>→</span>
                )}
              </span>
            ))}
          </span>
        ) : (
          <span />
        )}
        <span>
          {bioAge.method ?? "PhenoAge"}
          {typeof bioAge.biomarkerCount === "number"
            ? ` · ${bioAge.biomarkerCount} biomarkers`
            : ""}
        </span>
      </div>

      {/* Recommended for you — mockup §.reco-summary inside .bio-age-card */}
      <RecommendedForYou />
    </div>
  );
}

// ─── Recommended for you ────────────────────────────────────────────────

interface SupplementPick {
  name: string;
  image: string;
  tag: string;
  price: string;
}

const SUPP_PICKS: SupplementPick[] = [
  {
    name: "RED Superfood",
    image: "/genetics/products/red-superfood.png",
    tag: "Immune · Gut · Antioxidant defense",
    price: "$39.99",
  },
  {
    name: "Probiotic — 40B CFU",
    image: "/genetics/products/probiotic-40b.png",
    tag: "Digestive · Microbiome · Immune",
    price: "$34.99",
  },
  {
    name: "Vitamin K2 + D3",
    image: "/genetics/products/vitamin-k2-d3.png",
    tag: "Bones · Cardiovascular · Immune",
    price: "$29.99",
  },
];

const PEPTIDE_PICK: SupplementPick = {
  name: "Wolverine Stack",
  image: "/genetics/products/wolverine-stack.png",
  tag: "BPC-157 + TB-500 · Repair · Recovery",
  price: "$249",
};

const ALSO_STRONG = ["Thymosin α-1", "Semax", "Epitalon", "GHK-Cu"];

function RecommendedForYou() {
  return (
    <div
      className="border-t border-[var(--line)] flex flex-col"
      style={{ paddingTop: 16, gap: 16 }}
    >
      <div className="flex items-baseline justify-between gap-2.5">
        <span
          className="font-mono uppercase"
          style={{
            fontSize: 11,
            letterSpacing: "0.16em",
            color: "var(--apex-accent-bright)",
            fontWeight: 700,
          }}
        >
          Recommended for you
        </span>
        <span style={{ fontSize: 11, color: "var(--ink-3)" }}>
          From your genetic gauges
        </span>
      </div>

      <RecoGroup label="Top 3 supplements">
        <ul className="flex flex-col gap-[7px] m-0 p-0 list-none">
          {SUPP_PICKS.map((p) => (
            <RecoItem key={p.name} pick={p} />
          ))}
        </ul>
      </RecoGroup>

      <RecoGroup label="Recommended peptide">
        <ul className="flex flex-col gap-[7px] m-0 p-0 list-none">
          <RecoItem pick={PEPTIDE_PICK} variant="peptide" />
        </ul>
      </RecoGroup>

      <p
        style={{
          fontSize: 11,
          color: "var(--ink-3)",
          lineHeight: 1.55,
          margin: 0,
        }}
      >
        <strong style={{ color: "var(--ink-2)", fontWeight: 600 }}>
          Also strong in your report:
        </strong>{" "}
        {ALSO_STRONG.join(" · ")}
      </p>
    </div>
  );
}

function RecoGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        className="font-mono uppercase"
        style={{
          fontSize: 9.5,
          letterSpacing: "0.14em",
          color: "var(--ink-3)",
          fontWeight: 700,
          marginBottom: 9,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function RecoItem({
  pick,
  variant,
}: {
  pick: SupplementPick;
  variant?: "peptide";
}) {
  const isPeptide = variant === "peptide";
  return (
    <li
      className="grid items-center transition-colors"
      style={{
        gridTemplateColumns: "52px 1fr auto",
        gap: 12,
        padding: "10px 12px",
        border: `1px solid ${isPeptide ? "rgba(225, 24, 22,0.25)" : "var(--line)"}`,
        background: isPeptide ? "rgba(225, 24, 22,0.035)" : "transparent",
        borderRadius: 10,
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          background: "var(--surface-2)",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <img
          src={pick.image}
          alt=""
          loading="lazy"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
          }}
        />
      </div>
      <div className="min-w-0">
        <div
          style={{
            fontFamily: "var(--font-serif, ui-serif, Georgia, serif)",
            fontWeight: 700,
            fontSize: 13,
            color: "var(--apex-accent-dark)",
            lineHeight: 1.25,
          }}
        >
          {pick.name}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--ink-3)",
            marginTop: 1,
          }}
        >
          {pick.tag}
        </div>
      </div>
      <span
        className="font-mono"
        style={{
          fontWeight: 700,
          fontSize: 13,
          color: "var(--ink)",
          whiteSpace: "nowrap",
        }}
      >
        {pick.price}
      </span>
    </li>
  );
}

function HeadDelta({ deltaYears }: { deltaYears: number }) {
  if (deltaYears === 0) return null;
  const positive = deltaYears > 0;
  return (
    <div
      className="font-mono inline-flex items-center gap-1.5"
      style={{
        fontSize: 11.5,
        fontWeight: 600,
        letterSpacing: "0.02em",
        color: positive ? "var(--bord)" : "var(--opt)",
      }}
    >
      {positive ? (
        <ArrowUp className="w-3 h-3" strokeWidth={2.4} />
      ) : (
        <ArrowDown className="w-3 h-3" strokeWidth={2.4} />
      )}
      {formatYears(Math.abs(deltaYears))} yrs
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────

function EmptyBioAge({
  hasAnalysis,
  reason,
}: {
  hasAnalysis: boolean;
  reason: string | null;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
      <div
        className="w-16 h-16 rounded-full grid place-items-center mb-5"
        style={{ background: "var(--opt-soft)", color: "var(--opt)" }}
      >
        <Sparkles className="w-7 h-7" strokeWidth={1.6} />
      </div>
      <p className="text-[17px] font-bold text-foreground">
        {hasAnalysis ? "Bio age not yet calibrated" : "No AI analysis yet"}
      </p>
      <p className="text-[13.5px] text-ink-2 mt-2 max-w-[44ch]">
        {reason ??
          (hasAnalysis
            ? "Your bio age will appear here once your panel includes the longevity biomarkers (Lp(a), ApoB, HbA1c, hsCRP and others)."
            : "Run your first AI Health Analysis to compute your biological age across kidney, liver, lipid, and inflammation markers.")}
      </p>
      <Link
        to={createPageUrl("HealthAnalysis")}
        className="mt-6 inline-flex items-center gap-1.5 font-semibold text-[13.5px]"
        style={{ color: "var(--apex-accent-bright)" }}
      >
        {hasAnalysis ? "View latest analysis" : "Run AI Health Analysis"}
        <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.4} />
      </Link>
    </div>
  );
}

function formatYears(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}
