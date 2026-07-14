/**
 * Apex MD Shop — catalog data, ported from the `apex-md-shop` New UI demo
 * (`data/photos.js` + `data/products.js` + the `TABS` config in `js/app.js`).
 *
 * Images live in `public/shop/apex-md-shop/img/` and are referenced by
 * absolute path (`/shop/apex-md-shop/img/...`).
 *
 * EXTERNAL LINKS: every purchasable product carries an `externalUrl` field.
 * It's `""` (empty) until the real store/checkout URL is supplied — the UI
 * renders the "Shop"/CTA as inert when empty and as an external link when set.
 * See the "Products needing an external link" list handed back with this work.
 */

const IMG = "/shop/apex-md-shop/img";

// ─── Photo map (key → { src, bg }) ─────────────────────────────────────────

export const PHOTO: Record<string, { src: string; bg: string }> = {
  semaVial: { src: `${IMG}/semaVial.jpg`, bg: "#535353" },
  tirzVial: { src: `${IMG}/tirzVial.jpg`, bg: "#535353" },
  semaODT: { src: `${IMG}/semaODT.jpg`, bg: "#4f4f4f" },
  tirzODT: { src: `${IMG}/tirzODT.jpg`, bg: "#4f4f4f" },
  t2: { src: `${IMG}/t2.jpg`, bg: "#4f4f4f" },
  enclo: { src: `${IMG}/enclo.png`, bg: "#4f4f4f" },
  gel: { src: `${IMG}/gel.jpg`, bg: "#4f4f4f" },
  oral: { src: `${IMG}/oral.jpg`, bg: "#4f4f4f" },
  s_whey_van: { src: `${IMG}/s_whey_van.jpg`, bg: "#ffffff" },
  s_whey_choc: { src: `${IMG}/s_whey_choc.jpg`, bg: "#ffffff" },
  s_whey_cin: { src: `${IMG}/s_whey_cin.jpg`, bg: "#ffffff" },
  s_vegan_van: { src: `${IMG}/s_vegan_van.jpg`, bg: "#ffffff" },
  s_vegan_choc: { src: `${IMG}/s_vegan_choc.jpg`, bg: "#ffffff" },
  s_pre_peach: { src: `${IMG}/s_pre_peach.jpg`, bg: "#ffffff" },
  s_pre_trop: { src: `${IMG}/s_pre_trop.jpg`, bg: "#ffffff" },
  s_pre_water: { src: `${IMG}/s_pre_water.jpg`, bg: "#ffffff" },
  s_bcaa_water: { src: `${IMG}/s_bcaa_water.jpg`, bg: "#ffffff" },
  s_bcaa_apple: { src: `${IMG}/s_bcaa_apple.jpg`, bg: "#ffffff" },
  s_creatine: { src: `${IMG}/s_creatine.jpg`, bg: "#ffffff" },
  s_probiotic: { src: `${IMG}/s_probiotic.jpg`, bg: "#ffffff" },
  s_womensmulti: { src: `${IMG}/s_womensmulti.jpg`, bg: "#ffffff" },
  s_k2d3: { src: `${IMG}/s_k2d3.jpg`, bg: "#ffffff" },
  s_superfood: { src: `${IMG}/s_superfood.jpg`, bg: "#ffffff" },
  s_omega3: { src: `${IMG}/s_omega3.jpg`, bg: "#ffffff" },
  s_mensmulti: { src: `${IMG}/s_mensmulti.jpg`, bg: "#ffffff" },
  s_glutamine: { src: `${IMG}/s_glutamine.jpg`, bg: "#ffffff" },
  penSema: { src: `${IMG}/penSema.jpg`, bg: "#ffffff" },
  penTirz: { src: `${IMG}/penTirz.jpg`, bg: "#ffffff" },
  kitTirz: { src: `${IMG}/kitTirz.jpg`, bg: "#ffffff" },
  labBlood: { src: `${IMG}/labBlood.jpg`, bg: "#ffffff" },
  labBioage: { src: `${IMG}/labBioage.jpg`, bg: "#0a0a0a" },
  labFood: { src: `${IMG}/labFood.jpg`, bg: "#ffffff" },
  labMicro: { src: `${IMG}/labMicro.jpg`, bg: "#000000" },
  labGenetics: { src: `${IMG}/labGenetics.jpg`, bg: "#022649" },
  labMicrobiome: { src: `${IMG}/labMicrobiome.jpg`, bg: "#000000" },
  pbWolverine: { src: `${IMG}/pbWolverine.png`, bg: "#ffffff" },
  pbCJC: { src: `${IMG}/pbCJC.png`, bg: "#ffffff" },
  pbSemax: { src: `${IMG}/pbSemax.png`, bg: "#ffffff" },
  pbWolverinePen: { src: `${IMG}/pbWolverinePen.jpg`, bg: "#ffffff" },
  pbTesaPen: { src: `${IMG}/pbTesaPen.jpg`, bg: "#ffffff" },
  pbCjcPen: { src: `${IMG}/pbCjcPen.jpg`, bg: "#ffffff" },
  pbSemaxPen: { src: `${IMG}/pbSemaxPen.jpg`, bg: "#ffffff" },
  pbGlowPen: { src: `${IMG}/pbGlowPen.jpg`, bg: "#ffffff" },
  pbTesaIpa: { src: `${IMG}/pbTesaIpa.jpg`, bg: "#ffffff" },
  pbGlow: { src: `${IMG}/pbGlow.png`, bg: "#ffffff" },
  glp1Men: { src: `${IMG}/glp1Men.jpg`, bg: "#000000" },
  glp1Women: { src: `${IMG}/glp1Women.jpg`, bg: "#000000" },
  boneGrowth: { src: `${IMG}/boneGrowth.jpg`, bg: "#000000" },
  glutes: { src: `${IMG}/glutes.jpg`, bg: "#000000" },
  backPain: { src: `${IMG}/backPain.jpg`, bg: "#000000" },
  postBaby: { src: `${IMG}/postBaby.jpg`, bg: "#000000" },
  tennisW: { src: `${IMG}/tennisW.jpg`, bg: "#000000" },
  hrtEstrogen: { src: `${IMG}/hrtEstrogen.jpg`, bg: "#ffffff" },
  hrtEnclomiphene: { src: `${IMG}/hrtEnclomiphene.jpg`, bg: "#ffffff" },
  hrtProgesterone: { src: `${IMG}/hrtProgesterone.jpg`, bg: "#ffffff" },
  hrtIntro: { src: `${IMG}/hrtIntro.jpg`, bg: "#ffffff" },
  cgBiomarker: { src: `${IMG}/cgBiomarker.jpg`, bg: "#1a1a1a" },
  cgTele: { src: `${IMG}/cgTele.jpg`, bg: "#1a1a1a" },
  cgLongevity: { src: `${IMG}/cgLongevity.jpg`, bg: "#1a1a1a" },
  pepBpc: { src: `${IMG}/pepBpc.jpg`, bg: "#ffffff" },
  pepNad: { src: `${IMG}/pepNad.jpg`, bg: "#ffffff" },
  pepNadSpray: { src: `${IMG}/pepNadSpray.jpg`, bg: "#ffffff" },
  pepSermorelin: { src: `${IMG}/pepSermorelin.jpg`, bg: "#ffffff" },
  pepSermorelinODT: { src: `${IMG}/pepSermorelinODT.jpg`, bg: "#ffffff" },
  pepTesa: { src: `${IMG}/pepTesa.jpg`, bg: "#ffffff" },
  pepMotsc: { src: `${IMG}/pepMotsc.jpg`, bg: "#ffffff" },
  pepEpitalon: { src: `${IMG}/pepEpitalon.jpg`, bg: "#ffffff" },
  pepGhkcu: { src: `${IMG}/pepGhkcu.jpg`, bg: "#ffffff" },
  pepPt141: { src: `${IMG}/pepPt141.jpg`, bg: "#ffffff" },
  tennis: { src: `${IMG}/tennis.jpg`, bg: "#000000" },
};

