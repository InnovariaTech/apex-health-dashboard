// @ts-nocheck
import { useMemo, useState, useEffect } from "react";
import {
  Search,
  Bell,
  Settings,
  Download,
  ChevronDown,
  AlertTriangle,
  Clock,
  Check,
  ShoppingCart,
  X,
  Info,
  Calendar as CalendarIcon,
  List,
  LayoutGrid,
  BarChart3,
  Activity,
} from "lucide-react";
import {
  ATT,
  MOD,
  OPT,
  THEME_MAP,
  THEME_LABEL,
  EXPLAIN,
  type MarkerRow,
  type ToneKey,
} from "@/views/patient/data/genetics/markers";

/**
 * Genetics — verbatim port of the `New Ui/4 Genetics/apex-md-genetics`
 * mockup. There is no Trainerize / Apex backend for genetics yet, so this
 * page renders the same demo dataset the mockup ships with. Replace the
 * `markers.ts` import once a real API exists.
 */

const COLLAPSED = 14;
const MOCKUP = {
  bg: "#fbfbfa",
  surface: "#ffffff",
  ink: "#15151a",
  muted: "#6b7280",
  faint: "#9aa0a8",
  line: "#ececeb",
  lineStrong: "#e2e2e0",
  red: "#e5232a",
  redSoft: "#fdecec",
  green: "#2f9e54",
  greenSoft: "#e9f6ee",
  amber: "#dd941f",
  amberSoft: "#fcf2e0",
  att: "#e5484d",
  attSoft: "#fdebeb",
  blackPill: "#141417",
  shadowCard: "0 2px 14px rgba(20,20,30,.05)",
} as const;

const TONES: Record<ToneKey, { bg: string; border: string; fg: string; badgeBg: string; badgeFg: string; label: string; instances: number }> = {
  att: { bg: "#fef6f6", border: "#f7dada", fg: MOCKUP.att, badgeBg: MOCKUP.attSoft, badgeFg: "#c6383d", label: "Needs Attention", instances: 56 },
  mod: { bg: "#fefaf2", border: "#f3e6cc", fg: "#c98212", badgeBg: MOCKUP.amberSoft, badgeFg: "#bb7e14", label: "Moderate", instances: 226 },
  opt: { bg: "#f4faf6", border: "#d8ecdf", fg: "#258049", badgeBg: MOCKUP.greenSoft, badgeFg: "#218045", label: "Optimal", instances: 410 },
};

// Mockup-displayed counts (mockup itself hard-codes 244 Optimal even though
// its OPT array has 243 entries — a known off-by-one in the demo). Section
// rows still render from the actual arrays, so the inline (N) counts use
// the real array length.
const STATS = {
  att: { count: 32, pct: 8, instances: 56 },
  mod: { count: 144, pct: 34, instances: 226 },
  opt: { count: 244, pct: 58, instances: 410 },
  other: { count: 2, pct: 0 },
};
const TOTAL_MARKERS = 422;

// ─── Page ────────────────────────────────────────────────────────────────

export default function Genetics() {
  const [view, setView] = useState<"summary" | "panel">("summary");
  const [query, setQuery] = useState("");
  const [activeTheme, setActiveTheme] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<ToneKey, boolean>>({
    att: false,
    mod: false,
    opt: false,
  });
  const [opened, setOpened] = useState<{ row: MarkerRow; tone: ToneKey } | null>(null);

  // Theme filter pre-counts (Needs Attention only).
  const themeCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const row of ATT) {
      const t = THEME_MAP[row[0]];
      if (!t) continue;
      map[t] = (map[t] ?? 0) + 1;
    }
    return map;
  }, []);

  const q = query.trim().toLowerCase();

  const matchesQuery = (row: MarkerRow) => {
    if (!q) return true;
    return (
      row[0].toLowerCase().includes(q) ||
      row[1].toLowerCase().includes(q) ||
      row[2].toLowerCase().includes(q)
    );
  };

  const filteredAtt = useMemo(() => {
    if (activeTheme) {
      return ATT.filter((r) => THEME_MAP[r[0]] === activeTheme && matchesQuery(r));
    }
    return ATT.filter(matchesQuery);
  }, [q, activeTheme]);
  const filteredMod = useMemo(() => MOD.filter(matchesQuery), [q]);
  const filteredOpt = useMemo(() => OPT.filter(matchesQuery), [q]);

  return (
    <div
      style={{
        background: MOCKUP.bg,
        color: MOCKUP.ink,
        fontFamily: "Inter, system-ui, sans-serif",
        lineHeight: 1.5,
      }}
      className="min-h-screen"
    >
      <Topbar query={query} onQuery={setQuery} />

      <div
        style={{
          padding: "36px 40px 60px",
          maxWidth: 1480,
          width: "100%",
          margin: "0 auto",
        }}
      >
        <PageHead />

        <ViewToggle value={view} onChange={setView} />
        <Banner />

        <StatCards />

        <ChartsRow />

        <FindingsSummary />

        {activeTheme && (
          <ThemeFilterBar
            theme={activeTheme}
            count={themeCounts[activeTheme] ?? 0}
            onClear={() => setActiveTheme(null)}
          />
        )}

        <ResultSection
          tone="att"
          rows={filteredAtt}
          expanded={expanded.att}
          onToggleExpand={() => setExpanded((p) => ({ ...p, att: !p.att }))}
          onOpen={(row) => setOpened({ row, tone: "att" })}
          activeTheme={activeTheme}
        />
        <ResultSection
          tone="mod"
          rows={filteredMod}
          expanded={expanded.mod}
          onToggleExpand={() => setExpanded((p) => ({ ...p, mod: !p.mod }))}
          onOpen={(row) => setOpened({ row, tone: "mod" })}
          activeTheme={activeTheme}
          hiddenByTheme={!!activeTheme}
        />
        <ResultSection
          tone="opt"
          rows={filteredOpt}
          expanded={expanded.opt}
          onToggleExpand={() => setExpanded((p) => ({ ...p, opt: !p.opt }))}
          onOpen={(row) => setOpened({ row, tone: "opt" })}
          activeTheme={activeTheme}
          hiddenByTheme={!!activeTheme}
        />

        <p
          className="mt-7 text-center"
          style={{ fontSize: 13, color: MOCKUP.faint }}
        >
          Showing scored results from the Lifestyle [Demo Library] panel set ·
          APEX Genetics
        </p>
      </div>

      {opened && (
        <MarkerModal
          row={opened.row}
          tone={opened.tone}
          onClose={() => setOpened(null)}
        />
      )}
    </div>
  );
}

