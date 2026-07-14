/**
 * Biological vs chronological age scale — the horizontal graph shown below
 * the Biological age headline. Shared by the Health Analysis card
 * (`AnalysisBioAgeCard`) and the dashboard hero (`BioAgeCard`) so both render
 * an identical marker plot.
 *
 * Spec sources: `New Ui/2 Health Analysis/.../css/styles.css` (.bio-scale).
 */
export default function BioAgeScale({
  bio,
  chrono,
}: {
  bio: number;
  chrono: number;
}) {
  const LOW = 25;
  const HIGH = 55;
  const SVG_W = 380;
  const SVG_H = 100;
  const PAD = 24;
  const innerW = SVG_W - PAD * 2;
  const toX = (yrs: number) =>
    PAD + ((Math.min(HIGH, Math.max(LOW, yrs)) - LOW) / (HIGH - LOW)) * innerW;

  const xBio = toX(bio);
  const xChrono = toX(chrono);
  const bandStart = Math.min(xBio, xChrono);
  const bandWidth = Math.abs(xChrono - xBio);

  return (
    <div className="flex flex-col gap-1">
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        preserveAspectRatio="none"
        className="w-full block"
        style={{ height: SVG_H }}
      >
        <rect
          x={bandStart}
          y="48"
          width={bandWidth}
          height="14"
          fill="var(--opt-soft)"
          rx="2"
        />
        <line
          x1={PAD}
          y1="55"
          x2={SVG_W - PAD}
          y2="55"
          stroke="var(--line-2)"
          strokeWidth="1.5"
        />
        <g stroke="var(--ink-4)" strokeWidth="1">
          {[25, 30, 35, 40, 45, 50, 55].map((yr) => {
            const x = toX(yr);
            return <line key={yr} x1={x} y1="50" x2={x} y2="60" />;
          })}
        </g>
        <g
          fontFamily="JetBrains Mono, monospace"
          fontSize="9"
          fill="var(--ink-3)"
          textAnchor="middle"
        >
          {[25, 30, 35, 40, 45, 50, 55].map((yr) => (
            <text key={yr} x={toX(yr)} y="78">
              {yr}
            </text>
          ))}
        </g>
        {/* Biological marker */}
        <line
          x1={xBio}
          y1="24"
          x2={xBio}
          y2="48"
          stroke="var(--opt)"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />
        <circle cx={xBio} cy="55" r="7" fill="var(--opt)" stroke="white" strokeWidth="2.5" />
        <text
          x={xBio}
          y="18"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="12"
          fill="var(--opt)"
          fontWeight={700}
        >
          {bio.toFixed(1)}
        </text>
        {/* Chronological marker */}
        <line
          x1={xChrono}
          y1="24"
          x2={xChrono}
          y2="48"
          stroke="#525252"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />
        <circle cx={xChrono} cy="55" r="7" fill="white" stroke="#525252" strokeWidth="2" />
        <text
          x={xChrono}
          y="18"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="12"
          fill="#525252"
          fontWeight={700}
        >
          {chrono}
        </text>
      </svg>
      <div
        className="flex justify-center gap-[18px] font-mono mt-0.5"
        style={{ fontSize: 10.5, color: "var(--ink-3)", letterSpacing: "0.04em" }}
      >
        <span className="inline-flex items-center gap-1.5">
          <span className="w-[9px] h-[9px] rounded-full" style={{ background: "var(--opt)" }} />
          Biological
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="w-[9px] h-[9px] rounded-full bg-white"
            style={{ border: "2px solid #525252" }}
          />
          Chronological
        </span>
      </div>
    </div>
  );
}
