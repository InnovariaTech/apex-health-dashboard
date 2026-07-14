import { useCallback, useMemo, useState } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addCaseForm,
  createCase,
  fetchCaseDetails,
  getLatestCaseId,
  getMyCases,
} from "@/api/care-validate/cases";
import { queryKeys } from "@/hooks/queryKeys";
import type {
  AddCaseFormBody,
  CaseDetailsItem,
  CaseItem,
  CreateCaseBody,
  FetchCaseDetailsParams,
  GetCasesParams,
} from "@/types/care-validate/case_types";

export function useCases(params: GetCasesParams): ReturnType<typeof useQuery<CaseItem[]>>;
export function useCases(includePayments?: boolean): ReturnType<typeof useQuery<CaseItem[]>>;
export function useCases(
  paramsOrIncludePayments: GetCasesParams | boolean = false
) {
  const params: GetCasesParams =
    typeof paramsOrIncludePayments === "boolean"
      ? { includePayments: paramsOrIncludePayments }
      : paramsOrIncludePayments;

  const includePayments = params.includePayments ?? false;
  const recordsPerPage = params.recordsPerPage ?? 100;
  const includeAttachments = params.includeAttachments ?? true;
  const includeOrders = params.includeOrders ?? true;
  const includeCalendarEvents = params.includeCalendarEvents ?? false;
  const documentFormat = params.documentFormat ?? "url";
  const startTime = params.startTime;
  const endTime = params.endTime;
  const status = params.status;

  return useQuery<CaseItem[]>({
    queryKey: queryKeys.careValidate.cases(
      includePayments,
      startTime,
      endTime,
      recordsPerPage,
      includeAttachments,
      includeOrders,
      includeCalendarEvents,
      documentFormat,
      status,
    ),
    queryFn: () =>
      getMyCases({
        includePayments,
        ...(startTime ? { startTime } : {}),
        ...(endTime ? { endTime } : {}),
        recordsPerPage,
        includeAttachments,
        includeOrders,
        includeCalendarEvents,
        documentFormat,
        ...(status ? { status } : {}),
      }),
    staleTime: 60_000,
  });
}

/**
 * CareValidate caps `getMyCases` at a 60-day window per call, so we
 * fan out 50-day windows (10-day safety margin) and merge the results.
 *
 *   - Initial fan-out: 6 windows = 300 days (~10 months).
 *   - Each `loadOlder()` adds 6 more 50-day windows (another ~10 months).
 *   - Hard cap: 36 windows total ≈ 5 years (`MAX_WINDOWS`).
 *
 * All windows fire in parallel via `useQueries` (React Query dedupes by
 * key, so a single-window `useCases({startTime, endTime})` cache-hits the
 * matching slice). Results are merged → deduped on `id` → sorted
 * newest-first on `updatedAt ?? createdAt`.
 *
 * Returns `loadOlder` / `canLoadOlder` / `isLoadingOlder` for callers
 * (today only MyCases) that want a manual "show me more" button. Other
 * callers (Chat, AI Documents) can ignore those fields and get the
 * 300-day initial set.
 */

const WINDOW_DAYS = 50;
const INITIAL_WINDOWS = 6;
const WINDOWS_PER_LOAD_OLDER = 6;
/** ~5 years (36 × 50 days = 1800 days). Caps runaway "load older" clicks. */
const MAX_WINDOWS = 36;
const DAY_MS = 24 * 60 * 60 * 1000;