// ─── Types ─────────────────────────────────────────────────────────────────

export interface ShopBadge {
  text: string;
  color: "blue" | "red" | "green" | "purple" | "soon";
}

export interface ShopFeature {
  name: string;
  desc: string;
  /** `false` = not included (renders a dash instead of a check). */
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
  /** HRT "Don't know what you want?" intro card. */
  type?: "intro" | "plan";
  lead?: string;
  lead2?: string;
  /**
   * External store / checkout URL for the "Shop" / CTA button.
   * Empty string = not yet connected (button renders inert).
   */
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
  /** External URL for the section action button. Empty = inert. */
  actionUrl?: string;
  products: ShopProduct[];
}

export interface ShopPill {
  label: string;
  sec: string;
}

export type TabIconKey =
  | "medical"
  | "supplements"
  | "memberships"
  | "programs"
  | "training";

export interface ShopTab {
  id: string;
  label: string;
  icon: TabIconKey;
  planIcon?: "memberships" | "programs" | "training";
  pills?: ShopPill[];
  sections: ShopSection[];
}

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

// Accent key → CSS color (mirrors `ACC` in the demo's app.js).
export const ACC: Record<AccentKey, string> = {
  blue: "var(--shop-blue)",
  purple: "var(--shop-purple)",
  teal: "var(--shop-teal)",
  pink: "var(--shop-pink)",
  orange: "var(--shop-orange)",
  green: "var(--shop-green)",
  red: "var(--shop-accent)",
  grey: "#6b7280",
  black: "var(--shop-black)",
};

// ─── Products ──────────────────────────────────────────────────────────────