// ─── Topbar ──────────────────────────────────────────────────────────────

function Topbar({
  query,
  onQuery,
}: {
  query: string;
  onQuery: (q: string) => void;
}) {
  return (
    <header
      className="flex items-center sticky top-0 z-20"
      style={{
        gap: 18,
        padding: "18px 40px",
        borderBottom: `1px solid ${MOCKUP.line}`,
        background: MOCKUP.surface,
      }}
    >
      <div
        className="flex items-center"
        style={{
          gap: 9,
          fontSize: 14,
          fontWeight: 600,
          color: MOCKUP.faint,
          whiteSpace: "nowrap",
        }}
      >
        <span>Health</span>
        <span style={{ color: "#d6d6d4" }}>›</span>
        <span>Genetics</span>
        <span style={{ color: "#d6d6d4" }}>›</span>
        <span style={{ color: MOCKUP.ink }}>Summary</span>
      </div>

      <div className="flex-1 relative" style={{ maxWidth: 560, margin: "0 auto" }}>
        <Search
          className="absolute"
          style={{
            left: 15,
            top: "50%",
            transform: "translateY(-50%)",
            width: 17,
            height: 17,
            color: MOCKUP.faint,
            strokeWidth: 1.8,
          }}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search markers, panels, statuses…"
          className="w-full focus:outline-none"
          style={{
            padding: "11px 14px 11px 42px",
            border: `1px solid ${MOCKUP.lineStrong}`,
            borderRadius: 12,
            background: "#fcfcfb",
            fontSize: 14,
            color: MOCKUP.ink,
          }}
        />
      </div>

      <div className="flex" style={{ gap: 10 }}>
        <IconBtn aria-label="Notifications">
          <Bell className="w-4 h-4" strokeWidth={1.7} />
        </IconBtn>
        <IconBtn aria-label="Settings">
          <Settings className="w-4 h-4" strokeWidth={1.7} />
        </IconBtn>
      </div>
    </header>
  );
}

