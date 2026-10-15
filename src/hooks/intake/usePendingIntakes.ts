import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyIntakes, getPendingIntakes } from "@/api/intake/intake";
import { queryKeys } from "@/hooks/queryKeys";
import { onIntakeCompleted } from "@/lib/intakeChannel";
import { isImpersonating } from "@/lib/impersonation";

/**
 * Forms the patient paid for and has not filled in.
 *
 * Read ONCE per app load, never on focus or remount: every read of
 * `/api/patient/intakes/pending` issues new form links and retires the old ones, so a
 * background refetch would break a form the patient has open in another tab. The links in this
 * result are what "Fill out form" opens. When a form is finished in another tab, the list is
 * read again — and the intake page heals a retired link on its own (see IntakeRuntime).
 *
 * Off for an admin viewing as the patient: read-only, they could not answer.
 */
export function usePendingIntakes() {
  const qc = useQueryClient();
  const enabled = !isImpersonating();

  useEffect(
    () =>
      onIntakeCompleted(() => {
        void qc.invalidateQueries({ queryKey: queryKeys.intake.pending() });
        void qc.invalidateQueries({ queryKey: queryKeys.intake.mine() });
      }),
    [qc],
  );

  return useQuery({
    queryKey: queryKeys.intake.pending(),
    queryFn: getPendingIntakes,
    enabled,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: false,
  });
}

/** Opens a form in a new tab. The submission id rides along so the tab can renew a retired link. */
export function openIntakeForm(token: string, submissionId: string): void {
  const url = `/intake/${encodeURIComponent(token)}?s=${encodeURIComponent(submissionId)}`;
  // Not "noopener" in the features: with it, window.open always returns null and we could not tell
  // a blocked popup from an opened one. The opener link is cut by hand instead.
  const win = window.open(url, "_blank");
  if (win) win.opener = null;
  else window.location.assign(url); // Popup blocked: open it here instead.
}

/**
 * Every form of the patient's and where it stands — the submitted ones are what the dashboard
 * tracks. Unlike the pending list this mints no links, so ordinary refetching is fine.
 */
export function useMyIntakes() {
  const qc = useQueryClient();
  useEffect(
    () =>
      onIntakeCompleted(() => {
        void qc.invalidateQueries({ queryKey: queryKeys.intake.mine() });
      }),
    [qc],
  );
  return useQuery({
    queryKey: queryKeys.intake.mine(),
    queryFn: getMyIntakes,
    // Readable by an admin viewing as the patient too: a read, and it mints nothing.
    staleTime: 60_000,
    retry: false,
  });
}