const wl: ShopProduct[] = [
  { name: "Compounded Semaglutide", img: PHOTO.semaVial!.src, tile: PHOTO.semaVial!.bg, fit: "contain", desc: "Injectable compounded semaglutide for effective, sustained weight loss.", price: "$299", per: "/mo", badge: { text: "Most Popular", color: "blue" }, externalUrl: "" },
  { name: "Compounded Tirzepatide", img: PHOTO.tirzVial!.src, tile: PHOTO.tirzVial!.bg, fit: "contain", desc: "Dual GIP/GLP-1 agonist for maximum metabolic impact.", price: "$399", per: "/mo", badge: { text: "Strongest", color: "red" }, externalUrl: "" },
  { name: "Semaglutide ODT", img: PHOTO.semaODT!.src, tile: PHOTO.semaODT!.bg, fit: "contain", desc: "Oral dissolving tablet — no injections required.", price: "$349", per: "/mo", externalUrl: "" },
  { name: "Tirzepatide ODT", img: PHOTO.tirzODT!.src, tile: PHOTO.tirzODT!.bg, fit: "contain", desc: "Oral tirzepatide for dual-action weight management.", price: "$419", per: "/mo", externalUrl: "" },
  { name: "Semaglutide Microdose", img: PHOTO.semaVial!.src, tile: PHOTO.semaVial!.bg, fit: "contain", desc: "Micro-dosing protocol ideal for beginners or maintenance.", price: "$249", per: "/mo", badge: { text: "Best Value", color: "green" }, externalUrl: "" },
  { name: "Tirzepatide Microdose", img: PHOTO.tirzVial!.src, tile: PHOTO.tirzVial!.bg, fit: "contain", desc: "Low-dose tirzepatide for gradual, sustainable results.", price: "$249", per: "/mo", externalUrl: "" },
  { name: "Semaglutide ODT Microdose", img: PHOTO.semaODT!.src, tile: PHOTO.semaODT!.bg, fit: "contain", desc: "Oral micro-dose semaglutide — easy and convenient.", price: "$249", per: "/mo", externalUrl: "" },
  { name: "Tirzepatide ODT Microdose", img: PHOTO.tirzODT!.src, tile: PHOTO.tirzODT!.bg, fit: "contain", desc: "Oral micro-dose tirzepatide for gentle weight management.", price: "$249", per: "/mo", externalUrl: "" },
  { name: "Semaglutide Pen", img: PHOTO.penSema!.src, tile: "#ffffff", fit: "contain", desc: "Once-weekly subcutaneous semaglutide in a simple auto-injector pen.", soon: "Coming September 2026", badge: { text: "Coming Soon", color: "soon" }, externalUrl: "" },
  { name: "Tirzepatide Pen", img: PHOTO.penTirz!.src, tile: "#ffffff", fit: "contain", desc: "Once-weekly subcutaneous tirzepatide in a simple auto-injector pen.", soon: "Coming September 2026", badge: { text: "Coming Soon", color: "soon" }, externalUrl: "" },
  { name: "Tirzepatide Travel Kit", img: PHOTO.kitTirz!.src, tile: "#ffffff", fit: "contain", desc: "Insulated travel case with digital thermometer, ice packs, and Tirzepatide pens — keeps your medication cool on the go.", soon: "Coming September 2026", badge: { text: "Coming Soon", color: "soon" }, externalUrl: "" },
];

const trt: ShopProduct[] = [
  { name: "Testosterone Cypionate", img: PHOTO.t2!.src, tile: PHOTO.t2!.bg, fit: "contain", desc: "Injectable testosterone cypionate with anastrozole, monitored with ongoing labs.", price: "$199", per: "/month", badge: { text: "Most Popular", color: "blue" }, externalUrl: "" },
  { name: "Enclomiphene Citrate", img: PHOTO.enclo!.src, tile: PHOTO.enclo!.bg, fit: "contain", desc: "Oral capsules that boost natural testosterone while preserving fertility.", price: "$199", per: "/month", externalUrl: "" },
  { name: "TRT Gel", img: PHOTO.gel!.src, tile: PHOTO.gel!.bg, fit: "contain", desc: "Topical testosterone gel — a needle-free daily application.", price: "$199", per: "/month", externalUrl: "" },
  { name: "Oral TRT", img: PHOTO.oral!.src, tile: PHOTO.oral!.bg, fit: "contain", desc: "Daily oral testosterone replacement — no injections required.", price: "$199", per: "/month", externalUrl: "" },
];

const hrt: ShopProduct[] = [
  { type: "intro", img: PHOTO.hrtIntro!.src, lead: "Don't know", lead2: "what you want?", desc: "Click here to get started with labs and physician consult to see if HRT is right for you.", cta: "Get Started", externalUrl: "" },
  { name: "Estrogen", img: PHOTO.hrtEstrogen!.src, tile: PHOTO.hrtEstrogen!.bg, fit: "contain", desc: "Bioidentical estrogen 4mg/gm topical cream with SmartPump® metered dosing.", price: "$199", per: "/month", externalUrl: "" },
  { name: "Enclomiphene Citrate", img: PHOTO.hrtEnclomiphene!.src, tile: PHOTO.hrtEnclomiphene!.bg, fit: "contain", desc: "Oral enclomiphene citrate capsules to support healthy, natural hormone production.", price: "$199", per: "/month", externalUrl: "" },
  { name: "Progesterone", img: PHOTO.hrtProgesterone!.src, tile: PHOTO.hrtProgesterone!.bg, fit: "contain", desc: "Bioidentical progesterone, 60 capsules for hormone balance and better sleep.", price: "$199", per: "/month", externalUrl: "" },
];