function IconBtn({
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className="grid place-items-center cursor-pointer"
      style={{
        width: 42,
        height: 42,
        border: `1px solid ${MOCKUP.lineStrong}`,
        borderRadius: 11,
        background: "#fff",
        color: "#54545c",
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

// ─── Page head ───────────────────────────────────────────────────────────

function PageHead() {
  return (
    <div
      className="flex flex-wrap items-start"
      style={{ justifyContent: "space-between", gap: 24 }}
    >
      <div>
        <h1
          style={{
            fontFamily: "Archivo, Inter, sans-serif",
            fontWeight: 900,
            fontSize: 54,
            letterSpacing: "-0.04em",
            lineHeight: 0.96,
            color: MOCKUP.ink,
          }}
        >
          Genetics{" "}
          <em
            style={{
              fontFamily: "Archivo, Inter, sans-serif",
              fontWeight: 800,
              fontStyle: "italic",
              color: MOCKUP.red,
              letterSpacing: "-0.03em",
            }}
          >
            summary
          </em>
        </h1>
        <div
          className="flex items-center flex-wrap"
          style={{
            gap: "0 8px",
            marginTop: 16,
            color: MOCKUP.muted,
            fontSize: 15,
          }}
        >
          <span>Result scores across all panels</span>
          <Dot />
          <span>
            <b style={{ color: "#3a3a42", fontWeight: 600 }}>422</b> markers
            analyzed
          </span>
          <Dot />
          <span>Lifestyle</span>
          <Dot />
          <span>Synced from APEX Genetics</span>
        </div>
      </div>
      <button
        type="button"
        onClick={downloadGeneticsReport}
        className="inline-flex items-center cursor-pointer"
        style={{
          gap: 9,
          padding: "11px 20px",
          border: `1px solid ${MOCKUP.lineStrong}`,
          borderRadius: 12,
          background: "#fff",
          fontSize: 14.5,
          fontWeight: 600,
          color: MOCKUP.ink,
        }}
      >
        <Download className="w-4 h-4" strokeWidth={1.8} />
        Export
      </button>
    </div>
  );
}

function Dot() {
  return <span style={{ color: "#d3d3d1" }}>•</span>;
}

const GENETICS_REPORT_URL =
  "/genetics/report/Lifestyle-Genetics-Report-Recommendations.pdf";

function downloadGeneticsReport() {
  const a = document.createElement("a");
  a.href = GENETICS_REPORT_URL;
  a.download = "Lifestyle-Genetics-Report-Recommendations.pdf";
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ─── View toggle ─────────────────────────────────────────────────────────

function ViewToggle({
  value,
  onChange,
}: {
  value: "summary" | "panel";
  onChange: (v: "summary" | "panel") => void;
}) {
  return (
    <div
      className="inline-flex"
      style={{
        gap: 4,
        background: "#f2f2f1",
        border: `1px solid ${MOCKUP.line}`,
        borderRadius: 13,
        padding: 5,
        marginTop: 26,
      }}
    >
      <ToggleBtn
        active={value === "summary"}
        onClick={() => onChange("summary")}
        icon={<List className="w-3.5 h-3.5" strokeWidth={1.8} />}
      >
        Summary
      </ToggleBtn>
      <ToggleBtn
        active={value === "panel"}
        onClick={() => onChange("panel")}
        icon={<LayoutGrid className="w-3.5 h-3.5" strokeWidth={1.8} />}
      >
        By panel
      </ToggleBtn>
    </div>
  );
}

function ToggleBtn({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center cursor-pointer"
      style={{
        gap: 8,
        border: "none",
        background: active ? MOCKUP.blackPill : "transparent",
        color: active ? "#fff" : "#71717a",
        padding: "9px 20px",
        borderRadius: 9,
        fontSize: 14,
        fontWeight: 600,
      }}
    >
      {icon}
      {children}
    </button>
  );
}

// ─── Info banner ─────────────────────────────────────────────────────────

function Banner() {
  return (
    <div
      className="flex flex-wrap items-center justify-between"
      style={{
        gap: 16,
        marginTop: 22,
        padding: "17px 22px",
        border: `1px solid ${MOCKUP.line}`,
        borderRadius: 14,
        background: "#fff",
        boxShadow: "0 1px 2px rgba(20,20,30,.04)",
      }}
    >
      <div
        className="flex items-center"
        style={{ gap: 12, color: "#4a4a52", fontSize: 14.5 }}
      >
        <span
          className="grid place-items-center"
          style={{
            width: 21,
            height: 21,
            borderRadius: "50%",
            border: `1.5px solid ${MOCKUP.faint}`,
            color: MOCKUP.faint,
            fontFamily: "Archivo, serif",
            fontSize: 12,
            fontWeight: 700,
            fontStyle: "italic",
          }}
        >
          i
        </span>
        <span>
          Results sync from your{" "}
          <b
            style={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 800,
              color: MOCKUP.ink,
            }}
          >
            APEX <span style={{ color: MOCKUP.red }}>MD</span>
          </b>{" "}
          genetics kit. New panels appear here automatically.
        </span>
      </div>
      <button
        type="button"
        className="inline-flex items-center cursor-pointer"
        style={{
          gap: 9,
          padding: "10px 16px",
          border: `1px solid ${MOCKUP.lineStrong}`,
          borderRadius: 11,
          background: "#fff",
          fontSize: 14,
          fontWeight: 600,
          color: MOCKUP.ink,
        }}
      >
        Lifestyle [Demo Library]
        <ChevronDown className="w-3.5 h-3.5" strokeWidth={1.8} />
      </button>
    </div>
  );
}

// ─── Stat cards ──────────────────────────────────────────────────────────

function StatCards() {
  return (
    <section
      className="grid"
      style={{
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 22,
        marginTop: 24,
      }}
    >
      <StatCard
        tone="att"
        cap={MOCKUP.att}
        label="Needs Attention"
        value={STATS.att.count}
        icon={<AlertTriangle className="w-3.5 h-3.5" strokeWidth={1.9} />}
        pct={STATS.att.pct}
        sub={`of all markers · ${STATS.att.instances} instances`}
      />
      <StatCard
        tone="mod"
        cap={MOCKUP.amber}
        label="Moderate"
        value={STATS.mod.count}
        icon={<Clock className="w-3.5 h-3.5" strokeWidth={1.9} />}
        pct={STATS.mod.pct}
        sub={`worth monitoring · ${STATS.mod.instances} instances`}
      />
      <StatCard
        tone="opt"
        cap={MOCKUP.green}
        label="Optimal"
        value={STATS.opt.count}
        icon={<Check className="w-3.5 h-3.5" strokeWidth={1.9} />}
        pct={STATS.opt.pct}
        sub={`in healthy range · ${STATS.opt.instances} instances`}
      />
    </section>
  );
}

function StatCard({
  tone,
  cap,
  label,
  value,
  icon,
  pct,
  sub,
}: {
  tone: ToneKey;
  cap: string;
  label: string;
  value: number;
  icon: React.ReactNode;
  pct: number;
  sub: string;
}) {
  const pctColor =
    tone === "att" ? MOCKUP.att : tone === "mod" ? MOCKUP.amber : MOCKUP.green;
  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: "#fff",
        border: `1px solid ${MOCKUP.line}`,
        borderRadius: 16,
        padding: "26px 26px 22px",
        boxShadow: MOCKUP.shadowCard,
      }}
    >
      <span
        className="absolute"
        style={{
          top: 0,
          left: 26,
          width: 54,
          height: 5,
          borderRadius: "0 0 4px 4px",
          background: cap,
        }}
      />
      <div
        className="uppercase"
        style={{
          fontSize: 11,
          letterSpacing: "0.13em",
          fontWeight: 600,
          color: MOCKUP.faint,
          marginTop: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "Archivo, sans-serif",
          fontWeight: 800,
          fontSize: 52,
          letterSpacing: "-0.03em",
          lineHeight: 1.05,
          marginTop: 8,
          color: MOCKUP.ink,
        }}
      >
        {value}
      </div>
      <div
        className="flex items-center"
        style={{ gap: 7, marginTop: 8, fontSize: 13.5, color: MOCKUP.muted }}
      >
        <span style={{ color: pctColor }}>{icon}</span>
        <span style={{ fontWeight: 600, color: pctColor }}>{pct}%</span>
        <span>{sub}</span>
      </div>
    </div>
  );
}

// ─── Charts row ──────────────────────────────────────────────────────────

function ChartsRow() {
  return (
    <section
      className="grid"
      style={{
        gridTemplateColumns: "1fr 1fr",
        gap: 22,
        marginTop: 22,
      }}
    >
      <DonutCard />
      <BarsCard />
    </section>
  );
}

function DonutCard() {
  return (
    <div style={cardStyle()}>
      <CardHead
        title="Status distribution"
        icon={<Activity className="w-4 h-4" strokeWidth={1.9} />}
      />
      <div className="flex items-center flex-wrap" style={{ gap: 26 }}>
        <DonutSvg />
        <div
          className="flex flex-col"
          style={{ gap: 13, flex: 1, minWidth: 170 }}
        >
          <LegendRow color={MOCKUP.att} name="Needs Attention" value={`${STATS.att.count} · ${STATS.att.pct}%`} />
          <LegendRow color={MOCKUP.amber} name="Moderate" value={`${STATS.mod.count} · ${STATS.mod.pct}%`} />
          <LegendRow color={MOCKUP.green} name="Optimal" value={`${STATS.opt.count} · ${STATS.opt.pct}%`} />
          <LegendRow color="#aeb3bb" name="Other" value="2 · 0%" />
        </div>
      </div>
    </div>
  );
}

function LegendRow({
  color,
  name,
  value,
}: {
  color: string;
  name: string;
  value: string;
}) {
  return (
    <div className="flex items-center" style={{ gap: 10, fontSize: 14.5 }}>
      <span
        style={{
          width: 11,
          height: 11,
          borderRadius: 3,
          background: color,
          flexShrink: 0,
        }}
      />
      <span style={{ fontWeight: 500, color: "#34343c" }}>{name}</span>
      <span
        style={{
          marginLeft: "auto",
          color: MOCKUP.faint,
          fontSize: 13.5,
          fontWeight: 500,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function DonutSvg() {
  const segments: Array<[string, number]> = [
    [MOCKUP.att, 8],
    [MOCKUP.amber, 34],
    [MOCKUP.green, 58],
    ["#aeb3bb", 0.5],
  ];
  const cx = 21;
  const cy = 21;
  const r = 15.9155;
  const C = 2 * Math.PI * r;
  let off = 0;
  const parts: JSX.Element[] = [
    <circle
      key="bg"
      cx={cx}
      cy={cy}
      r={r}
      fill="none"
      stroke="#f1f1f0"
      strokeWidth={6}
    />,
  ];
  segments.forEach(([col, pct], i) => {
    const len = (C * pct) / 100;
    parts.push(
      <circle
        key={`seg-${i}`}
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={col}
        strokeWidth={6.4}
        strokeDasharray={`${len.toFixed(3)} ${(C - len).toFixed(3)}`}
        strokeDashoffset={(C * 0.25 - off).toFixed(3)}
        strokeLinecap="butt"
      />,
    );
    off += len;
  });
  return (
    <svg width="190" height="190" viewBox="0 0 42 42" style={{ flexShrink: 0 }}>
      {parts}
      <text
        x="21"
        y="20"
        textAnchor="middle"
        fontFamily="Archivo"
        fontWeight={800}
        fontSize="7"
        fill="#15151a"
      >
        {TOTAL_MARKERS}
      </text>
      <text
        x="21"
        y="25.5"
        textAnchor="middle"
        fontFamily="Inter"
        fontWeight={500}
        fontSize="2.6"
        fill="#9aa0a8"
        letterSpacing="0.05"
      >
        MARKERS
      </text>
    </svg>
  );
}

function BarsCard() {
  const rows: Array<[string, number, number, number]> = [
    ["Hair Health", 24, 12, 6],
    ["Ketamine", 9, 3, 0],
    ["Genetics", 18, 8, 2],
    ["Weight Management", 16, 9, 3],
    ["Trending Diets", 14, 4, 0],
    ["Emotional Health", 13, 7, 2],
    ["Preconception Ge…", 11, 6, 3],
    ["Nutrition 2.0 w/…", 62, 30, 8],
    ["New Sections", 30, 14, 6],
  ];
  const max = 120;
  const pct = (v: number) => `${((v / max) * 100).toFixed(2)}%`;

  return (
    <div style={cardStyle()}>
      <CardHead
        title="By report section"
        icon={<BarChart3 className="w-4 h-4" strokeWidth={1.9} />}
        chip="Optimal · Moderate · Attention"
      />
      <div className="flex flex-col" style={{ gap: 11 }}>
        {rows.map(([nm, o, m, a]) => (
          <div
            key={nm}
            className="grid items-center"
            style={{
              gridTemplateColumns: "120px 1fr",
              gap: 12,
            }}
          >
            <span
              style={{
                fontSize: 12.5,
                color: "#54545c",
                textAlign: "right",
                fontWeight: 500,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {nm}
            </span>
            <div
              className="flex overflow-hidden"
              style={{
                height: 15,
                borderRadius: 5,
                background: "#f3f3f2",
              }}
            >
              <i style={{ width: pct(o), background: MOCKUP.green, height: "100%" }} />
              <i style={{ width: pct(m), background: MOCKUP.amber, height: "100%" }} />
              <i style={{ width: pct(a), background: MOCKUP.att, height: "100%" }} />
            </div>
          </div>
        ))}
      </div>
      <div
        className="grid"
        style={{
          gridTemplateColumns: "120px 1fr",
          gap: 12,
          marginTop: 8,
        }}
      >
        <span />
        <div
          className="flex justify-between"
          style={{ fontSize: 11, color: MOCKUP.faint }}
        >
          {[0, 30, 60, 90, 120].map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function CardHead({
  title,
  icon,
  chip,
}: {
  title: string;
  icon: React.ReactNode;
  chip?: string;
}) {
  return (
    <div
      className="flex items-center justify-between"
      style={{ gap: 12, marginBottom: 18 }}
    >
      <h3
        className="flex items-center"
        style={{
          gap: 10,
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: "-0.01em",
          color: MOCKUP.ink,
        }}
      >
        <span style={{ color: MOCKUP.red }}>{icon}</span>
        {title}
      </h3>
      {chip && (
        <span
          style={{
            fontSize: 12.5,
            color: MOCKUP.muted,
            background: "#f4f4f3",
            border: `1px solid ${MOCKUP.line}`,
            padding: "5px 12px",
            borderRadius: 20,
            fontWeight: 500,
          }}
        >
          {chip}
        </span>
      )}
    </div>
  );
}

function cardStyle(): React.CSSProperties {
  return {
    background: "#fff",
    border: `1px solid ${MOCKUP.line}`,
    borderRadius: 16,
    padding: "24px 26px",
    boxShadow: MOCKUP.shadowCard,
  };
}

// ─── Findings summary ────────────────────────────────────────────────────

function FindingsSummary() {
  return (
    <section
      style={{
        ...cardStyle(),
        marginTop: 22,
      }}
    >
      <CardHead
        title="Summary of findings"
        icon={<List className="w-4 h-4" strokeWidth={1.9} />}
        chip="422 markers · 6 priority themes"
      />

      <div
        style={{
          fontSize: 15.5,
          color: "#3a3a42",
          lineHeight: 1.66,
        }}
      >
        <p style={{ margin: "0 0 15px" }}>
          Overall this is a{" "}
          <b style={{ color: MOCKUP.ink, fontWeight: 700 }}>
            largely favorable profile
          </b>
          . Of the 422 markers analyzed, 244 (58%) landed in the Optimal range
          and 144 (34%) in Moderate, leaving just{" "}
          <b style={{ color: MOCKUP.ink, fontWeight: 700 }}>
            32 flagged for attention (8%)
          </b>{" "}
          — and those don't scatter at random. They cluster into six clear
          themes:{" "}
          <b style={{ color: MOCKUP.ink, fontWeight: 700 }}>
            dietary fats & cardiometabolic handling
          </b>{" "}
          (the strongest, most repeated signal — poor saturated-fat response,
          increased omega-6, high plant-sterol risk),{" "}
          <b style={{ color: MOCKUP.ink, fontWeight: 700 }}>
            methylation & detoxification
          </b>
          ,{" "}
          <b style={{ color: MOCKUP.ink, fontWeight: 700 }}>
            gut & systemic inflammation
          </b>
          ,{" "}
          <b style={{ color: MOCKUP.ink, fontWeight: 700 }}>
            micronutrients & antioxidants
          </b>
          ,{" "}
          <b style={{ color: MOCKUP.ink, fontWeight: 700 }}>skin & hair</b>, and{" "}
          <b style={{ color: MOCKUP.ink, fontWeight: 700 }}>mood & sleep</b>.
          Each represents a tendency written into your DNA — not a diagnosis,
          and not a measure of your health today.
        </p>
        <p style={{ margin: 0 }}>
          In plain terms, a handful of areas are simply worth keeping an eye
          on: be intentional about the <i>type</i> of fat you eat (your body
          handles carbohydrates well but saturated fat less efficiently),
          support the methylation and detox pathways that clear certain
          medications and metals, mind gut and inflammation triggers, top up
          key nutrients and antioxidants, protect more sun-sensitive skin, and
          watch how stress tips over into disrupted sleep. None of this is
          cause for alarm — most of these areas respond to everyday diet and
          lifestyle changes and are good starting points to review with your
          clinician. Your{" "}
          <b style={{ color: MOCKUP.ink, fontWeight: 700 }}>
            strengths are broad too
          </b>
          : testosterone, general cognition, carbohydrate handling, iron,
          vitamin E, and several B vitamins all scored Optimal.{" "}
          <b style={{ color: MOCKUP.ink, fontWeight: 700 }}>
            Tap any marker below to see what it means for you.
          </b>
        </p>
      </div>

      <button
        type="button"
        onClick={downloadGeneticsReport}
        className="inline-flex items-center cursor-pointer"
        style={{
          gap: 9,
          marginTop: 20,
          padding: "11px 20px",
          border: "none",
          borderRadius: 10,
          background: MOCKUP.red,
          color: "#fff",
          fontSize: 14,
          fontWeight: 600,
          boxShadow: "0 1px 2px rgba(213,6,3,.18)",
        }}
      >
        <Download className="w-4 h-4" strokeWidth={2} />
        Export Full Report (PDF)
      </button>

      <ConciergeBox />
      <RecommendedSection />
    </section>
  );
}

function ConciergeBox() {
  return (
    <div
      style={{
        marginTop: 24,
        paddingTop: 24,
        borderTop: `1px solid ${MOCKUP.line}`,
      }}
    >
      <div
        className="uppercase flex items-center"
        style={{
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.06em",
          color: MOCKUP.red,
          margin: "0 0 12px",
          gap: 12,
        }}
      >
        <span>Work with Apex MD</span>
        <span
          style={{ flex: 1, height: 1, background: MOCKUP.line }}
        />
      </div>
      <div
        className="flex overflow-hidden"
        style={{
          border: `1px solid ${MOCKUP.line}`,
          borderRadius: 16,
          background: "#fff",
        }}
      >
        <div
          className="relative"
          style={{
            flex: "0 0 290px",
            background: "linear-gradient(150deg,#17171c,#2b2b33)",
            minHeight: 230,
            borderRight: `1px solid ${MOCKUP.line}`,
            overflow: "hidden",
          }}
        >
          <img
            src="/genetics/concierge-physician.jpg"
            alt="Apex MD physician consulting with a patient"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
        <div
          className="flex flex-col flex-1"
          style={{ padding: "24px 28px" }}
        >
          <span
            className="uppercase"
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: MOCKUP.red,
            }}
          >
            Concierge Medicine
          </span>
          <h4
            style={{
              fontSize: 21,
              fontWeight: 800,
              letterSpacing: "-0.015em",
              margin: "7px 0 11px",
              lineHeight: 1.22,
              color: MOCKUP.ink,
            }}
          >
            Work directly with an Apex MD physician — virtually
          </h4>
          <p
            style={{
              fontSize: 13.5,
              color: "#42424a",
              lineHeight: 1.6,
              margin: "0 0 20px",
              maxWidth: "62ch",
            }}
          >
            Take the next step beyond your report. Get a personalized health
            optimization plan and work one-on-one with an Apex MD physician —
            with regular blood draws and advanced diagnostic testing to ensure
            optimal health is restored and maintained.
          </p>
          <div
            className="flex items-center justify-between flex-wrap"
            style={{
              marginTop: "auto",
              gap: 16,
              paddingTop: 16,
              borderTop: `1px solid ${MOCKUP.line}`,
            }}
          >
            <span
              style={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 600,
                fontSize: 14,
                color: MOCKUP.muted,
              }}
            >
              Starting at{" "}
              <b
                style={{
                  fontSize: 27,
                  color: MOCKUP.ink,
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  margin: "0 2px",
                }}
              >
                $399
              </b>
              <span
                style={{
                  fontSize: 13,
                  color: MOCKUP.muted,
                  fontWeight: 600,
                }}
              >
                /month
              </span>
            </span>
            <button
              type="button"
              className="inline-flex items-center cursor-pointer"
              style={{
                gap: 8,
                border: "none",
                borderRadius: 10,
                background: MOCKUP.red,
                color: "#fff",
                fontSize: 13.5,
                fontWeight: 600,
                padding: "11px 20px",
                boxShadow: "0 1px 2px rgba(213,6,3,.16)",
              }}
            >
              <CalendarIcon className="w-3.5 h-3.5" strokeWidth={2} />
              Book a consultation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Recommended supplements + peptide + also strong ─────────────────────

const SUPP_PICKS = [
  {
    pick: "Pick 01",
    name: "RED Superfood",
    image: "/genetics/products/red-superfood.png",
    tag: "Kiwi Strawberry · Anti-inflammatory antioxidants + prebiotic fiber",
    why: "Flagged because your IL-10 Inflammation reads Increased with an active general-inflammation profile, alongside a benefit response to Vitamin C.",
    sup: "Immune function · Gut health · Antioxidant defense",
    price: "$39.99",
  },
  {
    pick: "Pick 02",
    name: "Probiotic — 40 Billion CFU",
    image: "/genetics/products/probiotic-40b.png",
    tag: "10 strains · Delayed-release · Professional grade",
    why: "Your Gut Permeability and IL-10 gut-homeostasis markers point to a barrier worth reinforcing — a 10-strain, delayed-release blend supports the gut-immune axis.",
    sup: "Digestive health · Microbiome balance · Immune health",
    price: "$34.99",
  },
  {
    pick: "Pick 03",
    name: "Vitamin K2 + D3",
    image: "/genetics/products/vitamin-k2-d3.png",
    tag: "MK-7 · High absorption · Bone, heart & immune",
    why: "Vitamin D3 is recommended in your Core Vitamins panel, and your cardio-metabolic gauges reward cardiovascular protection; K2 (MK-7) directs calcium to bone, not arteries.",
    sup: "Strong bones · Cardiovascular health · Immune function",
    price: "$29.99",
  },
];

const ALSO_STRONG = [
  ["Thymosin Alpha-1 (TA1)", "Increased benefit — immune support"],
  ["Semax", "Increased benefit — cognitive performance"],
  ["Epitalon", "Increased benefit — general longevity"],
  ["GHK-Cu", "Increased benefit — skin aging & collagen"],
];

function RecommendedSection() {
  return (
    <div style={{ marginTop: 26, paddingTop: 24, borderTop: `1px solid ${MOCKUP.line}` }}>
      <div
        className="flex items-baseline flex-wrap"
        style={{ gap: 12, marginBottom: 2 }}
      >
        <span
          style={{
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: "-0.01em",
            color: MOCKUP.ink,
          }}
        >
          Recommended{" "}
          <i style={{ color: MOCKUP.red, fontStyle: "italic" }}>for you</i>
        </span>
        <span style={{ fontSize: 12.5, color: MOCKUP.muted }}>
          Curated from your genetic gauges · drawn from your full report
        </span>
      </div>

      <RecSubhead>Top 3 supplements</RecSubhead>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 14,
          background: "#fff",
          border: `1px solid ${MOCKUP.line}`,
          borderRadius: 16,
          padding: 16,
        }}
      >
        {SUPP_PICKS.map((p) => (
          <SuppCard key={p.pick} {...p} />
        ))}
      </div>

      <RecSubhead>Recommended peptide</RecSubhead>
      <div
        style={{
          background: "#f1f1f0",
          border: `1px solid ${MOCKUP.line}`,
          borderRadius: 16,
          padding: 16,
        }}
      >
        <PeptideCard />
      </div>

      <div style={{ marginTop: 18 }}>
        <span
          className="uppercase"
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            letterSpacing: "0.05em",
            color: MOCKUP.muted,
          }}
        >
          Also strong in your report
        </span>
        <div
          className="grid"
          style={{
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginTop: 11,
          }}
        >
          {ALSO_STRONG.map(([name, desc]) => (
            <div
              key={name}
              style={{
                border: `1px solid ${MOCKUP.line}`,
                borderRadius: 10,
                padding: "10px 13px",
                background: "#fafafa",
              }}
            >
              <b style={{ fontSize: 13, color: MOCKUP.ink, fontWeight: 700 }}>
                {name}
              </b>
              <span
                style={{
                  fontSize: 12,
                  color: MOCKUP.muted,
                  display: "block",
                }}
              >
                {desc}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p
        style={{
          marginTop: 16,
          fontSize: 11.5,
          color: MOCKUP.faint,
          lineHeight: 1.5,
        }}
      >
        Peptides are prescription therapies dispensed through Apex MD's
        physician-led care team. Your provider confirms suitability, dosing,
        and any lab work before starting. These selections summarize genetic
        signal only — not a prescription or diagnosis.
      </p>
    </div>
  );
}

function RecSubhead({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="uppercase flex items-center"
      style={{
        gap: 12,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: "0.06em",
        color: MOCKUP.red,
        margin: "22px 0 12px",
      }}
    >
      <span>{children}</span>
      <span style={{ flex: 1, height: 1, background: MOCKUP.line }} />
    </div>
  );
}

function SuppCard({
  pick,
  name,
  image,
  tag,
  why,
  sup,
  price,
}: {
  pick: string;
  name: string;
  image: string;
  tag: string;
  why: string;
  sup: string;
  price: string;
}) {
  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{
        border: `1px solid ${MOCKUP.line}`,
        borderRadius: 14,
        background: "#fff",
      }}
    >
      <div
        className="grid place-items-center"
        style={{
          height: 132,
          background: "linear-gradient(160deg,#f6f6f6,#ececec)",
          borderBottom: `1px solid ${MOCKUP.line}`,
        }}
      >
        <img
          src={image}
          alt={name}
          loading="lazy"
          style={{
            height: 120,
            width: "auto",
            objectFit: "contain",
            filter: "drop-shadow(0 7px 11px rgba(0,0,0,.13))",
          }}
        />
      </div>
      <div style={{ padding: "13px 15px 16px" }}>
        <span
          className="uppercase"
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: "0.06em",
            color: MOCKUP.red,
          }}
        >
          {pick}
        </span>
        <h4
          style={{
            fontSize: 15.5,
            fontWeight: 700,
            margin: "3px 0 5px",
            letterSpacing: "-0.01em",
            color: MOCKUP.ink,
          }}
        >
          {name}
        </h4>
        <p
          style={{
            fontSize: 12,
            fontStyle: "italic",
            color: MOCKUP.muted,
            margin: "0 0 8px",
            lineHeight: 1.42,
          }}
        >
          {tag}
        </p>
        <p
          style={{
            fontSize: 12.5,
            color: "#42424a",
            lineHeight: 1.5,
            margin: "0 0 9px",
          }}
        >
          {why}
        </p>
        <p
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            color: MOCKUP.red,
            lineHeight: 1.46,
            margin: 0,
          }}
        >
          {sup}
        </p>
        <div
          className="flex items-center justify-between"
          style={{
            gap: 10,
            marginTop: 13,
            paddingTop: 13,
            borderTop: `1px solid ${MOCKUP.line}`,
          }}
        >
          <span
            style={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 800,
              fontSize: 19,
              letterSpacing: "-0.02em",
              color: MOCKUP.ink,
            }}
          >
            {price}
          </span>
          {/* Add to cart hidden — no commerce backend wired yet.
          <button
            type="button"
            className="inline-flex items-center cursor-pointer"
            style={{
              gap: 7,
              border: "none",
              borderRadius: 9,
              background: MOCKUP.red,
              color: "#fff",
              fontSize: 12.5,
              fontWeight: 600,
              padding: "9px 15px",
              boxShadow: "0 1px 2px rgba(213,6,3,.16)",
            }}
          >
            <ShoppingCart className="w-3.5 h-3.5" strokeWidth={2} />
            Add to cart
          </button>
          */}
        </div>
      </div>
    </div>
  );
}

function PeptideCard() {
  return (
    <div
      className="flex overflow-hidden"
      style={{
        border: `1px solid ${MOCKUP.line}`,
        borderRadius: 14,
        background: "#fff",
      }}
    >
      <div
        className="grid place-items-center"
        style={{
          flex: "0 0 168px",
          background: "linear-gradient(160deg,#f6f6f6,#ececec)",
          padding: 14,
          borderRight: `1px solid ${MOCKUP.line}`,
        }}
      >
        <img
          src="/genetics/products/wolverine-stack.png"
          alt="Wolverine Stack peptide"
          loading="lazy"
          style={{
            height: 208,
            width: "auto",
            objectFit: "contain",
            filter: "drop-shadow(0 7px 11px rgba(0,0,0,.13))",
          }}
        />
      </div>
      <div style={{ padding: "20px 22px", flex: 1 }}>
        <span
          className="uppercase"
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: "0.06em",
            color: MOCKUP.red,
          }}
        >
          Elite Stack · BPC-157 + TB-500
        </span>
        <h4
          style={{
            fontSize: 19,
            fontWeight: 700,
            margin: "2px 0 5px",
            letterSpacing: "-0.01em",
            color: MOCKUP.ink,
          }}
        >
          Wolverine Stack
        </h4>
        <p
          style={{
            fontSize: 12,
            fontStyle: "italic",
            color: MOCKUP.muted,
            margin: "0 0 8px",
            lineHeight: 1.42,
          }}
        >
          BPC-157 + TB-500 combo for accelerated full-body healing
        </p>
        <p
          style={{
            fontSize: 12.5,
            color: "#42424a",
            lineHeight: 1.5,
            margin: "0 0 9px",
          }}
        >
          Your Peptides 1.0 panel returns an{" "}
          <b style={{ color: MOCKUP.ink, fontWeight: 700 }}>Increased</b>{" "}
          genetic benefit for both halves — BPC-157 for inflammation
          resolution and pain burden, TB-500 for tissue and connective-tissue
          repair — mapping closely onto the recovery and anti-inflammatory
          pathways your report emphasizes. By contrast, CJC-1295 and IGF-1 LR3
          returned reduced benefit, so a repair-and-resolution stack is the
          cleaner genetic fit.
        </p>
        <p
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            color: MOCKUP.red,
            lineHeight: 1.46,
            margin: 0,
          }}
        >
          Tissue &amp; joint repair · Inflammation resolution · Recovery
        </p>
        <div
          className="flex items-center justify-between"
          style={{
            gap: 10,
            marginTop: 13,
            paddingTop: 13,
            borderTop: `1px solid ${MOCKUP.line}`,
          }}
        >
          <span
            style={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 800,
              fontSize: 24,
              letterSpacing: "-0.02em",
              color: MOCKUP.ink,
            }}
          >
            $249
          </span>
          {/* Purchase hidden — peptides are prescription-only via Apex MD.
          <button
            type="button"
            className="inline-flex items-center cursor-pointer"
            style={{
              gap: 7,
              border: "none",
              borderRadius: 9,
              background: MOCKUP.red,
              color: "#fff",
              fontSize: 13.5,
              fontWeight: 600,
              padding: "11px 22px",
              boxShadow: "0 1px 2px rgba(213,6,3,.16)",
            }}
          >
            <ShoppingCart className="w-3.5 h-3.5" strokeWidth={2} />
            Purchase
          </button>
          */}
        </div>
      </div>
    </div>
  );
}

