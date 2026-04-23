import { axiosService } from "@/api/http/axiosInstance";
import type {
  FetchAvailableTreatmentBundlesParams,
  FetchAvailableTreatmentBundlesResponse,
  FetchTreatmentBundleByIdParams,
  FetchTreatmentBundleByIdResponse,
  FetchTreatmentProductByIdParams,
  FetchTreatmentProductByIdResponse,
  TreatmentBundleItem,
  TreatmentProductItem,
} from "@/types/care-validate/treatments_types";

const TREATMENT_BUNDLES_ENDPOINT = "/api/patient/browse-treatments/bundles";
const TREATMENT_PRODUCTS_ENDPOINT = "/api/patient/browse-treatments/products";

function buildTreatmentProductEndpoint(productUUID: string): string {
  return `${TREATMENT_PRODUCTS_ENDPOINT}/${encodeURIComponent(productUUID)}`;
}

function buildTreatmentBundleEndpoint(bundleUUID: string): string {
  return `${TREATMENT_BUNDLES_ENDPOINT}/${encodeURIComponent(bundleUUID)}`;
}

function mapTreatmentProduct(raw: unknown): TreatmentProductItem {
  const row = (raw ?? {}) as Record<string, unknown>;
  const rawPayload = (row.raw ?? row) as Record<string, unknown>;
  const parsedPrice = Number(row.price ?? rawPayload.price ?? 0);
  const rawIsVisible = row.isVisible ?? rawPayload.isVisible;

  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    description: String(row.description ?? rawPayload.description ?? ""),
    price: Number.isFinite(parsedPrice) ? parsedPrice : 0,
    priceUnit: String(row.priceUnit ?? rawPayload.priceUnit ?? ""),
    tag: (row.tag ?? rawPayload.tag ?? null) as string | null,
    imageUrl: String(row.imageUrl ?? rawPayload.imageUrl ?? ""),
    externalUrl: (row.externalUrl ?? rawPayload.externalUrl ?? null) as string | null,
    externalFormUrl: (row.externalFormUrl ?? rawPayload.externalFormUrl ?? null) as
      | string
      | null,
    formVersionId: (row.formVersionId ?? rawPayload.formVersionId ?? null) as string | null,
    ...(typeof rawIsVisible === "boolean" ? { isVisible: rawIsVisible } : {}),
    raw: rawPayload as TreatmentProductItem["raw"],
  };
}

function mapTreatmentBundle(raw: unknown): TreatmentBundleItem {
  const row = (raw ?? {}) as Record<string, unknown>;
  const rawPayload = (row.raw ?? row) as Record<string, unknown>;
  const parsedPrice = Number(row.price ?? rawPayload.price ?? 0);
  const rawIsVisible = row.isVisible ?? rawPayload.isVisible;
  const rawProducts = Array.isArray(row.products)
    ? row.products
    : Array.isArray(rawPayload.products)
      ? rawPayload.products
      : [];
  const products = rawProducts.map(mapTreatmentProduct);

  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    description: String(row.description ?? rawPayload.description ?? ""),
    price: Number.isFinite(parsedPrice) ? parsedPrice : 0,
    priceUnit: String(row.priceUnit ?? rawPayload.priceUnit ?? ""),
    tag: (row.tag ?? rawPayload.tag ?? null) as string | null,
    imageUrl: String(row.imageUrl ?? rawPayload.imageUrl ?? ""),
    externalUrl: (row.externalUrl ?? rawPayload.externalUrl ?? null) as string | null,
    externalFormUrl: (row.externalFormUrl ?? rawPayload.externalFormUrl ?? null) as
      | string
      | null,
    formVersionId: (row.formVersionId ?? rawPayload.formVersionId ?? null) as string | null,
    products,
    ...(typeof rawIsVisible === "boolean" ? { isVisible: rawIsVisible } : {}),
    raw: rawPayload as TreatmentBundleItem["raw"],
  };
}

export async function fetchAvailableTreatmentBundles(
  params: FetchAvailableTreatmentBundlesParams = { isVisible: true }
): Promise<TreatmentBundleItem[]> {
  const isVisible = params.isVisible;

  const res = await axiosService.get<FetchAvailableTreatmentBundlesResponse>(
    TREATMENT_BUNDLES_ENDPOINT,
    {
      params: {
        ...(typeof isVisible === "boolean" ? { isVisible } : {}),
      },
    }
  );
  const rows = Array.isArray(res.data?.data) ? res.data.data : [];

  return rows.map(mapTreatmentBundle);
}

export async function fetchTreatmentProductById(
  productUUID: string,
  params: FetchTreatmentProductByIdParams = {}
): Promise<TreatmentBundleItem | null> {
  const includeFollowupForm = params.includeFollowupForm;
  const includeOptionalFollowupForm = params.includeOptionalFollowupForm;

  const res = await axiosService.get<FetchTreatmentProductByIdResponse>(
    buildTreatmentProductEndpoint(productUUID),
    {
      params: {
        ...(typeof includeFollowupForm === "boolean" ? { includeFollowupForm } : {}),
        ...(typeof includeOptionalFollowupForm === "boolean"
          ? { includeOptionalFollowupForm }
          : {}),
      },
    }
  );

  const payload = res.data?.data;
  if (Array.isArray(payload)) {
    return payload.length > 0 ? mapTreatmentBundle(payload[0]) : null;
  }

  return payload && typeof payload === "object" ? mapTreatmentBundle(payload) : null;
}

export async function fetchTreatmentBundleById(
  bundleUUID: string,
  params: FetchTreatmentBundleByIdParams = {}
): Promise<TreatmentBundleItem | null> {
  const includeIntakeForm = params.includeIntakeForm;
  const includeFollowupForm = params.includeFollowupForm;

  const res = await axiosService.get<FetchTreatmentBundleByIdResponse>(
    buildTreatmentBundleEndpoint(bundleUUID),
    {
      params: {
        ...(typeof includeIntakeForm === "boolean" ? { includeIntakeForm } : {}),
        ...(typeof includeFollowupForm === "boolean" ? { includeFollowupForm } : {}),
      },
    }
  );

  const payload = res.data?.data;
  if (Array.isArray(payload)) {
    return payload.length > 0 ? mapTreatmentBundle(payload[0]) : null;
  }

  return payload && typeof payload === "object" ? mapTreatmentBundle(payload) : null;
}
