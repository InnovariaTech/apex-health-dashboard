/**
 * Temporary frontend-side categorization fallback.
 *
 * Remove this file once backend forwards `tag` reliably in
 * `/api/patient/browse-treatments/bundles` responses.
 */

export const UNCATEGORIZED_LABEL = "Others";

export const TREATMENT_CATEGORY_BY_ID: Record<string, string> = {
  // Weight Loss Product
  "11df1f3a-1f38-457d-b967-e25fe3060f97": "Weight Loss Product",
  "e1a1f639-615a-4938-9cca-4c5f78de518c": "Weight Loss Product",
  "e1a4a41c-d425-4a58-8ba1-84091bfa227d": "Weight Loss Product",
  "a391783e-0274-4c65-b1a5-47235340ab74": "Weight Loss Product",
  "479c6258-809e-4c58-a2a6-64e0715002fc": "Weight Loss Product",
  "bc44974e-16ed-4635-9346-6742349a7f69": "Weight Loss Product",
  "c015bc20-f027-4679-982c-9057b8880428": "Weight Loss Product",
  "3fd10d7c-2446-456d-9f02-fbd7115f479f": "Weight Loss Product",

  // Hormonal Therapy Product
  "47602712-4369-404c-928d-af096e7d755a": "Hormonal Therapy Product",
  "7b895fbb-7a87-4990-9457-8cb56156b044": "Hormonal Therapy Product",
  "37964c92-65a5-4f5e-a7ff-b1ececdf61bf": "Hormonal Therapy Product",
  "61d44ac3-a5a7-4b1a-a83f-7052c44206ff": "Hormonal Therapy Product",
  "fecc4092-b0e4-4b09-9e29-6f279f4087b7": "Hormonal Therapy Product",
  "0fec73c3-314d-4175-885a-550bce200cf9": "Hormonal Therapy Product",
  "119e08af-2967-43ef-a7e5-d404229fc5e1": "Hormonal Therapy Product",
  "bd87e847-eb81-45ea-9aba-3746a9eb374c": "Hormonal Therapy Product",
  "67964cca-a53d-4cec-98e6-33063abeac5f": "Hormonal Therapy Product",

  // Skincare Product
  "e5474f51-547b-4f4c-a45b-12cb22107a81": "Skincare Product",

  // Wellness / Longevity Product
  "a2b4fc69-7333-4500-973f-f7217762ce39": "Wellness / Longevity Product",
  "36777efb-30aa-4d3b-829d-332a9c5362ca": "Wellness / Longevity Product",
  "8b3be70c-ad8d-4dbf-8b4c-80da2240ee28": "Wellness / Longevity Product",
  "f02dc682-41e1-4044-b7be-cc7adfe20fb3": "Wellness / Longevity Product",
  "e8f3c12d-8850-42fe-a3f5-d9b04adcedc6": "Wellness / Longevity Product",
  "73b47e50-6e7d-4c8d-bead-68a827dd4e8e": "Wellness / Longevity Product",
  "f6ab9504-cb97-40ad-90fb-957d2beb6e5a": "Wellness / Longevity Product",
  "e155e8bc-0a62-4d62-8db5-7adca421162a": "Wellness / Longevity Product",
  "27db3284-dbf1-4489-8d5d-cf2fd64688b4": "Wellness / Longevity Product",
  "b561e155-2599-483c-b366-26bd11babf42": "Wellness / Longevity Product",
  "3753415a-04b0-4dec-a22d-0d8021dae156": "Wellness / Longevity Product",
  "d6948386-add2-41d5-a5af-c9dc9d80cb9c": "Wellness / Longevity Product",
  "df3ba999-d44f-47be-b84f-fa40289e49fb": "Wellness / Longevity Product",
  "ca00adf7-94db-494f-b05a-adff22b291e3": "Wellness / Longevity Product",
  "57f1bef9-01ff-489f-892d-321bdeeff219": "Wellness / Longevity Product",
  "217df224-5ab4-437e-a697-279181e7bedb": "Wellness / Longevity Product",

  // Others
  "2636ae65-205f-47d3-bcf4-bcc3704e9566": UNCATEGORIZED_LABEL,
};

export function inferTreatmentCategoryFromName(name: string): string | null {
  const normalized = name.toLowerCase();

  if (normalized.includes("semaglutide") || normalized.includes("tirzepatide")) {
    return "Weight Loss Product";
  }

  if (
    normalized.includes("testosterone") ||
    normalized.includes("kyzatrex") ||
    normalized.includes("gonadorelin") ||
    normalized.includes("estradiol") ||
    normalized.includes("enclomiphene")
  ) {
    return "Hormonal Therapy Product";
  }

  if (normalized.includes("estriol") && normalized.includes("cream")) {
    return "Skincare Product";
  }

  if (
    normalized.includes("nad+") ||
    normalized.includes("sermorelin") ||
    normalized.includes("b12") ||
    normalized.includes("ipamorelin") ||
    normalized.includes("bpc-157") ||
    normalized.includes("tb-500") ||
    normalized.includes("pt-141") ||
    normalized.includes("ghk-cu") ||
    normalized.includes("wolverine") ||
    normalized.includes("glow stack") ||
    normalized.includes("longevity")
  ) {
    return "Wellness / Longevity Product";
  }

  return null;
}

export function resolveTreatmentCategory(bundle: { id: string; tag: string | null; name: string }) {
  const tag = bundle.tag?.trim();
  if (tag) return tag;

  return (
    TREATMENT_CATEGORY_BY_ID[bundle.id] ||
    inferTreatmentCategoryFromName(bundle.name) ||
    null
  );
}
