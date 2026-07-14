import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  getTassoTestResult,
  listTassoOrderEvents,
  listTassoTestResults,
  probeTassoLink,
} from "@/api/tasso/patientTasso";
import { queryKeys } from "@/hooks/queryKeys";
import type {
  ListTassoOrderEventsParams,
  ListTassoOrderEventsResult,
  ListTassoTestResultsParams,
  ListTassoTestResultsResult,
  TassoOrderEvent,
  TassoTestResult,
} from "@/types/tasso/patient_types";

/**
 * Tasso patient hooks. Three reads — orders, results list, single
 * result — plus a soft link-status probe.
 *
 * The list hooks use `useInfiniteQuery` even though the live API doesn't
 * always ship `responseMetadata.nextCursor`. When the field is absent we
 * return `undefined` from `getNextPageParam` → no "Load more" surfaces.
 * When the backend starts sending it the UI starts paginating with no
 * frontend changes needed.
 */

const FIVE_MIN_MS = 5 * 60 * 1000;

// ─── Link status ──────────────────────────────────────────────────────────

/**
 * Returns `{ linked, isLoading, isError }`. `linked` is `null` while the
 * probe is in flight (lets the UI render a spinner instead of jumping
 * straight to the not-linked banner).
 */
export function useTassoLinkStatus() {
  const query = useQuery<{ linked: boolean; message?: string }>({
    queryKey: queryKeys.tasso.linkStatus(),
    queryFn: probeTassoLink,
    staleTime: FIVE_MIN_MS,
    retry: false,
  });
  return {
    linked: query.data?.linked ?? null,
    message: query.data?.message,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}

// ─── Order events ─────────────────────────────────────────────────────────

/**
 * Paginated kit lifecycle events. Polls every 60 s for fresh status
 * updates while the page is foregrounded.
 */
export function useTassoOrderEvents(
  filters: Omit<ListTassoOrderEventsParams, "cursor"> = {},
  options: { enabled?: boolean; pollMs?: number } = {},
) {
  const { enabled = true, pollMs = 60_000 } = options;
  return useInfiniteQuery<ListTassoOrderEventsResult>({
    queryKey: queryKeys.tasso.orderEvents(filters),
    queryFn: ({ pageParam }) =>
      listTassoOrderEvents({
        ...filters,
        ...(typeof pageParam === "string" ? { cursor: pageParam } : {}),
      }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.responseMetadata?.nextCursor ?? undefined,
    enabled,
    refetchInterval: pollMs,
    refetchIntervalInBackground: false,
    staleTime: 30_000,
  });
}

/** Flattened convenience accessor — concat every page's `results[]`. */
export function flattenOrderEvents(
  pages: ListTassoOrderEventsResult[] | undefined,
): TassoOrderEvent[] {
  if (!pages) return [];
  const out: TassoOrderEvent[] = [];
  for (const p of pages) {
    if (Array.isArray(p?.results)) out.push(...p.results);
  }
  return out;
}

// ─── Test results ─────────────────────────────────────────────────────────

export function useTassoTestResults(
  filters: Omit<ListTassoTestResultsParams, "cursor"> = {},
  options: { enabled?: boolean } = {},
) {
  const { enabled = true } = options;
  return useInfiniteQuery<ListTassoTestResultsResult>({
    queryKey: queryKeys.tasso.testResults(filters),
    queryFn: ({ pageParam }) =>
      listTassoTestResults({
        ...filters,
        ...(typeof pageParam === "string" ? { cursor: pageParam } : {}),
      }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.responseMetadata?.nextCursor ?? undefined,
    enabled,
    // Test results are immutable once issued — long stale time, no poll.
    staleTime: FIVE_MIN_MS,
  });
}

export function flattenTestResults(
  pages: ListTassoTestResultsResult[] | undefined,
): TassoTestResult[] {
  if (!pages) return [];
  const out: TassoTestResult[] = [];
  for (const p of pages) {
    if (Array.isArray(p?.results)) out.push(...p.results);
  }
  return out;
}

// ─── Single test result ───────────────────────────────────────────────────

export function useTassoTestResult(testResultId: string | undefined) {
  return useQuery<TassoTestResult>({
    queryKey: queryKeys.tasso.testResult(testResultId ?? ""),
    queryFn: () => getTassoTestResult(testResultId as string),
    enabled: typeof testResultId === "string" && testResultId.length > 0,
    staleTime: FIVE_MIN_MS,
  });
}
