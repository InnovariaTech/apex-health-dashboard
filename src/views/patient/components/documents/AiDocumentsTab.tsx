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
import { useLatestCaseId } from "@/hooks/care-validate/useCases";
import { fileToBase64, isAllowedUploadMimeType } from "@/api/care-validate/files";
import {
  ALLOWED_UPLOAD_MIME_TYPES,
  type PatientDocumentItem,
} from "@/types/care-validate/document_types";
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
  const uploadFileMutation = useUploadFile();
  const deleteFileMutation = useDeleteFile();
  const fileDownloadMutation = useFileDownloadUrl();
  const analyzeMutation = useAnalyzeDocument();

  useEffect(() => {
    api.auth
      .me()
      .then(setCurrentUser)
      .catch(() => setCurrentUser(null));
  }, []);

  const documents = apiDocuments.map(mapApiDocumentToPageDocument);
  const filtered = documents;
  const isUploading = uploadFileMutation.isPending;
  const latestCaseId = latestCaseQuery.data;
  const canUpload = Boolean(latestCaseId);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    // Clear the input so the same file can be re-selected after a failure.
    e.target.value = "";
    if (!file) return;

    if (!latestCaseId) {
      toast({
        title: "No active case",
        description:
          "Uploads attach to your most recent case. Once you have an open case, try again.",
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
        caseId: latestCaseId,
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
    <div>
      {/* Tab-local actions */}
      <div className="mb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Labs, scans, reports — AI-analyzed for insights. Uploads attach to your active case.
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

      {!canUpload && !latestCaseQuery.isLoading && (
        <div
          className="apex-card mb-6 p-4 text-sm"
          style={{
            borderColor: "var(--bord)",
            background: "var(--bord-soft)",
            color: "var(--bord)",
          }}
        >
          Uploads need an active case. Open or continue a case before adding new
          documents.
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
                className={`w-full border border-dashed border-border rounded-[14px] p-6 text-center transition-all bg-surface-2 ${
                  isUploading
                    ? "opacity-60"
                    : canUpload
                    ? "hover:border-[var(--line-2)]"
                    : "opacity-50"
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
                      {canUpload
                        ? "Click to select file"
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
    </div>
  );
}