const peptides: ShopProduct[] = [
  { name: "BPC-157", img: PHOTO.pepBpc!.src, tile: PHOTO.pepBpc!.bg, fit: "contain", desc: "Recovery and gut-health peptide for tissue repair.", price: "$159", per: "/mo", badge: { text: "Most Popular", color: "blue" }, externalUrl: "" },
  { name: "NAD+", img: PHOTO.pepNad!.src, tile: PHOTO.pepNad!.bg, fit: "contain", desc: "Cellular energy and longevity support for metabolism, focus, and recovery.", price: "$199", per: "/mo", externalUrl: "" },
  { name: "NAD+ Nasal Spray", img: PHOTO.pepNadSpray!.src, tile: PHOTO.pepNadSpray!.bg, fit: "contain", desc: "Convenient intranasal NAD+ for daily cellular energy — 30 mg per spray.", price: "$149", per: "/mo", externalUrl: "" },
  { name: "Sermorelin", img: PHOTO.pepSermorelin!.src, tile: PHOTO.pepSermorelin!.bg, fit: "contain", desc: "GH-axis peptide supporting recovery, sleep, and body composition.", price: "$189", per: "/mo", externalUrl: "" },
  { name: "Sermorelin ODT", img: PHOTO.pepSermorelinODT!.src, tile: PHOTO.pepSermorelinODT!.bg, fit: "contain", desc: "Oral dissolving GH-axis peptide — no injections required.", price: "$179", per: "/mo", externalUrl: "" },
  { name: "Tesamorelin", img: PHOTO.pepTesa!.src, tile: PHOTO.pepTesa!.bg, fit: "contain", desc: "Targeted visceral-fat reduction and GH support.", price: "$269", per: "/mo", externalUrl: "" },
  { name: "MOTS-C", img: PHOTO.pepMotsc!.src, tile: PHOTO.pepMotsc!.bg, fit: "contain", desc: "Mitochondrial peptide for metabolic health, endurance, and energy.", price: "$219", per: "/mo", externalUrl: "" },
  { name: "Epitalon", img: PHOTO.pepEpitalon!.src, tile: PHOTO.pepEpitalon!.bg, fit: "contain", desc: "Telomere-supporting longevity peptide for healthy aging.", price: "$199", per: "/mo", externalUrl: "" },
  { name: "GHK-Cu", img: PHOTO.pepGhkcu!.src, tile: PHOTO.pepGhkcu!.bg, fit: "contain", desc: "Copper peptide for skin, hair, and tissue regeneration.", price: "$179", per: "/mo", externalUrl: "" },
  { name: "PT-141", img: PHOTO.pepPt141!.src, tile: PHOTO.pepPt141!.bg, fit: "contain", desc: "Libido and sexual-wellness peptide therapy.", price: "$139", per: "/mo", externalUrl: "" },
];

const peptideBlends: ShopProduct[] = [
  { name: "Wolverine", img: PHOTO.pbWolverine!.src, tile: PHOTO.pbWolverine!.bg, fit: "contain", desc: "BPC-157 / TB-500 recovery blend for accelerated tissue repair and full-body recovery.", price: "$239", per: "/mo", badge: { text: "Most Popular", color: "blue" }, externalUrl: "" },
  { name: "Wolverine Pen", img: PHOTO.pbWolverinePen!.src, tile: PHOTO.pbWolverinePen!.bg, fit: "contain", desc: "The Wolverine BPC-157 / TB-500 blend in a simple once-weekly auto-injector pen.", price: "$269", per: "/mo", soon: "Coming September 2026", badge: { text: "Coming Soon", color: "soon" }, externalUrl: "" },
  { name: "CJC-1295", img: PHOTO.pbCJC!.src, tile: PHOTO.pbCJC!.bg, fit: "contain", desc: "Long-acting GHRH for growth-hormone support, recovery, and lean body composition.", price: "$229", per: "/mo", externalUrl: "" },
  { name: "CJC-1295 / Ipamorelin Pen", img: PHOTO.pbCjcPen!.src, tile: PHOTO.pbCjcPen!.bg, fit: "contain", desc: "Growth-hormone releasing CJC-1295 / Ipamorelin blend in a simple auto-injector pen.", price: "$279", per: "/mo", soon: "Coming September 2026", badge: { text: "Coming Soon", color: "soon" }, externalUrl: "" },
  { name: "Semax / Selank", img: PHOTO.pbSemax!.src, tile: PHOTO.pbSemax!.bg, fit: "contain", desc: "Nootropic peptide blend for focus, mood, and cognitive resilience.", price: "$189", per: "/mo", externalUrl: "" },
  { name: "Semax / Selank Pen", img: PHOTO.pbSemaxPen!.src, tile: PHOTO.pbSemaxPen!.bg, fit: "contain", desc: "The Semax / Selank nootropic blend in a once-weekly auto-injector pen.", price: "$209", per: "/mo", soon: "Coming September 2026", badge: { text: "Coming Soon", color: "soon" }, externalUrl: "" },
  { name: "Tesamorelin / Ipamorelin", img: PHOTO.pbTesaIpa!.src, tile: PHOTO.pbTesaIpa!.bg, fit: "contain", desc: "Visceral-fat reduction with GH-axis support for recovery and body composition.", price: "$279", per: "/mo", externalUrl: "" },
  { name: "Tesamorelin / Ipamorelin Pen", img: PHOTO.pbTesaPen!.src, tile: PHOTO.pbTesaPen!.bg, fit: "contain", desc: "Visceral-fat reduction with GH-axis support in a once-weekly auto-injector pen.", price: "$309", per: "/mo", soon: "Coming September 2026", badge: { text: "Coming Soon", color: "soon" }, externalUrl: "" },
  { name: "Glow+", img: PHOTO.pbGlow!.src, tile: PHOTO.pbGlow!.bg, fit: "contain", desc: "GHK-Cu / BPC-157 / TB-500 / Epitalon regenerative blend for skin, hair, and tissue health.", price: "$269", per: "/mo", externalUrl: "" },
  { name: "Glow+ Pen", img: PHOTO.pbGlowPen!.src, tile: PHOTO.pbGlowPen!.bg, fit: "contain", desc: "GHK-Cu / BPC-157 / TB-500 / Epitalon regenerative blend for skin, hair, and tissue health.", price: "$299", per: "/mo", soon: "Coming September 2026", badge: { text: "Coming Soon", color: "soon" }, externalUrl: "" },
];