// ─── Theme filter bar ────────────────────────────────────────────────────

function ThemeFilterBar({
  theme,
  count,
  onClear,
}: {
  theme: string;
  count: number;
  onClear: () => void;
}) {
  return (
    <div
      className="flex items-center"
      style={{
        gap: 12,
        marginTop: 24,
        padding: "12px 16px",
        borderRadius: 13,
        background: "#141417",
        color: "#fff",
        fontSize: 13.5,
      }}
    >
      <span>
        Showing <b style={{ fontWeight: 700 }}>{THEME_LABEL[theme] ?? theme}</b>{" "}
        · <b style={{ fontWeight: 700 }}>{count}</b> markers from Needs Attention
      </span>
      <button
        type="button"
        onClick={onClear}
        className="inline-flex items-center cursor-pointer"
        style={{
          marginLeft: "auto",
          gap: 7,
          fontSize: 12.5,
          fontWeight: 600,
          color: "#fff",
          background: "rgba(255,255,255,.14)",
          border: "none",
          borderRadius: 8,
          padding: "7px 12px",
        }}
      >
        Clear filter <X className="w-3 h-3" strokeWidth={2.4} />
      </button>
    </div>
  );
}

// ─── Result section ─────────────────────────────────────────────────────

function ResultSection({
  tone,
  rows,
  expanded,
  onToggleExpand,
  onOpen,
  activeTheme,
  hiddenByTheme,
}: {
  tone: ToneKey;
  rows: MarkerRow[];
  expanded: boolean;
  onToggleExpand: () => void;
  onOpen: (row: MarkerRow) => void;
  activeTheme: string | null;
  hiddenByTheme?: boolean;
}) {
  if (hiddenByTheme) return null;

  const t = TONES[tone];
  const totalRaw = tone === "att" ? STATS.att.count : tone === "mod" ? STATS.mod.count : STATS.opt.count;
  const headLabel = `${t.label} (${totalRaw})`;
  const isSearching = false; // search expands inline via prop, kept for parity
  const showAll = expanded || (activeTheme && tone === "att");
  const visible = showAll ? rows : rows.slice(0, COLLAPSED);

  return (
    <section
      style={{
        marginTop: 24,
        borderRadius: 20,
        border: `1px solid ${t.border}`,
        background: t.bg,
        overflow: "hidden",
      }}
    >
      <div
        className="flex items-baseline"
        style={{ gap: 12, padding: "22px 26px 6px" }}
      >
        <span
          className="uppercase"
          style={{
            fontSize: 13,
            letterSpacing: "0.06em",
            fontWeight: 700,
            color: t.fg,
          }}
        >
          {headLabel}
        </span>
        <span style={{ fontSize: 13, color: MOCKUP.muted }}>
          {t.instances} instances across panels
        </span>
      </div>

      {rows.length === 0 ? (
        <div
          style={{
            padding: "30px 26px",
            color: MOCKUP.muted,
            fontSize: 14,
            textAlign: "center",
          }}
        >
          No markers match your search in this section.
        </div>
      ) : (
        <div
          className="grid"
          style={{
            gridTemplateColumns: "1fr 1fr",
            gap: 11,
            padding: "14px 26px 6px",
          }}
        >
          {visible.map((row, i) => (
            <MarkerItem key={`${row[0]}-${i}`} row={row} tone={tone} onOpen={onOpen} />
          ))}
        </div>
      )}

      {rows.length > COLLAPSED && !activeTheme && (
        <button
          type="button"
          onClick={onToggleExpand}
          className="w-full text-center cursor-pointer"
          style={{
            padding: 16,
            background: "transparent",
            border: "none",
            fontSize: 14,
            fontWeight: 600,
            color: "#7a7a82",
          }}
        >
          {expanded ? "Show less" : `Show all ${rows.length} markers`}
        </button>
      )}
    </section>
  );
}

