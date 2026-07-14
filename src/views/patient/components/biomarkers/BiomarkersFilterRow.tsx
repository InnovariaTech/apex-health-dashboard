import { formatCategoryLabel } from "@/views/patient/utils/biomarkerHelpers";

/**
 * Category pills + "Compare to last quarter" toggle.
 *
 * Mockup spec:
 *   .pill: 14.5 / 600 / 10px 18px / border 1.5px ink / bg ink / color white
 *   .pill.active: bg+border = accent, white text
 *   .pill .ct: mono 12 / opacity .8
 *   .toggle-switch: 32x18 pill (line-2 bg, accent when on)
 */
export default function BiomarkersFilterRow({
  categories,
  totalCount,
  activeCat,
  compareMode,
  onCatChange,
  onCompareToggle,
}: {
  categories: Array<[string, number]>;
  totalCount: number;
  activeCat: string;
  compareMode: boolean;
  onCatChange: (cat: string) => void;
  onCompareToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
      <div className="flex gap-2 flex-wrap">
        <CategoryPill
          label="All"
          count={totalCount}
          active={activeCat === "all"}
          onClick={() => onCatChange("all")}
        />
        {categories.map(([cat, count]) => (
          <CategoryPill
            key={cat}
            label={formatCategoryLabel(cat)}
            count={count}
            active={activeCat === cat}
            onClick={() => onCatChange(cat)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onCompareToggle}
        className="inline-flex items-center gap-2 cursor-pointer select-none"
        style={{ fontSize: 12, color: "var(--ink-2)" }}
        aria-pressed={compareMode}
      >
        <span>Compare to last quarter</span>
        <ToggleSwitch on={compareMode} />
      </button>
    </div>
  );
}

function CategoryPill({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="transition-all rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      style={{
        fontSize: 14.5,
        fontWeight: 600,
        padding: "10px 18px",
        border: "1.5px solid",
        borderColor: active ? "var(--apex-accent-bright)" : "var(--ink)",
        background: active ? "var(--apex-accent-bright)" : "var(--ink)",
        color: "#FFFFFF",
        letterSpacing: "-0.005em",
        boxShadow: active ? "0 2px 8px rgba(225, 24, 22, 0.25)" : undefined,
      }}
    >
      {label}
      <span
        className="font-mono"
        style={{ fontSize: 12, marginLeft: 6, opacity: 0.8, fontWeight: 500 }}
      >
        {count}
      </span>
    </button>
  );
}

function ToggleSwitch({ on }: { on: boolean }) {
  return (
    <span
      className="relative inline-block rounded-full transition-colors"
      style={{
        width: 32,
        height: 18,
        background: on ? "var(--apex-accent-bright)" : "var(--line-2)",
      }}
    >
      <span
        className="absolute rounded-full bg-white transition-transform"
        style={{
          width: 14,
          height: 14,
          top: 2,
          left: 2,
          transform: on ? "translateX(14px)" : "translateX(0)",
          boxShadow: "0 1px 2px rgba(0,0,0,0.18)",
        }}
      />
    </span>
  );
}
