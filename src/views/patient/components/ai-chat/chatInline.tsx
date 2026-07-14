import React from "react";

/**
 * Lightweight inline formatter for chat block text.
 * Mirrors the mockup's `inline.js` — the only supported inline markup is
 * `**bold**`; everything else renders as plain text (React escapes it).
 */
export function InlineText({ text }: { text?: string | null }): React.ReactElement {
  const value = text == null ? "" : String(text);
  const parts: React.ReactNode[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = re.exec(value)) !== null) {
    if (match.index > lastIndex) {
      parts.push(value.slice(lastIndex, match.index));
    }
    parts.push(<b key={`b${key++}`}>{match[1]}</b>);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < value.length) parts.push(value.slice(lastIndex));

  return <>{parts}</>;
}
