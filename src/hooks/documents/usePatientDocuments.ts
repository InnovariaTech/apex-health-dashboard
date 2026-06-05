import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteDocument,
  downloadDocument,
  listDocuments,
  uploadDocument,
} from "@/api/documents/patientDocuments";
import { queryKeys } from "@/hooks/queryKeys";
import type {
  UploadDocumentPayload,
} from "@/types/documents/document_types";

/**
 * Hooks for `/api/patient/documents/*`. Distinct from care-validate hooks.
 */

export function usePatientDocuments() {
  return useQuery({
    queryKey: queryKeys.patientDocuments.list(),
    queryFn: listDocuments,
    staleTime: 30 * 1000,
  });
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: queryKeys.patientDocuments.list() });
}

export function useUploadPatientDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UploadDocumentPayload) => uploadDocument(payload),
    onSuccess: () => invalidate(qc),
  });
}

export function useDeletePatientDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDocument(id),
    onSuccess: () => invalidate(qc),
  });
}

/**
 * Download is a one-shot side effect (writes a file to the user's machine) —
 * exposed as a mutation so the page can show pending state and surface
 * errors via the existing error path.
 */
export function useDownloadPatientDocument() {
  return useMutation({
    mutationFn: ({ id, filename }: { id: string; filename: string }) =>
      downloadDocument(id, filename),
  });
}
