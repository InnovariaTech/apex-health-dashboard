export interface TreatmentBundleRaw {
  id?: string;
  name?: string;
  imageUrl?: string;
  description?: string;
  price?: string | number;
  priceUnit?: string;
  tag?: string | null;
  externalUrl?: string | null;
  externalFormUrl?: string | null;
  formVersionId?: string | null;
  products?: TreatmentProductItem[] | unknown[];
  initialDiscount?: string | number;
  isSoldOut?: boolean;
  isVisible?: boolean;
  intakeForm?: unknown | null;
  followupForm?: unknown | null;
  optionalFollowupForm?: unknown | null;
  [key: string]: unknown;
}

export interface TreatmentProductRaw {
  id?: string;
  name?: string;
  imageUrl?: string;
  description?: string;
  price?: string | number;
  priceUnit?: string;
  tag?: string | null;
  externalUrl?: string | null;
  externalFormUrl?: string | null;
  formVersionId?: string | null;
  isVisible?: boolean;
  [key: string]: unknown;
}

export interface TreatmentProductItem {
  id: string;
  name: string;
  description: string;
  price: number;
  priceUnit: string;
  tag: string | null;
  imageUrl: string;
  externalUrl: string | null;
  externalFormUrl: string | null;
  formVersionId: string | null;
  isVisible?: boolean;
  raw: TreatmentProductRaw;
}

export interface TreatmentBundleItem {
  id: string;
  name: string;
  description: string;
  price: number;
  priceUnit: string;
  tag: string | null;
  imageUrl: string;
  externalUrl: string | null;
  externalFormUrl: string | null;
  formVersionId: string | null;
  products: TreatmentProductItem[];
  isVisible?: boolean;
  raw: TreatmentBundleRaw;
}

export interface FetchAvailableTreatmentBundlesParams {
  isVisible?: boolean;
}

export interface FetchAvailableTreatmentBundlesResponse {
  success?: boolean;
  data: TreatmentBundleItem[];
}

export interface FetchTreatmentProductsParams {
  isVisible?: boolean;
}

export interface FetchTreatmentProductsResponse {
  success?: boolean;
  data: TreatmentProductItem[];
}

export interface FetchTreatmentProductByIdResponse {
  success?: boolean;
  data?: unknown;
}

export interface FetchTreatmentProductByIdParams {
  includeFollowupForm?: boolean;
  includeOptionalFollowupForm?: boolean;
}

export interface FetchTreatmentBundleByIdResponse {
  success?: boolean;
  data?: unknown;
}

export interface FetchTreatmentBundleByIdParams {
  includeIntakeForm?: boolean;
  includeFollowupForm?: boolean;
}
