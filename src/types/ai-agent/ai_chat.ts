export interface SendAiChatMessageBody {
  message: string;
  isHidden?: boolean;
  sessionId?: string;
}

/* ─────────────────────────────────────────────────────────────
   Structured chat blocks — the closed vocabulary the backend
   streams once `CHAT_STRUCTURED_OUTPUT` is on. Shapes mirror
   docs/chat-structured-response (1).md §3 exactly.
   ───────────────────────────────────────────────────────────── */

/** A single labelled value in a lab_snapshot column. */
export interface ChatMarker {
  name: string;
  value: string;
  note?: string;
}

export interface ChatIntroBlock {
  type: "intro";
  text: string;
}

export interface ChatSectionBlock {
  type: "section";
  label: string;
}

export interface ChatLabSnapshotBlock {
  type: "lab_snapshot";
  eyebrow?: string;
  title?: string;
  tag?: string;
  watchLabel?: string;
  strengths: ChatMarker[];
  watch: ChatMarker[];
}

export interface ChatPriorityBlock {
  type: "priority";
  num: string;
  title: string;
  strategyLabel?: string;
  driver?: {
    markers: { label: string; value: string }[];
    note?: string;
  };
  strategy: { status: "ok" | "warn"; text: string }[];
  workouts: {
    badge: { kind: "freq" | "label"; value: string };
    text: string;
    sub?: string;
  }[];
}

export type ChatPhaseCategory =
  | "strength"
  | "cardio"
  | "nutrition"
  | "hydration"
  | "recovery";

export interface ChatPhasePlanBlock {
  type: "phase_plan";
  eyebrow?: string;
  title?: string;
  tag?: string;
  phases: {
    num: string;
    weeks: string;
    name: string;
    goal: string;
    retest?: boolean;
    items: {
      cat: ChatPhaseCategory;
      text: string;
      freq?: string;
      sub?: string;
    }[];
  }[];
}

export interface ChatCalloutBlock {
  type: "callout";
  text: string;
}

/** Storefront card the backend embeds on a `product_rec` item when the
    suggestion maps to a real shop product. `externalUrl` is the checkout link
    (`""` = not connected yet → render inert). All commerce fields optional. */
export interface ChatProductCard {
  slug?: string;
  img?: string;
  /** Background colour behind the image tile. */
  tile?: string;
  price?: string;
  /** Price suffix, e.g. "/mo". */
  per?: string;
  sectionTitle?: string;
  externalUrl?: string;
}

/** One supplement suggestion inside a `product_rec` block (§4a).
    `dose`/`rationale`/`caution` are optional — guard for absence.
    When the suggestion maps to a shop product the backend attaches `slug` +
    `card` (image/price/buy link); older responses may omit them. */
export interface ChatProductRecItem {
  name: string;
  dose?: string;
  rationale?: string;
  caution?: string;
  slug?: string;
  card?: ChatProductCard;
}

/** Supplement suggestions for ONE category (§4a). `label` is the
    category name, e.g. "Cardiovascular". */
export interface ChatProductRecBlock {
  type: "product_rec";
  label: string;
  items: ChatProductRecItem[];
}

export interface ChatMarkdownBlock {
  type: "markdown";
  text: string;
}

export type ResponseBlock =
  | ChatIntroBlock
  | ChatSectionBlock
  | ChatLabSnapshotBlock
  | ChatPriorityBlock
  | ChatPhasePlanBlock
  | ChatCalloutBlock
  | ChatProductRecBlock
  | ChatMarkdownBlock;

export interface AiChatStreamHandlers {
  onText?: (chunk: string) => void;
  onStatus?: (status: string) => void;
  /** Fires once, before any block, with the disclaimer + schema version. */
  onMeta?: (meta: { schemaVersion: string; disclaimer: string }) => void;
  /** Fires per structured block, in order, as each completes. */
  onBlock?: (block: ResponseBlock) => void;
  onDone?: (sessionId: string) => void;
  onError?: (message: string) => void;
}

export interface AiChatStreamResult {
  /** Accumulated legacy `text` deltas (empty in structured mode). */
  fullText: string;
  /** Ordered structured blocks (empty in legacy mode). */
  blocks: ResponseBlock[];
  /** Medical disclaimer from the `meta` event, if any. */
  disclaimer: string | null;
  /** Block-contract version from the `meta` event, if any. */
  schemaVersion: string | null;
  sessionId: string | null;
}
