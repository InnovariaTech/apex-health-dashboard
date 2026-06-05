import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  analyzeDocument,
  fetchPatientDocuments,
} from "@/api/care-validate/documents";
import {
  deleteFile,
  getFileDownloadUrl,
  renameFile,
  uploadFile,
} from "@/api/care-validate/files";
import { queryKeys } from "@/hooks/queryKeys";
import type {
  AnalyzeDocumentResult,
  DeleteFileResponse,
  FileDownloadUrl,
  FileMetadata,
  PatientDocumentItem,
  UploadFileBody,
} from "@/types/care-validate/document_types";

/** `GET /api/patient/my-documents` (doc #8). */
export function useDocuments() {
  return useQuery<PatientDocumentItem[]>({
    queryKey: queryKeys.careValidate.documents(),
    queryFn: fetchPatientDocuments,
    staleTime: 60_000,
  });
}

function useInvalidateDocuments() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({
      queryKey: queryKeys.careValidate.documents(),
    });
}

/** `POST /api/patient/files/upload` (doc #13). */
export function useUploadFile() {
  const invalidate = useInvalidateDocuments();
  return useMutation<FileMetadata, unknown, UploadFileBody>({
    mutationFn: (body) => uploadFile(body),
    onSuccess: () => invalidate(),
  });
}

/** `DELETE /api/patient/files/:id` (doc #15). */
export function useDeleteFile() {
  const invalidate = useInvalidateDocuments();
  return useMutation<DeleteFileResponse, unknown, string>({
    mutationFn: (id) => deleteFile(id),
    onSuccess: () => invalidate(),
  });
}

/** `PATCH /api/patient/files/:id/metadata` (doc #14). */
export function useRenameFile() {
  const invalidate = useInvalidateDocuments();
  return useMutation<FileMetadata, unknown, { id: string; fileName: string }>({
    mutationFn: ({ id, fileName }) => renameFile(id, fileName),
    onSuccess: () => invalidate(),
  });
}

/**
 * `GET /api/patient/files/:id/download` (doc #12). Returned as a mutation
 * (rather than a query) so the pre-signed URL is requested only when the
 * user actually clicks "View File" — pre-fetching every link wastes the
 * expiry window.
 */
export function useFileDownloadUrl() {
  return useMutation<FileDownloadUrl, unknown, string>({
    mutationFn: (id) => getFileDownloadUrl(id),
  });
}

/** `POST /api/patient/my-documents/:docId/analyze` (doc #10). */
export function useAnalyzeDocument() {
  return useMutation<AnalyzeDocumentResult, unknown, string>({
    mutationFn: (docId) => analyzeDocument(docId),
  });
}
