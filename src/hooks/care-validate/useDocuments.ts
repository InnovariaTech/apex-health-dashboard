import { useQuery } from "@tanstack/react-query";
import { fetchPatientDocuments } from "@/api/care-validate/documents";
import { queryKeys } from "@/hooks/queryKeys";
import type { PatientDocumentItem } from "@/types/care-validate/document_types";

export function useDocuments() {
  return useQuery<PatientDocumentItem[]>({
    queryKey: queryKeys.careValidate.documents(),
    queryFn: fetchPatientDocuments,
    staleTime: 60_000,
  });
}
