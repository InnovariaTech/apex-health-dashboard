// @ts-nocheck
import { Watch } from "lucide-react";
import { STATIC_WEARABLES, WEARABLE_DAYS } from "@/data/wearables/staticWearables";

/**
 * Wearables page — restyled to the `apex-wearables-portal` mockup with
 * dependency-free SVG charts (no chart library). Currently driven by static
 * demo data in `src/data/wearables/staticWearables.ts` while the real
 * Apple Health / Fitbit / Withings sync isn't returning data.
 *
 * When the integration goes live, swap the four `metrics` reads for the
 * Trainerize health-data hooks (`useHealthDataMulti`, `useSleepData`) — the
 * chart components below accept the same shape.
 */

const W = 520;
const H = 230;

// ─── SVG helpers ──────────────────────────────────────────────────────────

// Catmull-Rom → cubic bezier, matching the demo's smoothPath (t = 0.18).
function smoothPath(pts: number[][]): string {
  if (pts.length < 2) return "";
  const t = 0.18;
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || pts[i + 1];
    const c1x = p1[0] + (p2[0] - p0[0]) * t;
    const c1y = p1[1] + (p2[1] - p0[1]) * t;
    const c2x = p2[0] - (p3[0] - p1[0]) * t;
    const c2y = p2[1] - (p3[1] - p1[1]) * t;
    d += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${p2[0]} ${p2[1]}`;
  }
  return d;
}

function GridY({
  top,
  bottom,
  rows,
}: {
  top: number;
  bottom: number;
  rows: number;
}) {
  const lines = [];
  for (let i = 0; i <= rows; i++) {
    const y = top + ((bottom - top) * i) / rows;
    lines.push(
      <line
        key={i}
        x1={0}
        y1={y}
        x2={W}
        y2={y}
        stroke="#EFEFED"
        strokeWidth={1}
        strokeDasharray={i !== rows ? "1 5" : undefined}
      />,
    );
  }
  return <>{lines}</>;
}

function VGuides({
  top,
  bottom,
  n,
}: {
  top: number;
  bottom: number;
  n: number;
}) {
  const lines = [];
  for (let i = 0; i < n; i++) {
    const x = (W * i) / (n - 1);
    lines.push(
      <line
        key={i}
        x1={x}
        y1={top}
        x2={x}
        y2={bottom}
        stroke="#F2F2F0"
        strokeWidth={1}
        strokeDasharray="2 5"
      />,
    );
  }
  return <>{lines}</>;
}

function ChartSvg({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ display: "block", width: "100%", height: H, overflow: "visible" }}
    >
      {children}
    </svg>
  );
}

function AxisX({ days }: { days: readonly string[] }) {
  return (
    <div className="flex justify-between" style={{ padding: "8px 4px 0" }}>
      {days.map((d, i) => (
        <span
          key={i}
          className="font-mono"
          style={{ fontSize: 11.5, color: "#A9AEB6", fontWeight: 500 }}
        >
          {d}
        </span>
      ))}
    </div>
  );
}

// ─── Card shell ───────────────────────────────────────────────────────────

const CARD_THEME = {
  steps: { c: "#059669", cDark: "#047857", cSoft: "#E6F6EF" },
  rhr: { c: "#E11816", cDark: "#B70402", cSoft: "#FCEAEA" },
  bp: { c: "#2563EB", cDark: "#1D4ED8", cSoft: "#E6EDFC" },
  sleep: { c: "#7C3AED", cDark: "#5B21B6", cSoft: "#EEEAFB" },
} as const;

function MetricCard({
  theme,
  icon,
  title,
  kpi,
  kpiUnit,
  trend,
  trendTone = "up",
  children,
  footer,
}: {
  theme: { c: string; cDark: string; cSoft: string };
  icon: React.ReactNode;
  title: string;
  kpi: string;
  kpiUnit: string;
  trend: string;
  trendTone?: "up" | "down" | "neutral";
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const chipStyle =
    trendTone === "up"
      ? { color: "#3E7C57", borderColor: "#CFE6D8", background: "#F2FAF5" }
      : trendTone === "down"
        ? { color: "#B70402", borderColor: "#F3D4D4", background: "#FDF2F2" }
        : { color: "#3A3D44", borderColor: "#E4E4E1", background: "#fff" };

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: "#fff",
        border: "1px solid #ECECEA",
        borderRadius: 20,
        padding: "24px 24px 20px",
        boxShadow:
          "0 1px 0 rgba(0,0,0,.02), 0 18px 40px -32px rgba(20,20,30,.35)",
      }}
    >
      {/* top color wash */}
      <span
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: 20,
          background: `linear-gradient(180deg, ${theme.c}0F, transparent 120px)`,
        }}
      />

      {/* head */}
      <div className="relative z-[2] flex items-center gap-[11px]" style={{ marginBottom: 6 }}>
        <span
          className="grid place-items-center flex-none"
          style={{
            width: 30,
            height: 30,
            borderRadius: 9,
            background: theme.cSoft,
            color: theme.c,
          }}
        >
          {icon}
        </span>
        <h3
          style={{
            fontSize: 17,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "#15171C",
          }}
        >
          {title}
        </h3>
        <div
          className="ml-auto flex items-baseline gap-[5px] font-mono"
        >
          <b style={{ fontSize: 21, fontWeight: 700, color: theme.cDark, letterSpacing: "-0.03em" }}>
            {kpi}
          </b>
          <span
            className="uppercase"
            style={{ fontSize: 11, fontWeight: 500, color: "#8A8F98", letterSpacing: "0.03em" }}
          >
            {kpiUnit}
          </span>
        </div>
      </div>

      {/* subrow */}
      <div
        className="relative z-[2] flex items-center gap-[14px]"
        style={{ margin: "2px 0 12px", paddingLeft: 41 }}
      >
        <span
          className="inline-flex items-center gap-1.5 font-mono"
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.02em",
            padding: "4px 9px",
            borderRadius: 999,
            border: "1px solid",
            ...chipStyle,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: theme.c,
              boxShadow: `0 0 0 3px ${theme.c}33`,
            }}
          />
          {trend}
        </span>
        <span
          className="inline-flex items-center gap-1.5 font-mono uppercase"
          style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.05em", color: "#8A8F98" }}
        >
          <LivePulse color={theme.c} />
          Synced
        </span>
      </div>

      {/* chart */}
      <div className="relative z-[2]" style={{ marginTop: 2 }}>
        {children}
      </div>

      {footer && <div className="relative z-[2]">{footer}</div>}
    </section>
  );
}

function LivePulse({ color }: { color: string }) {
  return (
    <span
      className="relative inline-block"
      style={{ width: 7, height: 7, borderRadius: "50%", background: color }}
    >
      <span
        className="absolute rounded-full"
        style={{
          inset: -4,
          border: `1.5px solid ${color}73`,
          animation: "apexWearRing 1.8s ease-out infinite",
        }}
      />
    </span>
  );
}

// ─── Individual charts ────────────────────────────────────────────────────

function StepsChart({ m }: { m: typeof STATIC_WEARABLES.steps }) {
  const data = m.values;
  const goal = m.goal;
  const top = 14;
  const bottom = 196;
  const pad = 26;
  const max = Math.max(...data, goal) * 1.12;
  const gy = bottom - (goal / max) * (bottom - top);
  const slot = (W - pad * 2) / data.length;
  const bw = slot * 0.46;

  return (
    <ChartSvg>
      <defs>
        <linearGradient id="wearBarGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={m.colorLite} />
          <stop offset="1" stopColor={m.color} />
        </linearGradient>
        <filter id="wearBarGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor={m.color} floodOpacity="0.32" />
        </filter>
      </defs>
      <GridY top={top} bottom={bottom} rows={4} />
      {/* goal line */}
      <line x1={0} y1={gy} x2={W} y2={gy} stroke={m.colorDark} strokeWidth={1.4} strokeDasharray="4 4" opacity={0.55} />
      <text x={4} y={gy - 7} textAnchor="start" fill={m.colorDark} fontSize={11} fontFamily="JetBrains Mono" fontWeight={600} opacity={0.8}>
        GOAL 10K
      </text>
      {data.map((v, i) => {
        const x = pad + slot * i + slot / 2;
        const h = (v / max) * (bottom - top);
        const y = bottom - h;
        const hit = v >= goal;
        return (
          <g key={i}>
            <rect
              x={x - bw / 2}
              y={y}
              width={bw}
              height={h}
              rx={7}
              fill={hit ? "url(#wearBarGrad)" : m.barDim}
              filter={hit ? "url(#wearBarGlow)" : undefined}
            />
            <text x={x} y={y - 9} textAnchor="middle" fill={hit ? m.colorDark : m.labelDim} fontSize={11} fontFamily="JetBrains Mono" fontWeight={700}>
              {(v / 1000).toFixed(1)}k
            </text>
          </g>
        );
      })}
    </ChartSvg>
  );
}

function RhrChart({ m }: { m: typeof STATIC_WEARABLES.rhr }) {
  const data = m.values;
  const top = 22;
  const bottom = 190;
  const pad = 24;
  const [lo, hi] = m.scale;
  const x = (i: number) => pad + ((W - pad * 2) * i) / (data.length - 1);
  const y = (v: number) => bottom - ((v - lo) / (hi - lo)) * (bottom - top);
  const pts = data.map((v, i) => [x(i), y(v)]);
  const line = smoothPath(pts);
  const area = `${line} L ${pts[pts.length - 1][0]} ${bottom} L ${pts[0][0]} ${bottom} Z`;

  return (
    <ChartSvg>
      <defs>
        <linearGradient id="wearRhrFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={m.color} stopOpacity="0.30" />
          <stop offset="1" stopColor={m.color} stopOpacity="0" />
        </linearGradient>
        <filter id="wearLineGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="3.5" floodColor={m.color} floodOpacity="0.45" />
        </filter>
      </defs>
      <GridY top={top} bottom={bottom} rows={3} />
      <VGuides top={top} bottom={bottom} n={7} />
      <path d={area} fill="url(#wearRhrFill)" />
      <path d={line} fill="none" stroke={m.color} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" filter="url(#wearLineGlow)" />
      {pts.map((p, i) => {
        const last = i === pts.length - 1;
        return (
          <g key={i}>
            <circle cx={p[0]} cy={p[1]} r={last ? 5 : 3.4} fill="#fff" stroke={m.color} strokeWidth={last ? 3 : 2.2} />
            {last && <circle cx={p[0]} cy={p[1]} r={9} fill="none" stroke={m.color} strokeWidth={1.4} opacity={0.4} />}
          </g>
        );
      })}
    </ChartSvg>
  );
}

function BpChart({ m }: { m: typeof STATIC_WEARABLES.bp }) {
  const sys = m.systolic;
  const dia = m.diastolic;
  const top = 18;
  const bottom = 188;
  const pad = 24;
  const [lo, hi] = m.scale;
  const x = (i: number) => pad + ((W - pad * 2) * i) / (sys.length - 1);
  const y = (v: number) => bottom - ((v - lo) / (hi - lo)) * (bottom - top);
  const bTop = y(m.band[1]);
  const bBot = y(m.band[0]);
  const sysPts = sys.map((v, i) => [x(i), y(v)]);
  const diaPts = dia.map((v, i) => [x(i), y(v)]);

  return (
    <ChartSvg>
      <defs>
        <filter id="wearBpGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={m.color} floodOpacity="0.4" />
        </filter>
      </defs>
      <GridY top={top} bottom={bottom} rows={3} />
      <VGuides top={top} bottom={bottom} n={7} />
      {/* normal systolic band */}
      <rect x={0} y={bTop} width={W} height={bBot - bTop} fill="#3E7C57" opacity={0.06} />
      <path d={smoothPath(diaPts)} fill="none" stroke={m.colorDia} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
      <path d={smoothPath(sysPts)} fill="none" stroke={m.color} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" filter="url(#wearBpGlow)" />
      {diaPts.map((p, i) => (
        <circle key={`d${i}`} cx={p[0]} cy={p[1]} r={i === diaPts.length - 1 ? 4.4 : 3} fill="#fff" stroke={m.colorDia} strokeWidth={2} />
      ))}
      {sysPts.map((p, i) => {
        const last = i === sysPts.length - 1;
        return (
          <g key={`s${i}`}>
            <circle cx={p[0]} cy={p[1]} r={last ? 5 : 3.4} fill="#fff" stroke={m.color} strokeWidth={last ? 3 : 2.2} />
            {last && <circle cx={p[0]} cy={p[1]} r={9} fill="none" stroke={m.color} strokeWidth={1.4} opacity={0.4} />}
          </g>
        );
      })}
    </ChartSvg>
  );
}

function SleepChart({ m }: { m: typeof STATIC_WEARABLES.sleep }) {
  const nights = m.nights;
  const colors = m.colors;
  const max = m.max;
  const top = 16;
  const bottom = 192;
  const pad = 26;
  const slot = (W - pad * 2) / nights.length;
  const bw = slot * 0.44;

  return (
    <ChartSvg>
      <GridY top={top} bottom={bottom} rows={3} />
      {nights.map((n, i) => {
        const cx = pad + slot * i + slot / 2;
        let yCursor = bottom;
        const stackH = (n.reduce((a, b) => a + b, 0) / max) * (bottom - top);
        const segs = n.map((seg, si) => {
          const h = (seg / max) * (bottom - top);
          yCursor -= h;
          return <rect key={si} x={cx - bw / 2} y={yCursor} width={bw} height={h} fill={colors[si]} />;
        });
        const topY = bottom - stackH;
        const tot = n[0] + n[1] + n[2];
        return (
          <g key={i}>
            {segs}
            <rect x={cx - bw / 2} y={topY} width={bw} height={6} rx={3} fill={colors[0]} />
            <text x={cx} y={topY - 9} textAnchor="middle" fill={m.colorDark} fontSize={11} fontFamily="JetBrains Mono" fontWeight={700}>
              {tot.toFixed(1)}h
            </text>
          </g>
        );
      })}
    </ChartSvg>
  );
}

// ─── Metric icons ─────────────────────────────────────────────────────────

const StepsIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} width={18} height={18}>
    <path d="M8 4c-1.5 1.5-2 4-1.5 6.5C7 13 9 14 9.5 12c.5-2 0-6.5-1.5-8z" />
    <path d="M7 17c0 2 1 3 2.5 3S12 19 11.5 17" />
    <path d="M16 7c1.5 1.5 2 4 1.5 6.5C17 16 15 17 14.5 15c-.5-2 0-6.5 1.5-8z" />
    <path d="M17 20c0 1.5-1 2-2.5 2" />
  </svg>
);
const RhrIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} width={18} height={18}>
    <path d="M19 14c1.5-1.6 2-3.5 2-5a4.5 4.5 0 0 0-8-3 4.5 4.5 0 0 0-8 3c0 4 4.5 7.5 8 10 1.2-.85 2.6-1.9 3.8-3.1" />
    <path d="M3 13h3l1.5-3L10 16l1.5-4 1 2H15" />
  </svg>
);
const BpIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} width={18} height={18}>
    <path d="M3 12h4l2-5 3 9 2-6 1.5 2H21" />
  </svg>
);
const SleepIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} width={18} height={18}>
    <path d="M20 13.5A8 8 0 1 1 10.5 4 6.2 6.2 0 0 0 20 13.5z" />
  </svg>
);

// ─── KPI helpers ──────────────────────────────────────────────────────────

function stepsAvg() {
  const v = STATIC_WEARABLES.steps.values;
  return Math.round(v.reduce((a, b) => a + b, 0) / v.length).toLocaleString();
}
function sleepAvgLabel() {
  const totals = STATIC_WEARABLES.sleep.nights.map((n) => n[0] + n[1] + n[2]);
  const avg = totals.reduce((a, b) => a + b, 0) / totals.length;
  return `${Math.floor(avg)}h ${Math.round((avg % 1) * 60)}m`;
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function Wearables() {
  const m = STATIC_WEARABLES;
  const rhrLatest = m.rhr.values[m.rhr.values.length - 1];
  const bpLatest = `${m.bp.systolic[m.bp.systolic.length - 1]}/${m.bp.diastolic[m.bp.diastolic.length - 1]}`;

  return (
    <div className="p-4 md:p-9 max-w-[1280px] mx-auto bg-background text-foreground">
      {/* Keyframes for the "Synced" pulse ring */}
      <style>{`@keyframes apexWearRing{0%{transform:scale(.5);opacity:.9}100%{transform:scale(1.7);opacity:0}}`}</style>

      {/* Page head */}
      <div className="mb-8 flex items-start gap-[18px]">
        <div
          className="grid place-items-center flex-none"
          style={{
            width: 58,
            height: 58,
            borderRadius: 16,
            background: "radial-gradient(120% 120% at 30% 20%,#F1F2F4,#E1E4E9)",
            color: "#5E636B",
            boxShadow:
              "0 8px 18px -10px rgba(40,44,52,.4), inset 0 0 0 1px rgba(40,44,52,.08)",
          }}
        >
          <Watch className="w-[30px] h-[30px]" strokeWidth={1.8} />
        </div>
        <div>
          <div className="apex-ai-tag mb-2">Wearables</div>
          <h1 className="apex-page-title">
            My <em>Wearables</em>
          </h1>
          <p className="apex-page-sub" style={{ maxWidth: 760 }}>
            Synced from Apple Health, Google Health Connect, Fitbit or Withings
            via the Apex&nbsp;Fit app — last 7 days.
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <MetricCard
          theme={CARD_THEME.steps}
          icon={StepsIcon}
          title="Steps"
          kpi={stepsAvg()}
          kpiUnit={m.steps.unit}
          trend={m.steps.trend}
          trendTone="up"
        >
          <StepsChart m={m.steps} />
          <AxisX days={WEARABLE_DAYS} />
        </MetricCard>

        <MetricCard
          theme={CARD_THEME.rhr}
          icon={RhrIcon}
          title="Resting heart rate"
          kpi={String(rhrLatest)}
          kpiUnit={m.rhr.unit}
          trend={m.rhr.trend}
          trendTone="up"
        >
          <RhrChart m={m.rhr} />
          <AxisX days={WEARABLE_DAYS} />
        </MetricCard>

        <MetricCard
          theme={CARD_THEME.bp}
          icon={BpIcon}
          title="Blood pressure"
          kpi={bpLatest}
          kpiUnit={m.bp.unit}
          trend={m.bp.trend}
          trendTone="neutral"
          footer={
            <div
              className="flex justify-center"
              style={{ gap: 18, marginTop: 12 }}
            >
              <LegendItem color="#2563EB" label="Systolic" />
              <LegendItem color="#9AA0A8" label="Diastolic" />
            </div>
          }
        >
          <BpChart m={m.bp} />
          <AxisX days={WEARABLE_DAYS} />
        </MetricCard>

        <MetricCard
          theme={CARD_THEME.sleep}
          icon={SleepIcon}
          title="Sleep"
          kpi={sleepAvgLabel()}
          kpiUnit={m.sleep.unit}
          trend={m.sleep.trend}
          trendTone="up"
          footer={
            <div
              className="flex flex-wrap justify-center"
              style={{ gap: 14, marginTop: 14 }}
            >
              {m.sleep.stages.map((s, i) => (
                <SleepLegendItem key={s} color={m.sleep.colors[i]} label={s} />
              ))}
            </div>
          }
        >
          <SleepChart m={m.sleep} />
          <AxisX days={WEARABLE_DAYS} />
        </MetricCard>
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-[7px] font-mono"
      style={{ fontSize: 12, fontWeight: 600, color: "#3A3D44" }}
    >
      <span style={{ width: 16, height: 3, borderRadius: 2, background: color }} />
      {label}
    </span>
  );
}

function SleepLegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-[7px] font-mono"
      style={{ fontSize: 11.5, fontWeight: 600, color: "#3A3D44" }}
    >
      <i style={{ width: 11, height: 11, borderRadius: 3, background: color, display: "inline-block" }} />
      {label}
    </span>
  );
}