const labdx: ShopProduct[] = [
  { name: "Comprehensive Blood Work", img: PHOTO.labBlood!.src, tile: PHOTO.labBlood!.bg, fit: "cover", desc: "100+ biomarkers across metabolic, cardiac, hormone, and thyroid panels.", price: "from $249", per: "", clickable: true, badge: { text: "Most Popular", color: "blue" }, externalUrl: "" },
  { name: "Biological Age Test", img: PHOTO.labBioage!.src, tile: PHOTO.labBioage!.bg, fit: "cover", desc: "Epigenetic and biomarker analysis of how old your cells really are.", price: "$399", per: "/month", clickable: true, externalUrl: "" },
  { name: "Micronutrient Testing", img: PHOTO.labMicro!.src, tile: PHOTO.labMicro!.bg, fit: "cover", desc: "Uncover vitamin and mineral gaps to support energy, immunity, and overall wellness.", price: "$299", per: "/month", clickable: true, externalUrl: "" },
  { name: "Genetics Testing", img: PHOTO.labGenetics!.src, tile: PHOTO.labGenetics!.bg, fit: "cover", desc: "DNA insights on metabolism, medications, and lifestyle fit.", price: "$399", per: "/month", clickable: true, externalUrl: "" },
  { name: "Food Sensitivity Test", img: PHOTO.labFood!.src, tile: PHOTO.labFood!.bg, fit: "cover", desc: "190+ foods screened for IgG-mediated sensitivities.", price: "$299", per: "/month", clickable: true, externalUrl: "" },
  { name: "Microbiome Testing", img: PHOTO.labMicrobiome!.src, tile: PHOTO.labMicrobiome!.bg, fit: "cover", desc: "Gut microbiome sequencing to understand the microbes that shape your health.", price: "$349", per: "/month", clickable: true, externalUrl: "" },
];

