import ReactMarkdown from "react-markdown";
import { AlertTriangle, Info, LifeBuoy } from "lucide-react";
import type { IntakeContent } from "@/types/intake/intake_types";

/**
 * Renders authored clinical copy. It is content, not decoration, and must
 * always show. `crisis` is unmissable — never collapsed, truncated, or below
 * the fold — and keeps its fixed style whatever the theme says. Links stay
 * clickable (open in a new tab).
 */

const ICONS: Record<IntakeContent["severity"], JSX.Element> = {
  info: <Info className="w-4 h-4 shrink-0 mt-0.5 opacity-60" />,
  warning: <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />,
  crisis: <LifeBuoy className="w-5 h-5 shrink-0 mt-0.5" />,
};

export default function IntakeContentBlocks({
  content,
}: {
  content: IntakeContent[];
}) {
  if (!content?.length) return null;
  return (
    <div className="flex flex-col gap-3">
      {content.map((c, i) => (
        <div key={c.ref || i} className="apx-content" data-severity={c.severity}>
          {ICONS[c.severity] ?? ICONS.info}
          <div className="min-w-0 [&_p]:my-1 [&_a]:underline [&_a]:font-medium [&_ul]:list-disc [&_ul]:pl-4">
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
      ))}
    </div>
  );
}
