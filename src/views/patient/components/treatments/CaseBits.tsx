import { CASE_STEPS, STATUS_META, type CaseStatus, type TreatmentCase } from "@/views/patient/utils/treatmentCases";

/** Small shared pieces of the "My cases" design: status badge, segmented progress, initials avatar. */

const TONE: Record<"brand" | "warn" | "ok", { bg: string; fg: string; dot: string }> = {
  brand: { bg: "var(--apex-accent-soft)", fg: "var(--apex-accent-bright)", dot: "var(--apex-accent-bright)" },
  warn: { bg: "var(--bord-soft)", fg: "var(--bord)", dot: "var(--bord)" },
  ok: { bg: "var(--opt-soft)", fg: "var(--opt-d)", dot: "var(--opt)" },
};

export function StatusBadge({ status }: { status: CaseStatus }) {
  const meta = STATUS_META[status];
  const t = TONE[meta.tone];
  return (
    <span
      className="inline-flex items-center gap-[5px] whitespace-nowrap rounded-full px-2 py-1 font-mono text-[11px] font-semibold leading-[1.2]"
      style={{ background: t.bg, color: t.fg }}
    >
      <span className="h-[7px] w-[7px] rounded-full" style={{ background: t.dot }} />
      {meta.label}
    </span>
  );
}

/** The design's 4 thin segments with "Step N of 4 · current step". */
export function ProgressSegments({ c }: { c: TreatmentCase }) {
  const current = c.step >= c.steps.length ? "Complete" : c.steps[c.step];
  return (
    <div>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${c.steps.length}, 1fr)` }}>
        {c.steps.map((s, i) => (
          <i
            key={s}
            className="block h-[5px] rounded-[9px]"
            style={{
              background: i < c.step ? "var(--opt)" : i === c.step ? "var(--apex-accent-bright)" : "var(--surface-2)",
            }}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between gap-2 text-[12px]">
        <span className="apex-eyebrow" style={{ fontSize: 10.5, letterSpacing: "0.14em" }}>
          Step {Math.min(c.step + 1, c.steps.length)} of {c.steps.length}
        </span>
        <b className="font-bold text-foreground">{current}</b>
      </div>
    </div>
  );
}

export function Initials({ name, size = 30 }: { name: string; size?: number }) {
  const initials = name
    .replace(/,.*$/, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full bg-[var(--surface-2)] font-semibold text-foreground"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials || "•"}
    </span>
  );
}

export { CASE_STEPS };