export function useCasesYearRolling(
  extraParams: Omit<GetCasesParams, "startTime" | "endTime"> = {},
) {
  const includePayments = extraParams.includePayments ?? false;
  const recordsPerPage = extraParams.recordsPerPage ?? 100;
  const includeAttachments = extraParams.includeAttachments ?? true;
  const includeOrders = extraParams.includeOrders ?? true;
  const includeCalendarEvents = extraParams.includeCalendarEvents ?? false;
  const documentFormat = extraParams.documentFormat ?? "url";
  const status = extraParams.status;

  const [extraWindows, setExtraWindows] = useState(0);
  const totalWindowCount = INITIAL_WINDOWS + extraWindows;

  // Day-based arithmetic instead of `setMonth` — keeps every window at
  // exactly WINDOW_DAYS (no month-end rollover drift) so we never breach
  // the backend's 60-day per-call ceiling.
  //
  // `now` is captured at mount and only rebuilt when `extraWindows`
  // changes, so re-renders don't shift the windows around.
  const windows = useMemo(() => {
    const now = Date.now();
    const out: { startTime: string; endTime: string }[] = [];
    for (let i = 0; i < totalWindowCount; i++) {
      const end = new Date(now - i * WINDOW_DAYS * DAY_MS);
      const start = new Date(now - (i + 1) * WINDOW_DAYS * DAY_MS);
      out.push({
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalWindowCount]);

  const results = useQueries({
    queries: windows.map((w) => ({
      queryKey: queryKeys.careValidate.cases(
        includePayments,
        w.startTime,
        w.endTime,
        recordsPerPage,
        includeAttachments,
        includeOrders,
        includeCalendarEvents,
        documentFormat,
        status,
      ),
      queryFn: () =>
        getMyCases({
          includePayments,
          startTime: w.startTime,
          endTime: w.endTime,
          recordsPerPage,
          includeAttachments,
          includeOrders,
          includeCalendarEvents,
          documentFormat,
          ...(status ? { status } : {}),
        }),
      staleTime: 60_000,
    })),
  });

  const data = useMemo(() => {
    const seen = new Set<string>();
    const merged: CaseItem[] = [];
    for (const r of results) {
      if (!r.data) continue;
      for (const c of r.data) {
        if (!c?.id || seen.has(c.id)) continue;
        seen.add(c.id);
        merged.push(c);
      }
    }
    merged.sort((a, b) => {
      const ta = Date.parse(a.updatedAt || a.createdAt || "");
      const tb = Date.parse(b.updatedAt || b.createdAt || "");
      const safeTa = Number.isNaN(ta) ? 0 : ta;
      const safeTb = Number.isNaN(tb) ? 0 : tb;
      return safeTb - safeTa;
    });
    return merged;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, results.map((r) => r.data));

  // Split loading state by initial vs "load older" so the UI can show a
  // page-level spinner only on the first paint, and a small inline
  // spinner on the button while extras resolve.
  const initialSlice = results.slice(0, INITIAL_WINDOWS);
  const extraSlice = results.slice(INITIAL_WINDOWS);

  const canLoadOlder = totalWindowCount < MAX_WINDOWS;

  const loadOlder = useCallback(() => {
    setExtraWindows((current) => {
      const next = current + WINDOWS_PER_LOAD_OLDER;
      const maxExtras = MAX_WINDOWS - INITIAL_WINDOWS;
      return next > maxExtras ? maxExtras : next;
    });
  }, []);

  const daysCovered = totalWindowCount * WINDOW_DAYS;

  return {
    data,
    isLoading: initialSlice.some((r) => r.isLoading),
    isFetching: results.some((r) => r.isFetching),
    isError: results.every((r) => r.isError),
    error: results.find((r) => r.error)?.error ?? null,
    // Useful for UI that wants to show "X of N windows loaded".
    windowsLoaded: results.filter((r) => !r.isLoading).length,
    totalWindows: results.length,
    // Manual "show me older cases" controls (MyCases uses these).
    loadOlder,
    canLoadOlder,
    isLoadingOlder: extraSlice.some((r) => r.isLoading),
    daysCovered,
  };
}

export function useCaseDetails(
  caseId?: string,
  params: FetchCaseDetailsParams = {
    includeAttachments: true,
    documentFormat: "base64",
    includeCalendarEvents: false,
    includeOrders: false,
    includeCaseProducts: false,
    includePayments: false,
  },
  options: { enablePolling?: boolean } = {}
) {
  const includeAttachments = params.includeAttachments ?? true;
  const documentFormat = params.documentFormat ?? "base64";
  const includeCalendarEvents = params.includeCalendarEvents ?? false;
  const includeOrders = params.includeOrders ?? false;
  const includeCaseProducts = params.includeCaseProducts ?? false;
  const includePayments = params.includePayments ?? false;
  const enablePolling = options.enablePolling ?? false;

  return useQuery<CaseDetailsItem>({
    queryKey: queryKeys.careValidate.caseDetails(
      caseId ?? "",
      includeAttachments,
      documentFormat,
      includeCalendarEvents,
      includeOrders,
      includeCaseProducts,
      includePayments
    ),
    queryFn: () =>
      fetchCaseDetails(caseId ?? "", {
        includeAttachments,
        documentFormat,
        includeCalendarEvents,
        includeOrders,
        includeCaseProducts,
        includePayments,
      }),
    enabled: Boolean(caseId),
    staleTime: enablePolling ? 10_000 : 60_000,
    refetchInterval: enablePolling ? 15_000 : false,
    refetchIntervalInBackground: false,
  });
}

export function useLatestCaseId() {
  return useQuery<string>({
    queryKey: queryKeys.careValidate.latestCaseId(),
    queryFn: getLatestCaseId,
    staleTime: 60_000,
    // "No case yet" is a real terminal state — retrying just hammers the
    // endpoint with the same 400. `getLatestCaseId` already maps that 400
    // to "" so the consumer sees an empty string rather than an error.
    retry: false,
  });
}

function useInvalidateCases() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["care-validate", "cases"],
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.careValidate.latestCaseId(),
      }),
    ]);
}

/** `POST /api/patient/my-requests/cases` (doc #2). */
export function useCreateCase() {
  const invalidate = useInvalidateCases();
  return useMutation<CaseItem, unknown, CreateCaseBody>({
    mutationFn: (body) => createCase(body),
    onSuccess: () => invalidate(),
  });
}

/** `POST /api/patient/my-requests/cases/:caseId/forms` (doc #7). */
export function useAddCaseForm(caseId: string) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateCases();
  return useMutation<unknown, unknown, AddCaseFormBody>({
    mutationFn: (body) => addCaseForm(caseId, body),
    onSuccess: async () => {
      await invalidate();
      // Case-detail GET embeds form responses under `responses[]`, and the
      // case-details page derives its forms list from there via
      // `normalizeCaseForms(caseDetails)`. Invalidating the per-case detail
      // key triggers an immediate refetch so the new follow-up appears
      // without waiting on the 15 s poll cycle.
      await queryClient.invalidateQueries({
        queryKey: ["care-validate", "case-details", caseId],
      });
      // NOTE: When a dedicated `useCaseFormResponses` hook gets added (doc #6),
      // also invalidate ["care-validate", "case-form-responses", caseId] here.
    },
  });
}
