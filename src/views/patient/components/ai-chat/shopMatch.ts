import type { ShopProduct, ShopTab } from "@/types/shop/liveCatalog_types";

/**
 * Map an AI `product_rec` item (a GENERIC supplement name, e.g.
 * "Omega-3 (EPA/DHA fish oil)") to a real storefront product from
 * `GET /api/shop/catalog`.
 *
 * Why this exists: per `docs/chat-structured-response.md` §4a, the AI response
 * carries only `{ name, dose?, rationale?, caution? }` — NO url, image, or price,
 * and names are deliberately brand-free. The doc says: "If you link to a
 * store/product, map it on your side." The buy link is the catalog product's
 * `externalUrl`; the image/price come from the same product.
 *
 * Matching is best-effort by name tokens and intentionally conservative — a
 * wrong buy link is worse than none, so unmatched items fall back to a plain
 * card. A backend-provided product id/slug on the AI item would make this exact.
 */

const STOPWORDS = new Set([
  "with", "and", "the", "for", "plus", "complex", "supplement", "supplements",
  "daily", "capsule", "capsules", "softgel", "softgels", "tablet", "tablets",
  "extract", "powder", "blend", "formula", "high", "strength", "pure",
]);

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ") // drop parenthetical clarifiers
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}

/** Flatten the catalog tree to a de-duplicated list of named products. */
export function flattenProducts(tabs: ShopTab[]): ShopProduct[] {
  const out: ShopProduct[] = [];
  const seen = new Set<string>();
  for (const tab of tabs ?? []) {
    for (const section of tab.sections ?? []) {
      for (const product of section.products ?? []) {
        if (!product.name) continue;
        const key = `${product.name}::${product.externalUrl ?? ""}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(product);
      }
    }
  }
  return out;
}

/**
 * Best matching product for a generic AI supplement name, or null. Scores by
 * shared significant tokens and how much of the product name is covered; needs
 * a token of length ≥ 4 to count, so it won't link on a stray "c" or "d3".
 */
export function matchShopProduct(
  aiName: string,
  products: ShopProduct[],
): ShopProduct | null {
  const aiTokens = new Set(tokenize(aiName));
  if (aiTokens.size === 0) return null;

  let best: ShopProduct | null = null;
  let bestScore = 0;
  let bestCoverage = 0;

  for (const product of products) {
    const pTokens = tokenize(product.name ?? "");
    if (pTokens.length === 0) continue;

    let shared = 0;
    let hasStrongToken = false;
    for (const t of pTokens) {
      if (aiTokens.has(t)) {
        shared += 1;
        if (t.length >= 4) hasStrongToken = true;
      }
    }
    if (shared === 0 || !hasStrongToken) continue;

    const coverage = shared / pTokens.length;
    // Require at least half the product name to be matched, or a 2-token hit.
    if (coverage < 0.5 && shared < 2) continue;

    if (
      shared > bestScore ||
      (shared === bestScore && coverage > bestCoverage)
    ) {
      best = product;
      bestScore = shared;
      bestCoverage = coverage;
    }
  }

  return best;
}
