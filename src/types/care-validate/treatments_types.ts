export interface TreatmentBundleRaw {
  id?: string;
  name?: string;
  imageUrl?: string;
  description?: string;
  price?: string | number;
  priceUnit?: string;
  initialDiscount?: string | number;
  isSoldOut?: boolean;
  isVisible?: boolean;
  [key: string]: unknown;
}

export interface TreatmentBundleItem {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  raw: TreatmentBundleRaw;
}

export interface FetchAvailableTreatmentBundlesParams {
  isVisible?: boolean;
  bundleId?: string;
  includeIntakeForm?: boolean;
  includeFollowupForm?: boolean;
}

export interface FetchAvailableTreatmentBundlesResponse {
  success?: boolean;
  data: TreatmentBundleItem[];
}
