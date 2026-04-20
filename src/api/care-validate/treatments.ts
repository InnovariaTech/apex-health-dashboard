import { axiosService } from "@/api/http/axiosInstance";
import type {
  FetchAvailableTreatmentBundlesParams,
  FetchAvailableTreatmentBundlesResponse,
  TreatmentBundleItem,
} from "@/types/care-validate/treatments_types";

const TREATMENT_BUNDLES_ENDPOINT = "/api/patient/browse-treatments/bundles";

function mapTreatmentBundle(raw: unknown): TreatmentBundleItem {
  const row = (raw ?? {}) as Record<string, unknown>;
  const rawPayload = (row.raw ?? {}) as Record<string, unknown>;
  const parsedPrice = Number(row.price ?? rawPayload.price ?? 0);

  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    price: Number.isFinite(parsedPrice) ? parsedPrice : 0,
    imageUrl: String(row.imageUrl ?? ""),
    raw: rawPayload as TreatmentBundleItem["raw"],
  };
}

export async function fetchAvailableTreatmentBundles(
  params: FetchAvailableTreatmentBundlesParams = {}
): Promise<TreatmentBundleItem[]> {
  const isVisible = params.isVisible;
  const bundleId = params.bundleId;
  const includeIntakeForm = params.includeIntakeForm;
  const includeFollowupForm = params.includeFollowupForm;

  const res = await axiosService.get<FetchAvailableTreatmentBundlesResponse>(
    TREATMENT_BUNDLES_ENDPOINT,
    {
      params: {
        ...(typeof isVisible === "boolean" ? { isVisible } : {}),
        ...(bundleId ? { bundleId } : {}),
        ...(typeof includeIntakeForm === "boolean" ? { includeIntakeForm } : {}),
        ...(typeof includeFollowupForm === "boolean" ? { includeFollowupForm } : {}),
      },
    }
  );
  const rows = Array.isArray(res.data?.data) ? res.data.data : [];

  return rows.map(mapTreatmentBundle);
}