const supplements: ShopProduct[] = [
  { name: "Whey · Vanilla", img: PHOTO.s_whey_van!.src, tile: "#ffffff", fit: "contain", desc: "Vanilla milkshake whey protein blend for lean muscle.", price: "$59.99", per: "/bag", badge: { text: "Most Popular", color: "blue" }, externalUrl: "" },
  { name: "Whey · Chocolate", img: PHOTO.s_whey_choc!.src, tile: "#ffffff", fit: "contain", desc: "Chocolate milkshake whey protein blend for lean muscle.", price: "$59.99", per: "/bag", externalUrl: "" },
  { name: "Whey · Cinnamon Swirl", img: PHOTO.s_whey_cin!.src, tile: "#ffffff", fit: "contain", desc: "Cinnamon swirl whey protein blend for lean muscle.", price: "$59.99", per: "/bag", externalUrl: "" },
  { name: "Vegan · Vanilla", img: PHOTO.s_vegan_van!.src, tile: "#ffffff", fit: "contain", desc: "Vanilla plant-based protein for lean muscle support.", price: "$59.99", per: "/bag", externalUrl: "" },
  { name: "Vegan · Chocolate", img: PHOTO.s_vegan_choc!.src, tile: "#ffffff", fit: "contain", desc: "Chocolate plant-based protein for lean muscle support.", price: "$59.99", per: "/bag", externalUrl: "" },
  { name: "Preworkout · Georgia Peach", img: PHOTO.s_pre_peach!.src, tile: "#ffffff", fit: "contain", desc: "Clean energy, focus, and endurance — Georgia peach.", price: "$39.99", per: "/tub", externalUrl: "" },
  { name: "Preworkout · Tropical Sunrise", img: PHOTO.s_pre_trop!.src, tile: "#ffffff", fit: "contain", desc: "Clean energy, focus, and endurance — tropical sunrise.", price: "$39.99", per: "/tub", externalUrl: "" },
  { name: "Preworkout · Watermelon", img: PHOTO.s_pre_water!.src, tile: "#ffffff", fit: "contain", desc: "Clean energy, focus, and endurance — watermelon.", price: "$39.99", per: "/tub", externalUrl: "" },
  { name: "BCAA · Watermelon", img: PHOTO.s_bcaa_water!.src, tile: "#ffffff", fit: "contain", desc: "7.5g BCAA recovery with electrolytes — watermelon.", price: "$34.99", per: "/tub", badge: { text: "New", color: "red" }, externalUrl: "" },
  { name: "BCAA · Green Apple", img: PHOTO.s_bcaa_apple!.src, tile: "#ffffff", fit: "contain", desc: "7.5g BCAA recovery with electrolytes — green apple.", price: "$34.99", per: "/tub", badge: { text: "New", color: "red" }, externalUrl: "" },
  { name: "Creatine Powder", img: PHOTO.s_creatine!.src, tile: "#ffffff", fit: "contain", desc: "Micronized 100% creatine monohydrate for strength.", price: "$39.99", per: "/tub", badge: { text: "Best Value", color: "green" }, externalUrl: "" },
  { name: "Probiotic", img: PHOTO.s_probiotic!.src, tile: "#ffffff", fit: "contain", desc: "40 billion CFU, 10-strain probiotic for gut & immune health.", price: "$34.99", per: "/bottle", externalUrl: "" },
  { name: "Women's Multivitamin", img: PHOTO.s_womensmulti!.src, tile: "#ffffff", fit: "contain", desc: "25+ vitamins & minerals for daily women's health.", price: "$29.99", per: "/bottle", externalUrl: "" },
  { name: "Men's Multivitamin", img: PHOTO.s_mensmulti!.src, tile: "#ffffff", fit: "contain", desc: "Daily essential vitamins & minerals for men.", price: "$29.99", per: "/bottle", externalUrl: "" },
  { name: "Vitamin K2 + D3", img: PHOTO.s_k2d3!.src, tile: "#ffffff", fit: "contain", desc: "Vitamin K2 (MK-7) + D3 for bone, heart & immune health.", price: "$24.99", per: "/bottle", externalUrl: "" },
  { name: "Omega 3", img: PHOTO.s_omega3!.src, tile: "#ffffff", fit: "contain", desc: "High-EPA/DHA fish oil for heart and brain health.", price: "$29.99", per: "/bottle", externalUrl: "" },
  { name: "RED Superfood", img: PHOTO.s_superfood!.src, tile: "#ffffff", fit: "contain", desc: "Kiwi strawberry reds blend with antioxidants & prebiotic fiber.", price: "$39.99", per: "/tub", externalUrl: "" },
  { name: "Glutamine Powder", img: PHOTO.s_glutamine!.src, tile: "#ffffff", fit: "contain", desc: "L-glutamine to support recovery and gut health.", price: "$34.99", per: "/tub", externalUrl: "" },
];

const memberships: ShopProduct[] = [
  {
    name: "Advanced Health Check", cta: "Purchase", type: "plan", img: PHOTO.cgBiomarker!.src, tile: PHOTO.cgBiomarker!.bg, fit: "cover", topPrice: "$399", topNote: "one time payment",
    desc: "A physician-reviewed diagnostic workup — includes a consult and personalized optimization outline from an Apex MD physician.",
    features: [
      { name: "Comprehensive Metabolic Panel", desc: "Overall metabolic health including glucose, electrolytes, and kidney function" },
      { name: "Advanced Lipid Panel", desc: "LDL particle size and number for deeper cardiovascular risk assessment" },
      { name: "Hormone Panels", desc: "Adrenal stress profile, cortisol, estrogen, progesterone, and testosterone" },
      { name: "Inflammation & Immune Panel", desc: "CRP and cytokine panel assessing pro- and anti-inflammatory markers" },
      { name: "Optimization Outline", desc: "Personalized vitamins, peptides, and hormones when applicable" },
    ],
    externalUrl: "",
  },
  {
    name: "Foundational Annual Program", cta: "Purchase", topPrice: "$399/month", type: "plan", img: PHOTO.cgTele!.src, tile: PHOTO.cgTele!.bg, fit: "cover",
    desc: "A physician-reviewed diagnostic workup — includes a consult and <strong>continuous personalized optimization management with Apex MD physician</strong>.",
    features: [
      { name: "Comprehensive Metabolic Panel", desc: "Overall metabolic health including glucose, electrolytes, and kidney function" },
      { name: "Advanced Lipid Panel", desc: "LDL particle size and number for deeper cardiovascular risk assessment" },
      { name: "Hormone Panels", desc: "Adrenal stress profile, cortisol, estrogen, progesterone, and testosterone" },
      { name: "Inflammation & Immune Panel", desc: "CRP and cytokine panel assessing pro- and anti-inflammatory markers" },
      { name: "Personalized Longevity Protocol", desc: "Built on your biomarkers, genetics, lifestyle, and goals. Includes nutritional and exercise guidance, supplements, and medication recommendations when needed.", inc: false },
      { name: "Supplementation & Medication Management", desc: "Physician-prescribed supplementation and medication protocols where clinically indicated", inc: false },
      { name: '<span style="color:var(--shop-accent)">Continuous Optimization Management</span>', desc: "Quarterly lab work and physician visits. Ongoing health management with personalized vitamins, peptides, and hormones when applicable" },
    ],
    externalUrl: "",
  },
  {
    name: "Apex Elite", cta: "Purchase", topPrice: "$1,250/month", topNote: "or $1,063/month if paid annually", type: "plan", img: PHOTO.cgLongevity!.src, tile: PHOTO.cgLongevity!.bg, fit: "cover",
    desc: "A physician-reviewed diagnostic workup — includes a consult and <strong>continuous personalized optimization management with Apex MD physician</strong>.",
    features: [
      { name: "Comprehensive Metabolic Panel", desc: "Overall metabolic health including glucose, electrolytes, and kidney function" },
      { name: "Advanced Lipid Panel", desc: "LDL particle size and number for deeper cardiovascular risk assessment" },
      { name: "Hormone Panels", desc: "Adrenal stress profile, cortisol, estrogen, progesterone, and testosterone" },
      { name: "Micronutrient & Fatty Acids Panel", desc: "Vitamins, minerals, amino acids, omega-3 and omega-6 levels" },
      { name: "Inflammation & Immune Panel", desc: "CRP and cytokine panel assessing pro- and anti-inflammatory markers" },
      { name: "Gut Health & Microbiome Panel", desc: "Comprehensive stool analysis, intestinal permeability, and SIBO breath testing" },
      { name: "Genetic Variants Panel", desc: "Genetic predispositions affecting your health and metabolism" },
      { name: "Heavy Metals & Toxin Panel", desc: "Exposure to heavy metals and environmental toxins" },
      { name: "Food Sensitivity Testing", desc: "Identifies food triggers and sensitivities to guide your dietary protocol" },
      { name: "Personalized Longevity Protocol", desc: "Built on your biomarkers, genetics, lifestyle, and goals. Includes nutritional and exercise guidance, supplements, and medication recommendations when needed." },
      { name: "Supplementation & Medication Management", desc: "Physician-prescribed supplementation and medication protocols where clinically indicated" },
      { name: '<span style="color:var(--shop-accent)">Continuous Optimization Management</span>', desc: "Quarterly lab work and physician visits. Ongoing health management with personalized vitamins, peptides, and hormones when applicable" },
    ],
    externalUrl: "",
  },
];