function MarkerItem({
  row,
  tone,
  onOpen,
}: {
  row: MarkerRow;
  tone: ToneKey;
  onOpen: (row: MarkerRow) => void;
}) {
  const t = TONES[tone];
  const dotColor =
    tone === "att" ? MOCKUP.att : tone === "mod" ? MOCKUP.amber : MOCKUP.green;
  return (
    <div
      tabIndex={0}
      role="button"
      onClick={() => onOpen(row)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(row);
        }
      }}
      className="flex items-center cursor-pointer transition-shadow"
      style={{
        gap: 13,
        background: "#fff",
        border: `1px solid ${
          tone === "att" ? "#f4dede" : tone === "mod" ? "#efe2cb" : "#d9ebde"
        }`,
        borderRadius: 12,
        padding: "13px 15px",
      }}
    >
      <span
        style={{
          width: 9,
          height: 9,
          borderRadius: "50%",
          background: dotColor,
          flexShrink: 0,
        }}
      />
      <div className="min-w-0 flex-1">
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#222228",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {row[0]}
        </div>
        <div
          style={{
            fontSize: 12,
            color: MOCKUP.faint,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            marginTop: 1,
          }}
        >
          {row[1]}
        </div>
      </div>
      <span
        title={row[2]}
        style={{
          flexShrink: 0,
          fontSize: 11.5,
          fontWeight: 600,
          padding: "5px 11px",
          borderRadius: 20,
          whiteSpace: "nowrap",
          maxWidth: 190,
          overflow: "hidden",
          textOverflow: "ellipsis",
          background: t.badgeBg,
          color: t.badgeFg,
        }}
      >
        {row[2]}
      </span>
      <Info
        className="w-4 h-4"
        strokeWidth={1.8}
        style={{ color: "#c2c2c8", flexShrink: 0 }}
      />
    </div>
  );
}

