/**
 * Static catalog types — mirrors `src/data/shop/apexmdCatalog.json`.
 *
 * The Shop page renders this catalog without any backend. Items either
 * link to an external order form (medical) or open an inline detail
 * dialog with a placeholder "Contact to purchase" CTA (everything else).
 *
 * Keep fields optional where the JSON varies between rows — e.g. some
 * supplements have empty `flavors`, some memberships add a `headerText`
 * style override, only PT packages carry `pricePerSession`.
 */

// ─── Medical (categories → sections → products) ─────────────────────────────

export interface MedicalProduct {
  name: string;
  /** Display string verbatim, e.g. `"$299/mo"`. */
  price: string;
  /** External order/form URL — opens in a new tab. */
  url: string;
  badge?: string | null;
  desc: string;
  image: string;
}

export interface MedicalSection {
  id: string;
  label: string;
  tagline: string;
  /** Tailwind class hint from the JSON. UI uses it as a colour token. */
  badgeColor: string;
  quizUrl: string;
  description: string;
  products: MedicalProduct[];
}

export interface MedicalCategory {
  id: string;
  label: string;
  /** Name of a lucide-react icon — resolved at render time. */
  icon: string;
  sections: MedicalSection[];
}

// ─── Supplements ────────────────────────────────────────────────────────────

export interface SupplementItem {
  id: number;
  name: string;
  tagline: string;
  /** Numeric price — UI formats with currency symbol. */
  price: number;
  unit: string;
  flavors: string[];
  /**
   * Marketing extras — the new Apex-supplied items only carry the
   * essentials (name/price/image/flavors). Cards / modals render the
   * additional fields only when present.
   */
  badge?: string;
  badgeColor?: string;
  rating?: number;
  reviews?: number;
  description?: string;
  benefits?: string[];
  image: string;
}

// ─── Memberships ────────────────────────────────────────────────────────────

export interface MembershipPlan {
  id: number;
  name: string;
  price: number;
  period: string;
  color: string;
  headerBg: string;
  headerText?: string;
  badge?: string;
  /** Static flag from JSON — pre-shipped data, not actual subscription state. */
  current?: boolean;
  /** Optional hero image — used by the dashboard Store tile. Gym tiers omit it. */
  image?: string;
  features: string[];
}

// ─── Training programs ──────────────────────────────────────────────────────

export interface TrainingProgram {
  id: number;
  name: string;
  tagline: string;
  price: number;
  duration: string;
  sessions: string;
  level: string;
  badge: string;
  badgeColor: string;
  description: string;
  includes: string[];
  image: string;
  coach: string;
}

// ─── Personal training packages ─────────────────────────────────────────────

export interface PersonalTrainingPackage {
  id: number;
  name: string;
  sessions: number;
  price: number;
  pricePerSession: number;
  popular: boolean;
  features: string[];
}

// ─── Top-level catalog ──────────────────────────────────────────────────────

export interface ShopCatalog {
  /** `"apexmd"` today; a future gym build may ship a sibling catalog. */
  environment: string;
  medicalCategories: MedicalCategory[];
  supplements: SupplementItem[];
  memberships: MembershipPlan[];
  programs: TrainingProgram[];
  personalTrainingPackages: PersonalTrainingPackage[];
}
