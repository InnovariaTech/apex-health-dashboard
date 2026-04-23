import type {
  CommunicationAuthor,
  CommunicationCommentItem,
} from "@/types/care-validate/communication_types";

const STAFF_LASTNAME_KEYWORDS = [
  "care team",
  "support team",
  "carebuddy",
  "lab team",
  "medical team",
];

function looksLikeStaffLastName(lastName: string): boolean {
  const value = lastName.trim().toLowerCase();
  if (!value) return false;
  if (value === "team") return true;
  if (value.startsWith("-")) return true;
  return STAFF_LASTNAME_KEYWORDS.some((keyword) => value.includes(keyword));
}

const KNOWN_PROVIDER_FIRSTNAMES = new Set(["tiffany"]);
const KNOWN_PROVIDER_LASTNAMES = new Set(["alexander"]);

function looksLikeKnownProvider(author: CommunicationAuthor): boolean {
  const first = (author.firstName ?? "").trim().toLowerCase();
  const last = (author.lastName ?? "").trim().toLowerCase();
  return KNOWN_PROVIDER_FIRSTNAMES.has(first) && KNOWN_PROVIDER_LASTNAMES.has(last);
}

export function findPatientAuthor(comments: CommunicationCommentItem[]): CommunicationAuthor | null {
  const byId = new Map<string, { author: CommunicationAuthor; count: number }>();

  for (const comment of comments) {
    if (!comment.author?.id) continue;
    const lastName = (comment.author.lastName ?? "").trim();
    if (looksLikeStaffLastName(lastName)) continue;
    if (looksLikeKnownProvider(comment.author)) continue;

    const existing = byId.get(comment.author.id);
    if (existing) existing.count += 1;
    else byId.set(comment.author.id, { author: comment.author, count: 1 });
  }

  if (byId.size === 0) return null;
  let best: { author: CommunicationAuthor; count: number } | null = null;
  for (const item of byId.values()) {
    if (!best || item.count > best.count) best = item;
  }
  return best?.author ?? null;
}

export function formatAuthorName(author: CommunicationAuthor | null): string {
  if (!author) return "Care Team";
  const first = (author.firstName ?? "").trim();
  const last = (author.lastName ?? "").trim();
  const fullName = [first, last].filter(Boolean).join(" ").trim();
  return fullName.length > 0 ? fullName : "Care Team";
}
