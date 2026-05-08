/**
 * Resolves the correct Apex MD intake-form URL for a given brand environment
 * + treatment bundle. Each brand has its own form subdomain; the productid
 * query param identifies the specific product/quiz.
 *
 * The bundle's `externalFormUrl` (or `externalUrl`) returned by the API
 * already encodes the canonical productid against form.apexmd.com — we just
 * swap the host to the active brand. If those fields are missing we fall back
 * to slug-matching the bundle name against the known product list.
 */

const FALLBACK_BASE = "https://form.apexmd.com";

const FORM_BASE_BY_ENV: Record<string, string> = {
  "apex-md": "https://form.apexmd.com",
  "golds-gym": "https://formgolds.apexmd.com",
  "eos-fitness": "https://formeos.apexmd.com",
  "catalyst-fitness": "https://formcatalyst.apexmd.com",
  "club-24": "https://formclub24.apexmd.com",
  "us-cryotherapy": "https://formuscryotherapy.apexmd.com",
  "recovery-project": "https://formrecoveryproject.apexmd.com",
  "10-fitness": "https://form10fitness.apexmd.com",
  "fit-athletic": "https://formfit.apexmd.com",
  "fit-longevity": "https://formfit.apexmd.com",
  "glen-cove": "https://formglencove.apexmd.com",
  "metabolic-method": "https://formmetabolicmethod.apexmd.com",
  "mac": "https://formmac.apexmd.com",
  "vibe": "https://formvibe.apexmd.com",
  "spenga": "https://formspenga.apexmd.com",
};

// Sorted longest-first so substring matching prefers the more specific slug
// (e.g. "compounded-semaglutide-micro" wins over "compounded-semaglutide").
const KNOWN_PRODUCT_SLUGS: string[] = [
  "compounded-semaglutide-micro",
  "compounded-tirzepatide-micro",
  "testosterone-replacement-injection",
  "estradiol-olive-oil-pill-capsule",
  "compounded-semaglutide",
  "compounded-tirzepatide",
  "limitless-semax-selank",
  "semaglutide-odt-micro",
  "tirzepatide-odt-micro",
  "testosterone-cream",
  "testosterone-troche",
  "testosterone-gel",
  "estradiol-cream",
  "estradiol-patch",
  "estriol-cream",
  "passion-oxytocin",
  "sermorelin-injection",
  "sermorelin-odt",
  "nad-injection",
  "nad-nasal-spray",
  "bpc-157-injection",
  "tb-500-injection",
  "pt-141-injection",
  "cjc-ipamorelin",
  "wolverine-stack",
  "glow-stack",
  "ghk-cu-cream",
  "gonadorelin-odt",
  "semaglutide-odt",
  "tirzepatide-odt",
  "enclomiphene",
  "kyzatrex",
  "labs-only",
  "b12-mic",
].sort((a, b) => b.length - a.length);

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/\+/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getFormBaseUrl(envId?: string | null): string {
  if (!envId) return FALLBACK_BASE;
  return FORM_BASE_BY_ENV[envId] ?? FALLBACK_BASE;
}

function extractProductId(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).searchParams.get("productid");
  } catch {
    return null;
  }
}

function extractCategoryId(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).searchParams.get("categoryId");
  } catch {
    return null;
  }
}

function inferProductIdFromName(name: string | null | undefined): string | null {
  if (!name) return null;
  const slug = slugify(name);
  if (!slug) return null;
  if (KNOWN_PRODUCT_SLUGS.includes(slug)) return slug;
  for (const known of KNOWN_PRODUCT_SLUGS) {
    if (slug.includes(known)) return known;
  }
  return null;
}

export interface ResolveTreatmentFormUrlInput {
  envId?: string | null;
  bundleName?: string | null;
  externalUrl?: string | null;
  externalFormUrl?: string | null;
}

export function resolveTreatmentFormUrl(input: ResolveTreatmentFormUrlInput): string {
  const base = getFormBaseUrl(input.envId);

  const productId =
    extractProductId(input.externalFormUrl) ??
    extractProductId(input.externalUrl) ??
    inferProductIdFromName(input.bundleName);

  if (productId) return `${base}?productid=${productId}`;

  const categoryId =
    extractCategoryId(input.externalFormUrl) ?? extractCategoryId(input.externalUrl);
  if (categoryId) return `${base}?categoryId=${categoryId}`;

  return base;
}
