import ReactMarkdown from "react-markdown";
import { AlertTriangle, Info, LifeBuoy } from "lucide-react";
import type { IntakeContent } from "@/types/intake/intake_types";

/**
 * Renders authored clinical copy. It is content, not decoration, and must
 * always show. `crisis` is unmissable — never collapsed, truncated, or below
 * the fold. Links stay clickable (open in a new tab).
 */

const STYLES: Record<
  IntakeContent["severity"],
  { wrap: string; icon: JSX.Element }
> = {
  info: {
    wrap: "border-slate-200 bg-slate-50 text-slate-700",
    icon: <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />,
  },
  warning: {
    wrap: "border-amber-300 bg-amber-50 text-amber-900",
    icon: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />,
  },
  crisis: {
    wrap: "border-red-400 bg-red-50 text-red-900 ring-1 ring-red-300",
    icon: <LifeBuoy className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />,
  },
};

export default function IntakeContentBlocks({
  content,
}: {
  content: IntakeContent[];
}) {
  if (!content?.length) return null;
  return (
    <div className="space-y-3">
      {content.map((c, i) => {
        const s = STYLES[c.severity] ?? STYLES.info;
        return (
          <div
            key={c.ref || i}
            className={`flex gap-2.5 rounded-lg border p-3.5 ${s.wrap} ${
              c.severity === "crisis" ? "text-[15px]" : "text-sm"
            }`}
          >
            {s.icon}
            <div className="prose prose-sm max-w-none [&_a]:underline [&_a]:font-medium">
              <ReactMarkdown
                components={{
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer">
                      {children}
                    </a>
                  ),
                }}
              >
                {c.body}
              </ReactMarkdown>
            </div>
          </div>
        );
      })}
    </div>
  );
}