// ─── Marker detail modal ─────────────────────────────────────────────────

const GAUGE: Record<ToneKey, { w: number; c: string; t: string }> = {
  att: { w: 78, c: MOCKUP.att, t: "#c6383d" },
  mod: { w: 55, c: MOCKUP.amber, t: "#bb7e14" },
  opt: { w: 86, c: MOCKUP.green, t: "#218045" },
};

function plainText(name: string, panel: string, status: string, tone: ToneKey): string {
  if (EXPLAIN[name]) return EXPLAIN[name]!;
  const topicRaw = panel.replace(/\s·.*$/, "").replace(/\s*\([^)]*\)/, "").trim();
  const topic = topicRaw ? topicRaw.toLowerCase() : "this trait";
  if (tone === "opt")
    return `This marker relates to ${topic}. Your result — "${status}" — falls in the optimal range, so it reads as a strength and generally isn't something you need to act on.`;
  if (tone === "mod")
    return `This marker relates to ${topic}. Your result — "${status}" — is in the moderate range: broadly fine, but a useful one to revisit as your habits, age or lab results change.`;
  return `This marker relates to ${topic}. Your result — "${status}" — is flagged for a closer look, which makes it a good one to raise with your clinician.`;
}

function appearsList(name: string, panel: string): string[] {
  const cat = (panel.split("·")[0] || panel).trim();
  const m = panel.match(/in (\d+) panels/);
  if (m) return [`Appears in ${m[1]} panels across this report.`];
  return [`Part of your ${cat} results.`];
}

