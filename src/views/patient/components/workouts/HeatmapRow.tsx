// @ts-nocheck

export interface HeatmapDay {
  date: string;
  count: number;
}

/**
 * 14-day workout heatmap row — one square per day, intensity scales with
 * the count of tracked workouts. Hover tooltip carries the date + count.
 * Used by:
 *   - `Workouts.tsx` STATS tab
 *   - `TrainerizeMetricsRow.tsx` dashboard card
 *
 * Today is the rightmost cell when the caller orders days chronologically.
 * The "Less / More" legend on the right hides on `compact` so the dashboard
 * card doesn't crowd at narrow widths.
 */
export default function HeatmapRow({
  days,
  compact = false,
}: {
  days: HeatmapDay[];
  compact?: boolean;
}) {
  const cellClass = (count: number) => {
    if (count === 0) return "bg-muted border border-border";
    if (count === 1) return "bg-primary/30 border border-primary/40";
    if (count === 2) return "bg-primary/60 border border-primary/60";
    return "bg-primary border border-primary";
  };
  const cellSize = compact ? "w-5 h-5" : "w-7 h-7";
  return (
    <div className="flex items-end gap-1.5 flex-wrap">
      {days.map((d) => (
        <div
          key={d.date}
          title={`${d.date} — ${d.count} workout${d.count === 1 ? "" : "s"}`}
          className={`${cellSize} rounded-sm ${cellClass(d.count)} transition-colors`}
        />
      ))}
      {!compact && (
        <div className="ml-auto flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span>Less</span>
          <span className="w-3 h-3 rounded-sm bg-muted border border-border" />
          <span className="w-3 h-3 rounded-sm bg-primary/30 border border-primary/40" />
          <span className="w-3 h-3 rounded-sm bg-primary/60 border border-primary/60" />
          <span className="w-3 h-3 rounded-sm bg-primary border border-primary" />
          <span>More</span>
        </div>
      )}
    </div>
  );
}