const programs: ShopProduct[] = [
  { name: "8-Week Ultimate Tennis", type: "plan", img: PHOTO.tennis!.src, tile: PHOTO.tennis!.bg, fit: "poster", desc: "Sport-specific tennis program — move better, hit harder, and play longer with speed, power, core strength, and endurance training.", price: "$199", per: "", badge: { text: "Apex Fit", color: "red" }, externalUrl: "" },
  { name: "12-Week GLP-1 Fat Loss & Muscle Gain Program for Men", type: "plan", img: PHOTO.glp1Men!.src, tile: PHOTO.glp1Men!.bg, fit: "poster", desc: "Doctor-approved 12-week program to lose fat faster while preserving lean muscle, building strength, and transforming your body with GLP-1 optimization.", price: "$199", per: "", badge: { text: "Apex Fit", color: "red" }, externalUrl: "" },
  { name: "12-Week GLP-1 Fat Loss & Muscle Gain Program for Women", type: "plan", img: PHOTO.glp1Women!.src, tile: PHOTO.glp1Women!.bg, fit: "poster", desc: "Doctor-approved 12-week program to lose fat faster while preserving lean muscle, building strength, and transforming your body with GLP-1 optimization.", price: "$199", per: "", badge: { text: "Apex Fit", color: "red" }, externalUrl: "" },
  { name: "12-Week Bone Growth Program", type: "plan", img: PHOTO.boneGrowth!.src, tile: PHOTO.boneGrowth!.bg, fit: "poster", desc: "Doctor-approved 12-week program to grow bone in as little as 12 weeks — reverse osteoporosis and osteopenia, improve balance, reduce fracture risk, and live pain-free.", price: "$199", per: "", badge: { text: "Apex Fit", color: "red" }, externalUrl: "" },
  { name: "8-Week Ultimate Glutes Program", type: "plan", img: PHOTO.glutes!.src, tile: PHOTO.glutes!.bg, fit: "poster", desc: "Targeted 8-week program to build, lift, and shape your glutes with proven workouts for maximum results, better shape, and more confidence.", price: "$199", per: "", badge: { text: "Apex Fit", color: "red" }, externalUrl: "" },
  { name: "6-Week Back Pain Relief Program", type: "plan", img: PHOTO.backPain!.src, tile: PHOTO.backPain!.bg, fit: "poster", desc: "Doctor-approved 6-week program to reduce back pain, improve mobility and flexibility, strengthen your back, and help you live a pain-free life.", price: "$199", per: "", badge: { text: "Apex Fit", color: "red" }, externalUrl: "" },
  { name: "12-Week Post Baby Workout Program", type: "plan", img: PHOTO.postBaby!.src, tile: PHOTO.postBaby!.bg, fit: "poster", desc: "Doctor-approved 12-week program with diastasis recti correction to heal, strengthen, and tone your body — designed for moms, built for real life.", price: "$199", per: "", badge: { text: "Apex Fit", color: "red" }, externalUrl: "" },
  { name: "8-Week Ultimate Tennis Program", type: "plan", img: PHOTO.tennisW!.src, tile: PHOTO.tennisW!.bg, fit: "poster", desc: "Doctor-approved 8-week program to improve speed, power, endurance, and on-court performance — so you can move better, hit harder, play longer, and win more.", price: "$199", per: "", badge: { text: "Apex Fit", color: "red" }, externalUrl: "" },
  { name: "Metabolic Reset", type: "plan", desc: "12-week GLP-1 + nutrition + coaching weight-loss program.", price: "$349", per: "/mo", badge: { text: "Most Popular", color: "blue" }, externalUrl: "" },
  { name: "Hormone Optimization", type: "plan", desc: "TRT/HRT program with labs, dosing, and follow-ups included.", price: "$259", per: "/mo", externalUrl: "" },
  { name: "Longevity Protocol", type: "plan", desc: "Comprehensive anti-aging program across diagnostics and therapy.", price: "$399", per: "/mo", externalUrl: "" },
  { name: "Recovery & Performance", type: "plan", desc: "Peptide + training program for recovery and body composition.", price: "$299", per: "/mo", externalUrl: "" },
];

