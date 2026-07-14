// @ts-nocheck
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/api/client";
import {
  useDocuments,
  useUploadFile,
  useDeleteFile,
  useFileDownloadUrl,
  useAnalyzeDocument,
} from "@/hooks/care-validate/useDocuments";
import { useCasesYearRolling, useLatestCaseId } from "@/hooks/care-validate/useCases";
import { ELIGIBLE_CASE_STATUSES } from "@/types/care-validate/case_types";
import { fileToBase64, isAllowedUploadMimeType } from "@/api/care-validate/files";
import {
  ALLOWED_UPLOAD_MIME_TYPES,
  type PatientDocumentItem,
} from "@/types/care-validate/document_types";
import {
  usePatientDocuments,
  useUploadPatientDocument,
  useDeletePatientDocument,
  useDownloadPatientDocument,
} from "@/hooks/documents/usePatientDocuments";
import {
  DOCUMENT_CATEGORY_META,
  ALLOWED_UPLOAD_ACCEPT as GENERAL_UPLOAD_ACCEPT,
  isAllowedUploadMimeType as isGeneralUploadMime,
  type DocumentCategory,
  type PatientDocument as GeneralPatientDocument,
} from "@/types/documents/document_types";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import {
  Upload,
  FolderOpen,
  FileText,
  Sparkles,
  Trash2,
  FlaskConical,
  Activity,
  Dumbbell,
  Pill,
  Stethoscope,
  File,
} from "lucide-react";
import { format } from "date-fns";
import { createPageUrl } from "@/utils";
import { useAiChatStore } from "@/stores/aiChatStore";

const DOC_TYPES = [
  { value: "lab_results", label: "Lab Results", icon: FlaskConical },
  { value: "dxa_scan", label: "DXA Scan", icon: Activity },
  { value: "inbody_report", label: "InBody Report", icon: Dumbbell },
  { value: "imaging", label: "Imaging", icon: Activity },
  { value: "prescription", label: "Prescription", icon: Pill },
  { value: "consultation_notes", label: "Consultation Notes", icon: Stethoscope },
  { value: "other", label: "Other", icon: File },
];

const ALLOWED_FILE_ACCEPT = ALLOWED_UPLOAD_MIME_TYPES.join(",");

function getDocMeta(type) {
  return DOC_TYPES.find((d) => d.value === type) || DOC_TYPES[DOC_TYPES.length - 1];
}

