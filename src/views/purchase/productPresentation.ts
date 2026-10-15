/**
 * How each product looks on its public buy page (`/buy/<formKey>`). The name and price always come
 * from the API; this only adds the picture and marketing copy. A product with no entry here gets
 * the plain layout — product name, description and checkout.
 *
 * Copy is the client's own: the concierge lines are from the Concierge Membership artwork, the
 * physician section from the Apex MD site.
 */

export type FeatureIcon = "dna" | "user" | "shield" | "refresh" | "video" | "calendar" | "chart" | "heart";

export interface ProductPresentation {
  image: string;
  imageAlt: string;
  eyebrow: string;
  /** Headline: a plain lead-in, then the red italic accent. */
  title: { lead: string; accent: string };
  tagline: string;
  description: string;
  features: { icon: FeatureIcon; title: string; text?: string }[];
  /** Show the Chief Medical Officer section below the hero. */
  showPhysician: boolean;
}

const CONCIERGE: ProductPresentation = {
  image: "/images/buy/concierge-membership.webp",
  imageAlt: "Apex MD Concierge Membership",
  eyebrow: "Concierge membership",
  title: { lead: "Apex MD", accent: "Concierge Membership" },
  tagline: "Exceptional care. Extraordinary results.",
  description:
    "Personalized medicine with physician-led care, advanced diagnostics, and proactive strategies to optimize your healthspan.",
  features: [
    { icon: "dna", title: "Advanced diagnostics" },
    { icon: "user", title: "Personalized protocols" },
    { icon: "shield", title: "Physician-led care" },
    { icon: "refresh", title: "Proactive optimization" },
  ],
  showPhysician: true,
};

const BY_FORM_KEY: Record<string, ProductPresentation> = {
  concierge_intake_test: CONCIERGE,
};

export function presentationFor(formKey: string): ProductPresentation | null {
  return BY_FORM_KEY[formKey] ?? null;
}

/** Chief Medical Officer section, as on the Apex MD site. */
export const PHYSICIAN = {
  photo: "/images/buy/dr-bowen.webp",
  eyebrow: "Leadership. Innovation. Results.",
  title: { lead: "Apex MD", accent: "History of Excellence" },
  intro:
    "Apex MD’s Chief Medical Officer Dr. Jim Bowen oversees all 1,000 Apex MD physicians and is the lead programmer of Apex MD AI.",
  points: [
    "#1 Rated Longevity Physician in Florida",
    "Helped Build the #1 Longevity Clinic in the World",
    "Mayo Clinic Award-Winning Physician",
    "Current American Cancer Society Board Member",
    "Former Chief of Medical Staff of the United States Navy",
    "Wrote the Protocols for the US Navy SEALs",
    "Personally Served the Royal Family of the UAE",
    "40 Years of Medical Practice",
  ],
};
