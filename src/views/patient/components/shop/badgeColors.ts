/**
 * Medical product badges in the static catalog are bare strings — no
 * accompanying `badgeColor`. This map gives every known badge a
 * semantic colour token (Tailwind class) so "Most Popular", "Strongest",
 * "Best Value", etc. read at a glance.
 *
 * Supplements and training programs already carry `badgeColor` in the
 * JSON, so they bypass this map and use their per-row colour directly.
 * Unknown badge strings fall back to a neutral foreground pill.
 */
const MEDICAL_BADGE_COLORS: Record<string, string> = {
  // Winners / volume signals
  "Most Popular": "bg-blue-600",
  Popular: "bg-blue-600",
  "Most Common": "bg-blue-500",
  "Best Seller": "bg-blue-600",
  "Top Rated": "bg-blue-500",

  // Intensity / power
  Strongest: "bg-red-600",
  Elite: "bg-red-600",

  // Value / savings
  "Best Value": "bg-emerald-600",

  // Curated picks
  "Top Pick": "bg-violet-600",
  "Coach Pick": "bg-purple-500",

  // Newness
  New: "bg-cyan-500",
  "New Formula": "bg-cyan-500",

  // Sophistication
  Advanced: "bg-indigo-600",

  // Foundational / scientific
  Essential: "bg-amber-500",
  "Science-Backed": "bg-green-600",

  // Composition
  Blend: "bg-pink-500",

  // Entry point
  "Start Here": "bg-sky-500",
};

/** Tailwind background class for a medical product badge, or a neutral fallback. */
export function getMedicalBadgeColor(
  badge: string | null | undefined,
): string {
  if (!badge) return "";
  return MEDICAL_BADGE_COLORS[badge] ?? "bg-foreground";
}