const training: ShopProduct[] = [
  { name: "1:1 Personal Training", type: "plan", desc: "Weekly remote coaching with a dedicated Apex Fit trainer.", price: "$249", per: "/mo", badge: { text: "Most Popular", color: "blue" }, externalUrl: "" },
  { name: "Custom Program Design", type: "plan", desc: "A periodized training plan built around your goals and labs.", price: "$99", per: "/mo", externalUrl: "" },
  { name: "Nutrition Coaching", type: "plan", desc: "Macro and meal planning aligned to your protocol.", price: "$129", per: "/mo", externalUrl: "" },
  { name: "Hybrid Concierge", type: "plan", desc: "Training + nutrition + check-ins in one managed plan.", price: "$349", per: "/mo", externalUrl: "" },
];

// ─── Tabs ──────────────────────────────────────────────────────────────────

export const TABS: ShopTab[] = [
  {
    id: "medical", label: "Medical", icon: "medical",
    pills: [
      { label: "All", sec: "weight-loss" },
      { label: "Weight Loss", sec: "weight-loss" },
      { label: "Peptide Blends", sec: "peptide-blends" },
      { label: "TRT", sec: "trt" },
      { label: "HRT", sec: "hrt" },
      { label: "Peptides", sec: "peptides" },
      { label: "Lab Diagnostics", sec: "lab" },
    ],
    sections: [
      { id: "weight-loss", accent: "red", badge: "GLP-1 Medications", title: "Weight Loss", sub: "Clinically-supervised GLP-1 weight loss programs. Start with a quick quiz to find your best fit.", action: "Take the quiz", actionUrl: "", products: wl },
      { id: "peptide-blends", accent: "grey", badge: "Combination Therapies", title: "Peptide Blends", sub: "Physician-formulated multi-peptide blends for recovery, performance, and regeneration.", products: peptideBlends },
      { id: "trt", accent: "black", badge: "Hormone Optimization", title: "TRT - $199/month", sub: '<strong style="color:var(--shop-ink)">All Testosterone enhancement programs start with labs and an Apex MD physician consult</strong> where the type of testosterone will be selected by the physician to best fit your needs and goals. <strong style="color:var(--shop-ink)">Quarterly labs, medication and physician consults are included in the $199/month charge.</strong>', products: trt },
      { id: "hrt", accent: "pink", badge: "Hormone Balance", title: "Women's HRT - $249/month", sub: '<strong style="color:var(--shop-ink)">All women\'s Hormone enhancement programs start with labs and an Apex MD physician consult</strong> where the type of hormone therapy will be selected by the physician to best fit your needs and goals. <strong style="color:var(--shop-ink)">Quarterly labs, medication and physician consults are included in the $249/month charge.</strong>', products: hrt },
      { id: "peptides", accent: "grey", badge: "Targeted Peptides", title: "Peptides", sub: "Targeted peptide therapies for recovery, performance, and wellness.", products: peptides },
      { id: "lab", accent: "red", badge: "At-Home Diagnostics", title: "Lab Diagnostics", sub: "Physician-reviewed at-home lab kits — collect at home, we handle the rest.", products: labdx },
    ],
  },
  {
    id: "supplements", label: "Supplements", icon: "supplements",
    sections: [{ id: "supps", accent: "red", badge: "Daily Performance", title: "Supplements", sub: "Pharmaceutical-grade supplements, formulated and reviewed by Apex MD physicians.", products: supplements }],
  },
  {
    id: "memberships", label: "Concierge Program", icon: "memberships", planIcon: "memberships",
    sections: [{ id: "mem", accent: "red", badge: "Concierge Care", title: "Concierge Program", sub: "Personalized longevity care — 100+ biomarkers and a physician-guided protocol built to expand your healthspan.", products: memberships }],
  },
  {
    id: "programs", label: "Fitness Programs", icon: "programs", planIcon: "programs",
    sections: [{ id: "prog", accent: "red", badge: "Bundled Clinical Programs", title: "Fitness Programs", sub: "All-in-one programs that bundle medication, labs, coaching, and follow-up care.", products: programs }],
  },
  {
    id: "training", label: "Training", icon: "training", planIcon: "training",
    sections: [{ id: "train", accent: "orange", badge: "Apex Fit Personal Training", title: "Training", sub: "Remote personal training and nutrition coaching from the Apex Fit team.", products: training }],
  },
];
