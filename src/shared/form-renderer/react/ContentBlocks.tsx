// GENERATED from apex-form-renderer/src — do not edit here. Edit there, then run `npm run sync`.
import ReactMarkdown from "react-markdown";
import { AlertTriangle, Info, LifeBuoy } from "lucide-react";
import type { ContentBlockData, ContentSeverity } from "../types";

/**
 * Authored clinical copy. It is content, not decoration, and always shows. `crisis` is unmissable
 * and keeps its fixed look whatever the theme says. Links open in a new tab.
 */
const ICONS: Record<ContentSeverity, JSX.Element> = {
  info: <Info className="mt-0.5 h-4 w-4 shrink-0 opacity-60" />,
  warning: <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />,
  crisis: <LifeBuoy className="mt-0.5 h-5 w-5 shrink-0" />,
};

export function ContentBlocks({ content }: { content: ContentBlockData[] | null | undefined }) {
  if (!content?.length) return null;
  return (
    <div className="flex flex-col gap-3">
      {content.map((c, i) => (
        <div key={c.ref || i} className="apx-content" data-severity={c.severity}>
          {ICONS[c.severity] ?? ICONS.info}
          <div className="min-w-0 [&_a]:font-medium [&_a]:underline [&_p]:my-1 [&_ul]:list-disc [&_ul]:pl-4">
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