function mapApiDocumentToPageDocument(doc: PatientDocumentItem) {
  const uploader = doc.raw?.raw?.uploadedBy || {};
  const uploaderName = [uploader.firstName, uploader.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return {
    id: doc.id,
    file_name: doc.fileName || doc.raw?.fileName || "Untitled Document",
    case_id: doc.caseId || doc.raw?.caseId || "",
    document_type: doc.raw?.type || "other",
    document_date: doc.raw?.raw?.createdAt || doc.createdAt || "",
    provider: uploaderName,
    notes: String(doc.raw?.notes || ""),
    ai_summary: String(doc.raw?.ai_summary || ""),
  };
}

function describeUploadError(err: unknown): string {
  const fallback = "Upload failed. Please try again.";
  if (!err || typeof err !== "object") return fallback;
  const e = err as Record<string, unknown> & {
    response?: { data?: { message?: string } };
    message?: string;
  };
  const apiMsg = e.response?.data?.message;
  if (typeof apiMsg === "string" && apiMsg.trim()) return apiMsg;
  if (typeof e.message === "string" && e.message.trim()) return e.message;
  return fallback;
}

export default function AiDocumentsTab() {
  const navigate = useNavigate();
  const setSessionId = useAiChatStore((s) => s.setSessionId);
  const setPendingPrompt = useAiChatStore((s) => s.setPendingPrompt);

  const [currentUser, setCurrentUser] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [analyzingDocId, setAnalyzingDocId] = useState<string | null>(null);
  const [uploadForm, setUploadForm] = useState({
    document_type: "lab_results",
    document_date: format(new Date(), "yyyy-MM-dd"),
    provider: "",
    notes: "",
  });

  const { data: apiDocuments = [], isLoading, isError } = useDocuments();
  const latestCaseQuery = useLatestCaseId();
  // Six parallel 2-month windows (1 year), pre-filtered server-side to
  // the 4 statuses the user can actually attach documents against
  // (OPEN/ASSIGNED/IN_PROGRESS/APPROVED). Closed / rejected cases never
  // enter the picker.
  const casesQuery = useCasesYearRolling({ status: ELIGIBLE_CASE_STATUSES });
  const cases = casesQuery.data ?? [];
  const uploadFileMutation = useUploadFile();
  const deleteFileMutation = useDeleteFile();
  const fileDownloadMutation = useFileDownloadUrl();
  const analyzeMutation = useAnalyzeDocument();

  // Picked case for the "Case documents" section. Auto-default picks from
  // the eligible cases only — if `latestCaseQuery` points at a now-closed
  // case it's ignored. If there's exactly one eligible case the dropdown
  // hides itself and stays pinned to it.
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  useEffect(() => {
    if (selectedCaseId) return;
    const latest = latestCaseQuery.data;
    if (
      typeof latest === "string" &&
      latest &&
      cases.some((c) => c.id === latest)
    ) {
      setSelectedCaseId(latest);
      return;
    }
    if (cases.length === 1) {
      setSelectedCaseId(cases[0].id);
    }
  }, [selectedCaseId, latestCaseQuery.data, cases]);

  // If the currently selected case drops out of the eligible list (e.g. it
  // got closed since the page mounted), clear the selection so the user
  // either picks a new one or sees the empty state.
  useEffect(() => {
    if (!selectedCaseId) return;
    if (!cases.some((c) => c.id === selectedCaseId)) {
      setSelectedCaseId("");
    }
  }, [selectedCaseId, cases]);

  useEffect(() => {
    api.auth
      .me()
      .then(setCurrentUser)
      .catch(() => setCurrentUser(null));
  }, []);

  const documents = apiDocuments.map(mapApiDocumentToPageDocument);
  // Case section list: scoped to the case the user picked. If nothing is
  // picked (rare — both auto-select branches above missed) we show empty.
  const filtered = selectedCaseId
    ? documents.filter((d) => d.case_id === selectedCaseId)
    : documents;
  const isUploading = uploadFileMutation.isPending;
  const canUpload = Boolean(selectedCaseId);

  // Drag-state for the case upload zone — toggled in the dragover/leave
  // handlers so the dashed border switches to the primary color while a
  // file is being held over it.
  const [isCaseDraggingOver, setIsCaseDraggingOver] = useState(false);

  /**
   * Shared case-upload pipeline used by the click-to-pick input AND the
   * drag-and-drop handler — same checks (case selected, MIME allowed),
   * same upload + toast, so behavior is identical either way.
   */
  const processCaseFile = async (file: File | null) => {
    if (!file) return;
    if (!selectedCaseId) {
      toast({
        title: "No case selected",
        description:
          "Pick a case in the Case documents section before uploading.",
        variant: "destructive",
      });
      return;
    }
    if (!isAllowedUploadMimeType(file.type)) {
      toast({
        title: "Unsupported file type",
        description: `${file.type || "Unknown type"} isn't accepted. Allowed: PDF, DOC, CSV, TXT, JPEG, PNG, SVG, TIFF, WebP.`,
        variant: "destructive",
      });
      return;
    }

    try {
      const data = await fileToBase64(file);
      await uploadFileMutation.mutateAsync({
        name: file.name,
        data,
        caseId: selectedCaseId,
        mimeType: file.type,
      });
      toast({
        title: "Document uploaded",
        description: file.name,
      });
      setShowUpload(false);
      setUploadForm({
        document_type: "lab_results",
        document_date: format(new Date(), "yyyy-MM-dd"),
        provider: "",
        notes: "",
      });
    } catch (err) {
      toast({
        title: "Upload failed",
        description: describeUploadError(err),
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    // Clear so the same file can be re-selected after a validation reject.
    e.target.value = "";
    await processCaseFile(file ?? null);
  };

  const handleCaseDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    if (!isCaseDraggingOver) setIsCaseDraggingOver(true);
  };

  const handleCaseDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsCaseDraggingOver(false);
  };

  const handleCaseDrop = async (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsCaseDraggingOver(false);
    if (!canUpload || isUploading) return;
    await processCaseFile(e.dataTransfer.files?.[0] ?? null);
  };

  const handleAnalyze = async (doc) => {
    if (!doc?.id) return;
    setAnalyzingDocId(doc.id);
    try {
      const result = await analyzeMutation.mutateAsync(doc.id);
      if (result.sessionId) setSessionId(result.sessionId);
      setPendingPrompt({
        message:
          result.triggerMessage ||
          `Please analyse my lab report with ID: ${doc.id}.`,
        isHidden: true,
        documentId: doc.id,
      });
      setSelectedDoc(null);
      navigate(createPageUrl("Chat"));
    } catch (err) {
      toast({
        title: "Couldn't start the analysis",
        description: describeUploadError(err),
        variant: "destructive",
      });
    } finally {
      setAnalyzingDocId(null);
    }
  };

  const handleDelete = async (docId) => {
    if (!docId) return;
    try {
      await deleteFileMutation.mutateAsync(docId);
      if (selectedDoc?.id === docId) setSelectedDoc(null);
      toast({ title: "Document deleted" });
    } catch (err) {
      toast({
        title: "Couldn't delete document",
        description: describeUploadError(err),
        variant: "destructive",
      });
    }
  };

  const handleViewFile = async (docId) => {
    if (!docId) return;
    try {
      const { downloadUrl } = await fileDownloadMutation.mutateAsync(docId);
      if (!downloadUrl) {
        toast({
          title: "Download unavailable",
          description: "No download link was returned for this file.",
          variant: "destructive",
        });
        return;
      }
      window.open(downloadUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast({
        title: "Couldn't open file",
        description: describeUploadError(err),
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* ────────────────────────────────────────────────────────────────────
       * Section 1 — General documents (no case)
       * Uses the new `POST /api/patient/documents` flow with `cv_upload=true`
       * so the file is mirrored to CareValidate as a general document.
       * ──────────────────────────────────────────────────────────────────── */}
      <GeneralDocumentsSection />

      {/* ────────────────────────────────────────────────────────────────────
       * Section 2 — Case documents (case-attached, AI-analyzed)
       * Same CareValidate file flow as before; the case picker replaces
       * the implicit "latest case" target.
       * ──────────────────────────────────────────────────────────────────── */}
      <section>
        <div className="mb-5">
          <h2 className="apex-card-title flex items-center gap-2 mb-1">
            <FlaskConical className="w-4 h-4 text-primary" /> Case documents
          </h2>
          <p className="text-sm text-muted-foreground">
            Attach files to a specific case. Each upload is AI-analyzable.
          </p>
        </div>

        {/* Case picker */}
        {casesQuery.isLoading ? (
          <p className="text-sm text-muted-foreground mb-5">Loading cases…</p>
        ) : cases.length === 0 ? (
          // Covers both "no cases at all" and "every case the user has
          // is closed/rejected" — eligible-status filter already strips
          // the non-attachable ones server-side, so this single banner is
          // accurate in either situation.
          <div
            className="apex-card mb-5 p-4 text-sm"
            style={{
              borderColor: "var(--bord)",
              background: "var(--bord-soft)",
              color: "var(--bord)",
            }}
          >
            You don't have any active cases. Submit or reopen a case from{" "}
            <strong>My Cases</strong> to start attaching documents.
          </div>
        ) : cases.length === 1 ? (
          <p className="text-sm text-muted-foreground mb-5">
            Attaching to case{" "}
            <strong className="text-foreground">
              {cases[0].shortId ? `#${cases[0].shortId} · ` : ""}
              {cases[0].title || "Untitled"}
            </strong>
          </p>
        ) : (
          <div className="mb-5 flex items-center gap-3 flex-wrap">
            <label className="text-sm text-muted-foreground">Case:</label>
            <Select value={selectedCaseId} onValueChange={setSelectedCaseId}>
              <SelectTrigger className="w-[320px] max-w-full">
                <SelectValue placeholder="Pick a case" />
              </SelectTrigger>
              <SelectContent>
                {cases.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.shortId ? `#${c.shortId} · ` : ""}
                    {c.title || "Untitled"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

      {/* Tab-local actions */}
      <div className="mb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Labs, scans, reports — AI-analyzed for insights. Uploads attach to the case picked above.
        </p>
        <Button onClick={() => setShowUpload(true)} disabled={!canUpload} className="gap-2">
          <Upload className="w-4 h-4" /> Upload document
        </Button>
      </div>

      {/* AI tip banner */}
      <div
        className="apex-card mb-6 p-4 flex items-start gap-3"
        style={{
          borderColor: "var(--apex-accent-soft)",
          background: "var(--apex-accent-soft)",
        }}
      >
        <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <p className="text-[13px] text-foreground leading-relaxed">
          Upload your labs, DXA scans, or InBody reports and tap{" "}
          <strong className="font-semibold">Analyze with AI</strong> to get
          personalized insights, flag abnormal values, and receive targeted
          recommendations from your Apex MD AI assistant.
        </p>
      </div>

      {isError && (
        <div
          className="apex-card mb-6 p-4 text-sm"
          style={{
            borderColor: "var(--att)",
            background: "var(--att-soft)",
            color: "var(--att)",
          }}
        >
          Unable to load documents right now. Please refresh and try again.
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-1.5 flex-wrap mb-6">
        <button className="text-[13px] px-3.5 py-1.5 rounded-full border bg-foreground text-background border-foreground transition-colors">
          All{" "}
          <span className="font-mono text-[11px] opacity-60 ml-1">
            {documents.length}
          </span>
        </button>
      </div>

      {/* Document grid */}
      {filtered.length === 0 ? (
        <div className="apex-card border-dashed py-16 text-center">
          <FolderOpen className="w-16 h-16 text-ink-4 mx-auto mb-4" />
          <h3 className="font-serif text-lg font-medium text-foreground mb-1">
            No documents yet
          </h3>
          <p className="text-[13px] text-muted-foreground mb-4">
            Upload your lab results, scans, and reports to get started
          </p>
          <Button onClick={() => setShowUpload(true)} disabled={!canUpload}>
            <Upload className="w-4 h-4" /> Upload first document
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filtered.map((doc) => {
            const meta = getDocMeta(doc.document_type);
            const Icon = meta.icon;
            const isAnalyzing = analyzingDocId === doc.id;
            const isDeleting =
              deleteFileMutation.isPending &&
              deleteFileMutation.variables === doc.id;
            return (
              <button
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className="apex-card text-left w-full px-5 py-[18px] transition-all duration-150 hover:-translate-y-px hover:border-[var(--line-2)] focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-[10px] bg-secondary flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-ink-2" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h3 className="font-medium text-foreground text-[13.5px] leading-tight truncate">
                        {doc.file_name}
                      </h3>
                      <span
                        role="button"
                        tabIndex={0}
                        aria-label="Delete document"
                        aria-disabled={isDeleting}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isDeleting) handleDelete(doc.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !isDeleting) {
                            e.stopPropagation();
                            handleDelete(doc.id);
                          }
                        }}
                        className={`text-muted-foreground hover:text-primary transition-colors flex-shrink-0 cursor-pointer ${
                          isDeleting ? "opacity-50 pointer-events-none" : ""
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <Badge variant="outline">{meta.label}</Badge>
                      {doc.document_date && (
                        <Badge variant="secondary" className="font-mono">
                          {doc.document_date}
                        </Badge>
                      )}
                      {doc.provider && (
                        <Badge variant="outline">{doc.provider}</Badge>
                      )}
                    </div>
                    {doc.ai_summary ? (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {doc.ai_summary.slice(0, 120)}…
                      </p>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAnalyze(doc);
                        }}
                        disabled={isAnalyzing}
                        className="h-7 mt-1"
                      >
                        {isAnalyzing ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />{" "}
                            Analyzing…
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3" /> Analyze with AI
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-medium tracking-[-0.02em]">
              Upload document
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="apex-eyebrow mb-2 block">Document Type</label>
              <Select
                value={uploadForm.document_type}
                onValueChange={(v) =>
                  setUploadForm({ ...uploadForm, document_type: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map((dt) => (
                    <SelectItem key={dt.value} value={dt.value}>
                      {dt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="apex-eyebrow mb-2 block">Document Date</label>
              <input
                type="date"
                value={uploadForm.document_date}
                onChange={(e) =>
                  setUploadForm({ ...uploadForm, document_date: e.target.value })
                }
                className="w-full border border-border rounded-[10px] px-3 py-2 text-sm bg-background text-foreground font-mono"
              />
            </div>
            <div>
              <label className="apex-eyebrow mb-2 block">Provider / Lab Name</label>
              <input
                type="text"
                value={uploadForm.provider}
                onChange={(e) =>
                  setUploadForm({ ...uploadForm, provider: e.target.value })
                }
                placeholder="e.g., LabCorp, Quest, Apex MD"
                className="w-full border border-border rounded-[10px] px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <label className="apex-eyebrow mb-2 block">Notes (optional)</label>
              <Textarea
                value={uploadForm.notes}
                onChange={(e) =>
                  setUploadForm({ ...uploadForm, notes: e.target.value })
                }
                placeholder="Any context about this document..."
                rows={2}
              />
            </div>
            <label
              onDragOver={handleCaseDragOver}
              onDragEnter={handleCaseDragOver}
              onDragLeave={handleCaseDragLeave}
              onDrop={handleCaseDrop}
              className={`block ${
                canUpload ? "cursor-pointer" : "cursor-not-allowed"
              }`}
            >
              <input
                type="file"
                accept={ALLOWED_FILE_ACCEPT}
                onChange={handleFileUpload}
                className="hidden"
                disabled={!canUpload || isUploading}
              />
              <div
                className={`w-full border border-dashed rounded-[14px] p-6 text-center transition-all ${
                  isUploading
                    ? "opacity-60 border-border bg-surface-2"
                    : isCaseDraggingOver && canUpload
                      ? "border-primary bg-primary/5"
                      : canUpload
                        ? "border-border bg-surface-2 hover:border-[var(--line-2)]"
                        : "opacity-50 border-border bg-surface-2"
                }`}
              >
                {isUploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    <p className="text-sm font-medium text-foreground">
                      Uploading…
                    </p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-ink-3 mx-auto mb-2" />
                    <p className="font-medium text-foreground">
                      {isCaseDraggingOver && canUpload
                        ? "Drop your file here"
                        : canUpload
                          ? "Drop a file here or click to browse"
                          : "Open a case before uploading"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, DOC, CSV, TXT, JPEG, PNG, SVG, TIFF, WebP
                    </p>
                  </>
                )}
              </div>
            </label>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Detail Dialog */}
      <Dialog open={!!selectedDoc} onOpenChange={() => setSelectedDoc(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedDoc &&
            (() => {
              const meta = getDocMeta(selectedDoc.document_type);
              const Icon = meta.icon;
              const isAnalyzing = analyzingDocId === selectedDoc.id;
              const isFetchingDownload = fileDownloadMutation.isPending;
              return (
                <>
                  <DialogHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-[10px] bg-secondary flex items-center justify-center">
                        <Icon className="w-5 h-5 text-ink-2" />
                      </div>
                      <div>
                        <DialogTitle className="font-serif text-xl font-medium tracking-[-0.02em]">
                          {selectedDoc.file_name}
                        </DialogTitle>
                        <p className="text-[13px] text-muted-foreground">
                          {meta.label}
                          {selectedDoc.provider
                            ? ` · ${selectedDoc.provider}`
                            : ""}
                          {selectedDoc.document_date
                            ? ` · ${selectedDoc.document_date}`
                            : ""}
                        </p>
                      </div>
                    </div>
                  </DialogHeader>

                  <div className="space-y-4 mt-2">
                    {selectedDoc.notes && (
                      <div>
                        <p className="apex-eyebrow mb-1">Notes</p>
                        <p className="text-sm text-foreground leading-relaxed">
                          {selectedDoc.notes}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewFile(selectedDoc.id)}
                        disabled={isFetchingDownload}
                      >
                        {isFetchingDownload ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />{" "}
                            Preparing…
                          </>
                        ) : (
                          <>
                            <FileText className="w-4 h-4" /> View File
                          </>
                        )}
                      </Button>
                      {!selectedDoc.ai_summary && (
                        <Button
                          size="sm"
                          onClick={() => handleAnalyze(selectedDoc)}
                          disabled={isAnalyzing}
                        >
                          {isAnalyzing ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />{" "}
                              Analyzing…
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" /> Analyze with AI
                            </>
                          )}
                        </Button>
                      )}
                      {selectedDoc.ai_summary && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAnalyze(selectedDoc)}
                          disabled={isAnalyzing}
                        >
                          <Sparkles className="w-4 h-4" /> Re-analyze
                        </Button>
                      )}
                    </div>

                    {isAnalyzing && (
                      <div
                        className="apex-card p-4 text-center"
                        style={{
                          borderColor: "var(--apex-accent-soft)",
                          background: "var(--apex-accent-soft)",
                        }}
                      >
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
                        <p className="text-sm font-medium text-foreground">
                          AI is reading your document…
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          This may take 15–30 seconds
                        </p>
                      </div>
                    )}

                    {selectedDoc.ai_summary && (
                      <div
                        className="apex-card p-4"
                        style={{
                          borderColor: "var(--apex-accent-soft)",
                          background: "var(--apex-accent-soft)",
                        }}
                      >
                        <p className="apex-card-title flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-primary" /> AI Analysis
                        </p>
                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                          {selectedDoc.ai_summary}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
        </DialogContent>
      </Dialog>
      </section>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// General documents — `/api/patient/documents` with `cv_upload=true`. Lets
// the user upload to CareValidate without picking a case. Mirrors the My
// Uploads tab visually but with an explicit "Upload to CareValidate" CTA
// and a list scoped to docs that actually live in CareValidate.
// ────────────────────────────────────────────────────────────────────────────

const GENERAL_MAX_SIZE_BYTES = 20 * 1024 * 1024;

function formatGeneralBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function GeneralDocumentsSection() {
  const navigate = useNavigate();
  const setSessionId = useAiChatStore((s) => s.setSessionId);
  const setPendingPrompt = useAiChatStore((s) => s.setPendingPrompt);

  const { data: documents = [], isLoading, isError } =
    usePatientDocuments({ cvUpload: true });
  const uploadMutation = useUploadPatientDocument();
  const deleteMutation = useDeletePatientDocument();
  const downloadMutation = useDownloadPatientDocument();
  const analyzeMutation = useAnalyzeDocument();

  const [showUpload, setShowUpload] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [category, setCategory] = useState<DocumentCategory>("lab_report");
  const [uploadError, setUploadError] = useState("");
  const [analyzingDocId, setAnalyzingDocId] = useState<string | null>(null);
  // Drag-and-drop tracking — toggled on dragenter/dragleave so the drop
  // zone can highlight while the user is holding a file over it.
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const resetForm = () => {
    setPendingFile(null);
    setUploadError("");
    setCategory("lab_report");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /**
   * Shared file-validation path used by both the click-to-pick `<input>`
   * and the drag-and-drop handler — same MIME + size guards, same error
   * messages either way.
   */
  const acceptFile = (file: File | null) => {
    setUploadError("");
    if (!file) {
      setPendingFile(null);
      return;
    }
    if (!isGeneralUploadMime(file.type)) {
      setUploadError(
        `${file.type || "Unknown"} isn't accepted. Allowed: PDF, JPEG, PNG.`,
      );
      setPendingFile(null);
      return;
    }
    if (file.size > GENERAL_MAX_SIZE_BYTES) {
      setUploadError(
        `File is ${formatGeneralBytes(file.size)} — limit is ${formatGeneralBytes(GENERAL_MAX_SIZE_BYTES)}.`,
      );
      setPendingFile(null);
      return;
    }
    setPendingFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    acceptFile(e.target.files?.[0] ?? null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    if (!isDraggingOver) setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    acceptFile(e.dataTransfer.files?.[0] ?? null);
  };

  const handleUpload = async () => {
    if (!pendingFile) {
      setUploadError("Choose a file first.");
      return;
    }
    try {
      await uploadMutation.mutateAsync({
        file: pendingFile,
        category,
        cvUpload: true,
      });
      toast({
        title: "Document uploaded for AI analysis",
        description: pendingFile.name,
      });
      setShowUpload(false);
      resetForm();
    } catch (err) {
      setUploadError(describeUploadError(err));
    }
  };

  const handleDelete = async (doc: GeneralPatientDocument) => {
    if (!confirm(`Delete "${doc.originalName}"? This can't be undone.`)) return;
    try {
      await deleteMutation.mutateAsync(doc.id);
      toast({ title: "Document deleted", description: doc.originalName });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Couldn't delete",
        description: describeUploadError(err),
      });
    }
  };

  const handleDownload = async (doc: GeneralPatientDocument) => {
    try {
      await downloadMutation.mutateAsync({
        id: doc.id,
        filename: doc.originalName,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Couldn't download",
        description: describeUploadError(err),
      });
    }
  };

  /**
   * "Analyze" isn't a dedicated backend endpoint or a separate page.
   * `AIAssistantBar` is mounted globally in `AppLayout` and watches the
   * zustand `pendingPrompt` — when one appears it consumes the prompt,
   * posts it through the streaming-chat endpoint, AND auto-expands the
   * floating panel (`AIAssistantBar.tsx:189`).
   *
   * So all we do here is seed the prompt; the user stays on the Documents
   * tab and the AI panel pops open with the seed message hidden, ready to
   * stream the assistant's response.
   *
   * (The previous `navigate("/Chat")` was a mistake — `/Chat` is the
   * care-team messaging page, completely unrelated to the AI assistant.)
   */
  const handleAnalyze = (doc: GeneralPatientDocument) => {
    const cvId = doc.careValidateFileId;
    if (!cvId) {
      toast({
        variant: "destructive",
        title: "Can't analyze this document",
        description:
          "This document isn't linked for AI analysis. Re-upload from the AI Documents tab to enable analysis.",
      });
      return;
    }
    setPendingPrompt({
      message: `Please analyse my document "${doc.originalName}".`,
      isHidden: true,
      documentId: cvId,
    });
  };

  return (
    <section>
      <div className="mb-5 flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <h2 className="apex-card-title flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-primary" /> General documents
          </h2>
          <p className="text-sm text-muted-foreground">
            Upload documents for AI analysis without picking a case.
          </p>
        </div>
        <Button onClick={() => setShowUpload(true)} className="gap-2">
          <Upload className="w-4 h-4" /> Upload for AI Analysis
        </Button>
      </div>

      {isError ? (
        <div
          className="apex-card mb-2 p-4 text-sm"
          style={{
            borderColor: "var(--att)",
            background: "var(--att-soft)",
            color: "var(--att)",
          }}
        >
          Unable to load documents right now.
        </div>
      ) : isLoading ? (
        <div className="py-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </div>
      ) : documents.length === 0 ? (
        <div className="apex-card border-dashed py-10 text-center">
          <FolderOpen className="w-12 h-12 text-ink-4 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">
            No general documents yet
          </p>
          <p className="text-xs text-muted-foreground">
            Click "Upload for AI Analysis" above to add your first one.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {documents.map((doc) => {
            const isDeleting =
              deleteMutation.isPending && deleteMutation.variables === doc.id;
            const isDownloading =
              downloadMutation.isPending &&
              (downloadMutation.variables as { id?: string } | undefined)?.id === doc.id;
            const isAnalyzing = analyzingDocId === doc.id;
            // Analyze hits CareValidate, so the doc must have been mirrored
            // there via cv_upload=true. Local-only docs disable the button.
            const canAnalyze = Boolean(doc.careValidateFileId);
            return (
              <div key={doc.id} className="apex-card p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-[10px] bg-secondary flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-ink-2" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-medium text-foreground text-[13.5px] truncate"
                      title={doc.originalName}
                    >
                      {doc.originalName}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      <Badge variant="outline">
                        {DOCUMENT_CATEGORY_META.find(
                          (m) => m.value === doc.category,
                        )?.label ?? doc.category}
                      </Badge>
                      <Badge variant="secondary" className="font-mono">
                        {formatGeneralBytes(doc.size)}
                      </Badge>
                      {doc.careValidateFileId && (
                        <Badge
                          variant="outline"
                          className="border-primary text-primary"
                        >
                          AI Ready
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2 mt-3 flex-wrap">
                      <Button
                        size="sm"
                        onClick={() => void handleAnalyze(doc)}
                        disabled={!canAnalyze || isAnalyzing}
                        title={
                          canAnalyze
                            ? "Run AI analysis on this document"
                            : "Re-upload from the AI Documents tab to enable analysis."
                        }
                        className="gap-1.5 h-8"
                      >
                        {isAnalyzing ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                        {isAnalyzing ? "Analyzing…" : "Analyze with AI"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 h-8"
                        onClick={() => void handleDownload(doc)}
                        disabled={isDownloading}
                      >
                        {isDownloading ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
                        ) : (
                          <Download className="w-3 h-3" />
                        )}
                        Download
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1.5 h-8 text-destructive"
                        onClick={() => void handleDelete(doc)}
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog
        open={showUpload}
        onOpenChange={(open) => {
          setShowUpload(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload for AI Analysis</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="apex-eyebrow mb-1.5 block">Category</label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as DocumentCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_CATEGORY_META.map((meta) => (
                    <SelectItem key={meta.value} value={meta.value}>
                      {meta.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="apex-eyebrow mb-1.5 block">File</label>
              <label
                onDragOver={handleDragOver}
                onDragEnter={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`block w-full cursor-pointer border border-dashed rounded-[14px] p-6 text-center transition-colors ${
                  isDraggingOver
                    ? "border-primary bg-primary/5"
                    : "border-border bg-surface-2 hover:border-[var(--line-2)]"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={GENERAL_UPLOAD_ACCEPT}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Upload className="w-8 h-8 text-ink-3 mx-auto mb-2" />
                <p className="font-medium text-foreground text-sm">
                  {isDraggingOver
                    ? "Drop your file here"
                    : pendingFile
                      ? "Click to pick a different file"
                      : "Drop a file here or click to browse"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  PDF, JPEG, or PNG · up to{" "}
                  {formatGeneralBytes(GENERAL_MAX_SIZE_BYTES)}
                </p>
                {pendingFile && (
                  <p className="text-xs mt-3 text-foreground font-mono truncate">
                    {pendingFile.name} · {formatGeneralBytes(pendingFile.size)}
                  </p>
                )}
              </label>
            </div>
            {uploadError && (
              <div
                className="apex-card p-3 text-sm flex items-start gap-2"
                style={{
                  borderColor: "var(--att)",
                  background: "var(--att-soft)",
                  color: "var(--att)",
                }}
              >
                <span>{uploadError}</span>
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowUpload(false);
                  resetForm();
                }}
                disabled={uploadMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={() => void handleUpload()}
                disabled={uploadMutation.isPending || !pendingFile}
                className="gap-2"
              >
                {uploadMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                Upload for AI Analysis
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
