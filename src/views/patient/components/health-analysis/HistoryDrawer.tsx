import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { ChevronDown, History } from "lucide-react";
import type { PatientSummary } from "@/types/ai-agent/ai_summary_types";

/**
 * Collapsible bottom drawer listing past AI analyses. Mockup doesn't
 * show a history sidebar so we tuck it into a low-emphasis bar that
 * expands on demand — keeps the page focused on the latest analysis
 * without losing access to prior ones.
 */
export default function HistoryDrawer({
  items,
  activeId,
  onSelect,
  isLoading,
}: {
  items: PatientSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  isLoading: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="apex-card mb-6 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-secondary/40 transition-colors text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
        aria-expanded={open}
      >
        <History className="w-4 h-4 text-mute" strokeWidth={1.8} />
        <span className="text-[14px] font-semibold text-foreground">
          Past analyses
        </span>
        <span className="font-mono text-[12px] text-mute">
          {isLoading ? "loading…" : `${items.length} on record`}
        </span>
        <ChevronDown
          className={`w-4 h-4 ml-auto text-mute transition-transform ${
            open ? "rotate-180" : ""
          }`}
          strokeWidth={2}
        />
      </button>

      {open && (
        <div className="border-t border-[var(--line)] px-5 py-4">
          {isLoading ? (
            <p className="text-[13px] text-ink-2">Loading…</p>
          ) : items.length === 0 ? (
            <p className="text-[13px] text-ink-2">
              No prior analyses yet — the next one will appear here.
            </p>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {items.map((s) => {
                const isActive = activeId === s.id;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(s.id)}
                      className={`w-full text-left px-3.5 py-3 rounded-[10px] border transition-colors ${
                        isActive
                          ? "border-foreground bg-secondary/60"
                          : "border-border hover:bg-secondary/40"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-foreground truncate">
                            {safeFormat(s.createdAt, "MMM d, yyyy")}
                          </p>
                          <p className="text-[11px] text-mute font-mono">
                            {safeRelative(s.createdAt)}
                          </p>
                        </div>
                        <div
                          className="px-2.5 py-1 rounded-[7px] font-mono text-[13px] font-semibold min-w-[44px] text-center"
                          style={{
                            background: "var(--opt-soft)",
                            color: "var(--opt-d)",
                          }}
                        >
                          {s.healthScore ?? "—"}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function safeFormat(iso: string, pattern: string): string {
  try {
    return format(new Date(iso), pattern);
  } catch {
    return iso;
  }
}
function safeRelative(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return "";
  }
}
