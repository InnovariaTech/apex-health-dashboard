const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "b",
  "strong",
  "i",
  "em",
  "u",
  "ul",
  "ol",
  "li",
  "span",
  "div",
  "a",
]);

export function sanitizeDescription(html: string): string {
  if (!html) return "";

  let output = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");

  output = output.replace(/\s(on\w+|style|class|face|color|size)="[^"]*"/gi, "");
  output = output.replace(/\s(on\w+|style|class|face|color|size)='[^']*'/gi, "");
  output = output.replace(/<\/?o:[^>]+>/gi, "");

  output = output.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, (tagMatch, tagName) =>
    ALLOWED_TAGS.has(String(tagName).toLowerCase()) ? tagMatch : ""
  );

  output = output.replace(/<a\b([^>]*)>/gi, (_match, attributes) => {
    const hrefMatch = /href="([^"]*)"/i.exec(attributes) || /href='([^']*)'/i.exec(attributes);
    const href = hrefMatch ? hrefMatch[1] : "#";
    return `<a href="${href}" target="_blank" rel="noopener noreferrer">`;
  });

  return output.trim();
}

export function htmlToPlainText(html: string): string {
  if (!html) return "";

  return html
    .replace(/<\/?[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}
