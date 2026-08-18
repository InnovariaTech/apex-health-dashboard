/**
 * Live shop catalog types — the wire contract for `GET /api/shop/catalog`
 * (see `docs/shop/patient-catalog.md`). These mirror the static demo shape in
 * `src/data/shop/apexShopCatalog.ts` field-for-field, so the same renderer in
 * `views/patient/pages/Shop.tsx` drives both.
 *
 * Serializer guarantees you can rely on (do NOT re-sort; render in order):
 *  - Optional keys are OMITTED, never `null` (branch on truthiness).
 *  - Only `desc` and `externalUrl` are always present on a product.
 *  - `type: "standard"` is never sent — absence means standard.
 *  - `badge` appears only when it has both text and colour.
 *  - `clickable` appears only when `true`; `features[].inc` only when `false`.
 *  - Tab/section `id` is the human key ("medical", "weight-loss"), not a uuid.
 *  - Empty sections/tabs are dropped, so `tabs: []` just means "nothing published".
 */

export type AccentKey =
  | "blue"
  | "purple"
  | "teal"
  | "pink"
  | "orange"
  | "green"
  | "red"
  | "grey"
  | "black";

export type TabIconKey =
  | "medical"
  | "supplements"
  | "memberships"
  | "programs"
  | "training";

export interface ShopBadge {
  text: string;
  color: "blue" | "red" | "green" | "purple" | "soon";
}

export interface ShopFeature {
  name: string;
  desc: string;
  /** `false` = not included (renders a dash instead of a check). Absent = included. */
  inc?: boolean;
}

export interface ShopProduct {
  name?: string;
  desc: string;
  img?: string;
  tile?: string;
  fit?: "cover" | "contain" | "poster" | "fill";
  price?: string;
  per?: string;
  topPrice?: string;
  topNote?: string;
  badge?: ShopBadge;
  cta?: string;
  clickable?: boolean;
  soon?: string;
  features?: ShopFeature[];
  /** `standard` is never emitted — absence means standard. */
  type?: "intro" | "plan";
  lead?: string;
  lead2?: string;
  /** Checkout URL. Always present; `""` means "not connected yet" — render inert. */
  externalUrl: string;
}

export interface ShopSection {
  id: string;
  accent: AccentKey;
  badge: string;
  title: string;
  sub: string;
  /** Optional right-aligned action button (e.g. "Take the quiz"). */
  action?: string;
  /** External URL for the action button. Empty/absent = inert. */
  actionUrl?: string;
  products: ShopProduct[];
}

export interface ShopPill {
  label: string;
  /** Key of the section this chip scrolls to — matches a `ShopSection.id`. */
  sec: string;
}

export interface ShopTab {
  id: string;
  label: string;
  icon: TabIconKey;
  planIcon?: "memberships" | "programs" | "training";
  pills?: ShopPill[];
  sections: ShopSection[];
}

/** `data` payload of `GET /api/shop/catalog`. */
export interface ShopCatalogData {
  environment: string;
  tabs: ShopTab[];
}