function MarkerModal({
  row,
  tone,
  onClose,
}: {
  row: MarkerRow;
  tone: ToneKey;
  onClose: () => void;
}) {
  const [name, panel, status] = row;
  const cat = (panel.split("·")[0] || panel).trim();
  const g = GAUGE[tone];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        zIndex: 100,
        padding: 20,
        background: "rgba(20,20,26,.46)",
        backdropFilter: "blur(3px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex flex-col relative"
        style={{
          width: "100%",
          maxWidth: 560,
          maxHeight: "90vh",
          background: "#fff",
          borderRadius: 18,
          boxShadow: "0 24px 60px rgba(20,20,30,.28)",
          overflow: "hidden",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute grid place-items-center cursor-pointer"
          style={{
            top: 15,
            right: 15,
            zIndex: 2,
            width: 32,
            height: 32,
            border: "none",
            borderRadius: 9,
            background: "#f3f3f2",
            color: "#6a6a72",
          }}
        >
          <X className="w-4 h-4" strokeWidth={2.2} />
        </button>

        <div
          className="overflow-y-auto"
          style={{ padding: "24px 26px" }}
        >
          <div
            className="uppercase"
            style={{
              fontSize: 11,
              letterSpacing: "0.09em",
              fontWeight: 700,
              color: MOCKUP.faint,
            }}
          >
            {cat}
          </div>
          <h2
            className="uppercase flex items-center"
            style={{
              gap: 9,
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: "0.005em",
              color: MOCKUP.ink,
              lineHeight: 1.25,
              margin: "5px 44px 0 0",
            }}
          >
            {name}
          </h2>

          <div style={{ margin: "18px 0 6px" }}>
            <div
              className="relative"
              style={{
                height: 11,
                borderRadius: 7,
                background: "#e7e8ea",
              }}
            >
              <div
                className="absolute"
                style={{
                  left: 0,
                  top: 0,
                  height: "100%",
                  width: `${g.w}%`,
                  background: g.c,
                  borderRadius: 7,
                }}
              />
              <div
                className="absolute rounded-full"
                style={{
                  top: "50%",
                  left: `${g.w}%`,
                  width: 17,
                  height: 17,
                  background: "#fff",
                  transform: "translate(-50%, -50%)",
                  boxShadow: "0 1px 4px rgba(0,0,0,.28)",
                }}
              />
            </div>
            <div
              className="text-center uppercase"
              style={{
                marginTop: 10,
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.06em",
                color: g.t,
              }}
            >
              {status}
            </div>
          </div>

          <Section label="Understanding what this may mean">
            <div
              style={{
                padding: "16px 17px",
                border: `1px solid ${MOCKUP.line}`,
                borderRadius: 13,
                background: "#fafafa",
                fontSize: 13.8,
                lineHeight: 1.62,
                color: "#46464e",
              }}
            >
              {plainText(name, panel, status, tone)}
            </div>
          </Section>

          <Section label="Also appears in">
            <div className="flex flex-col" style={{ gap: 9 }}>
              {appearsList(name, panel).map((line, i) => (
                <div
                  key={i}
                  style={{ fontSize: 13.2, color: MOCKUP.muted, lineHeight: 1.35 }}
                >
                  {line}
                </div>
              ))}
            </div>
          </Section>

          <div
            className="flex items-start"
            style={{
              gap: 8,
              marginTop: 20,
              paddingTop: 14,
              borderTop: `1px solid ${MOCKUP.line}`,
              fontSize: 12,
              color: MOCKUP.faint,
              lineHeight: 1.5,
            }}
          >
            <Info className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.9} style={{ marginTop: 1 }} />
            <span>
              Genetic propensity, not a diagnosis or a measure of current
              health. Supplement notes are informational only — discuss with
              your clinician before making changes.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginTop: 22 }}>
      <div
        className="uppercase"
        style={{
          fontSize: 11,
          letterSpacing: "0.09em",
          fontWeight: 700,
          color: MOCKUP.faint,
          marginBottom: 10,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}
