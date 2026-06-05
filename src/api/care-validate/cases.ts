import { axiosService } from "@/api/http/axiosInstance";
import type {
  AddCaseFormBody,
  AddCaseFormResponse,
  CaseDetailsItem,
  CaseDetailsResponse,
  CaseFormResponseItem,
  CaseFormResponsesResponse,
  CaseItem,
  CasesListResponse,
  CaseTreatmentsResponse,
  CreateCaseBody,
  CreateCaseResponse,
  FetchCaseDetailsParams,
  GetCaseFormResponsesParams,
  GetCasesParams,
  LatestCaseIdResponse,
} from "@/types/care-validate/case_types";

const CASES_ENDPOINT = "/api/patient/my-requests/cases";
const LATEST_CASE_ID_ENDPOINT = "/api/patient/my-requests/latest-case-id";

function toArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];

  const record = value as Record<string, unknown>;
  if (Array.isArray(record.data)) return record.data;
  if (Array.isArray(record.items)) return record.items;
  if (Array.isArray(record.results)) return record.results;
  if (Array.isArray(record.cases)) return record.cases;

  return [];
}

function mapCaseItem(raw: unknown): CaseItem {
  const row = (raw ?? {}) as Record<string, unknown>;
  const rawCase = (row.raw ?? row) as CaseItem["raw"];

  return {
    id: String(row.id ?? rawCase.id ?? ""),
    shortId: String(row.shortId ?? rawCase.shortId ?? ""),
    title: String(row.title ?? rawCase.title ?? ""),
    status: String(row.status ?? rawCase.status ?? "OPEN"),
    createdAt: String(row.createdAt ?? rawCase.createdAt ?? ""),
    updatedAt: String(row.updatedAt ?? rawCase.updatedAt ?? ""),
    payments: Array.isArray(row.payments)
      ? row.payments
      : Array.isArray(rawCase.payments)
        ? rawCase.payments
        : [],
    subscriptions: Array.isArray(row.subscriptions)
      ? row.subscriptions
      : Array.isArray(rawCase.subscriptions)
        ? rawCase.subscriptions
        : [],
    raw: rawCase,
  };
}

function mapCaseDetails(raw: unknown): CaseDetailsItem {
  const row = (raw ?? {}) as Record<string, unknown>;
  const rawCase = (row.raw ?? row) as CaseDetailsItem["raw"];

  return {
    id: String(row.id ?? rawCase.id ?? ""),
    shortId: String(row.shortId ?? rawCase.shortId ?? ""),
    title: String(row.title ?? rawCase.title ?? ""),
    status: String(row.status ?? rawCase.status ?? "OPEN"),
    submitterEmail: String(row.submitterEmail ?? rawCase.submitter?.email ?? ""),
    raw: rawCase,
  };
}

export async function getMyCases(
  params: GetCasesParams = {}
): Promise<CaseItem[]> {
  const includePayments = params.includePayments ?? false;
  const recordsPerPage = params.recordsPerPage ?? 100;
  const includeAttachments = params.includeAttachments ?? true;
  const includeOrders = params.includeOrders ?? true;
  const includeCalendarEvents = params.includeCalendarEvents ?? false;
  const documentFormat = params.documentFormat ?? "url";
  const startTime = params.startTime;
  const endTime = params.endTime;

  const res = await axiosService.get<CasesListResponse>(CASES_ENDPOINT, {
    params: {
      includePayments,
      recordsPerPage,
      includeAttachments,
      includeOrders,
      includeCalendarEvents,
      documentFormat,
      ...(startTime ? { startTime } : {}),
      ...(endTime ? { endTime } : {}),
    },
  });

  const rows = toArray(res.data?.data);
  return rows.map(mapCaseItem);
}

export async function fetchCaseDetails(
  caseId: string,
  params: FetchCaseDetailsParams = {
    includeAttachments: true,
    documentFormat: "base64",
    includeCalendarEvents: false,
    includeOrders: false,
    includeCaseProducts: false,
    includePayments: false,
  }
): Promise<CaseDetailsItem> {
  const safeCaseId = encodeURIComponent(caseId);
  const includeAttachments = params.includeAttachments ?? true;
  const documentFormat = params.documentFormat ?? "base64";
  const includeCalendarEvents = params.includeCalendarEvents ?? false;
  const includeOrders = params.includeOrders ?? false;
  const includeCaseProducts = params.includeCaseProducts ?? false;
  const includePayments = params.includePayments ?? false;

  const res = await axiosService.get<CaseDetailsResponse>(
    `${CASES_ENDPOINT}/${safeCaseId}`,
    {
      params: {
        includeAttachments,
        documentFormat,
        includeCalendarEvents,
        includeOrders,
        includeCaseProducts,
        includePayments,
      },
    }
  );

  return mapCaseDetails(res.data?.data);
}

export async function getCaseTreatments(caseId: string): Promise<unknown[]> {
  const safeCaseId = encodeURIComponent(caseId);
  const res = await axiosService.get<CaseTreatmentsResponse>(
    `${CASES_ENDPOINT}/${safeCaseId}/treatments`
  );

  return Array.isArray(res.data?.data) ? res.data.data : [];
}

export async function getCaseFormResponses(
  caseId: string,
  params: GetCaseFormResponsesParams = {
    recordsPerPage: 20,
    sortBy: "createdAt",
    sortOrder: "DESC",
  }
): Promise<CaseFormResponseItem[]> {
  const safeCaseId = encodeURIComponent(caseId);
  const recordsPerPage = params.recordsPerPage ?? 20;
  const sortBy = params.sortBy ?? "createdAt";
  const sortOrder = params.sortOrder ?? "DESC";

  const res = await axiosService.get<CaseFormResponsesResponse>(
    `${CASES_ENDPOINT}/${safeCaseId}/form-responses`,
    {
      params: {
        recordsPerPage,
        sortBy,
        sortOrder,
      },
    }
  );

  return Array.isArray(res.data?.data) ? res.data.data : [];
}

export async function getLatestCaseId(): Promise<string> {
  const res = await axiosService.get<LatestCaseIdResponse>(LATEST_CASE_ID_ENDPOINT);
  const data = res.data?.data as unknown;

  if (typeof data === "string") return data;
  if (data && typeof data === "object") {
    const row = data as Record<string, unknown>;
    return String(row.caseId ?? row.id ?? "");
  }

  return "";
}

/**
 * `POST /api/patient/my-requests/cases` (doc #2) — creates a dynamic case
 * on CareValidate. `email` must match the authenticated user's email.
 */
export async function createCase(body: CreateCaseBody): Promise<CaseItem> {
  const res = await axiosService.post<CreateCaseResponse>(CASES_ENDPOINT, body);
  return mapCaseItem(res.data?.data);
}

/**
 * `POST /api/patient/my-requests/cases/:caseId/forms` (doc #7) — attaches a
 * new dynamic form to an existing case.
 */
export async function addCaseForm(
  caseId: string,
  body: AddCaseFormBody
): Promise<unknown> {
  const safeCaseId = encodeURIComponent(caseId);
  const res = await axiosService.post<AddCaseFormResponse>(
    `${CASES_ENDPOINT}/${safeCaseId}/forms`,
    body
  );
  return res.data?.data ?? null;
}
