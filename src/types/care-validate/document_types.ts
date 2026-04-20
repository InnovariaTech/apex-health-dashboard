export interface DocumentUploader {
  firstName?: string;
  lastName?: string;
  [key: string]: unknown;
}

export interface DocumentInnerRaw {
  id?: string;
  isRestricted?: boolean;
  isPHI?: boolean;
  fileName?: string;
  isDeleted?: boolean;
  createdAt?: string;
  uploadedBy?: DocumentUploader;
  url?: string;
  [key: string]: unknown;
}

export interface DocumentRaw {
  id?: string;
  fileName?: string;
  createdAt?: string;
  type?: string | null;
  caseId?: string;
  source?: string;
  raw?: DocumentInnerRaw;
  [key: string]: unknown;
}

export interface PatientDocumentItem {
  id: string;
  fileName: string;
  createdAt: string;
  caseId: string;
  raw: DocumentRaw;
}

export interface FetchPatientDocumentsResponse {
  success: boolean;
  data: PatientDocumentItem[];
}
