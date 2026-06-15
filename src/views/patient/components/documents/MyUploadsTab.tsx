// @ts-nocheck
import { useRef, useState } from "react";
import {
  Upload,
  FolderOpen,
  Download,
  Trash2,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useAiChatStore } from "@/stores/aiChatStore";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import {
  usePatientDocuments,
  useUploadPatientDocument,
  useDeletePatientDocument,
  useDownloadPatientDocument,
} from "@/hooks/documents/usePatientDocuments";
import {
  ALLOWED_UPLOAD_ACCEPT,
  DOCUMENT_CATEGORY_META,
  isAllowedUploadMimeType,
  type DocumentCategory,
  type PatientDocument,
} from "@/types/documents/document_types";

/**
 * Self-serve patient documents bucket — `/api/patient/documents/*`.
 * Separate from the care-validate / AI flow in the parent page. No case
 * linkage, no AI; just upload / list / download / delete with 5 categories.
 */

const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20MB client-side guard

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function categoryLabel(cat: string): string {
  return DOCUMENT_CATEGORY_META.find((c) => c.value === cat)?.label ?? cat;
}

function describeError(err: unknown): string {
  if (!err || typeof err !== "object") return "Something went wrong.";
  const e = err as { response?: { data?: { message?: string } }; message?: string };
  return e.response?.data?.message || e.message || "Something went wrong.";
}

function iconFor(mimeType: string) {
  if (mimeType.startsWith("image/")) return ImageIcon;
  return FileText;
}

export default function MyUploadsTab() {
  const { data: documents = [], isLoading, isError } = usePatientDocuments();
  const uploadMutation = useUploadPatientDocument();
  const deleteMutation = useDeletePatientDocument();
  const downloadMutation = useDownloadPatientDocument();
  // Same hook used by the AI Documents tab. The global `AIAssistantBar`
  // watches this store and auto-opens with a streaming response when a
  // prompt lands — no navigation, no analyze endpoint needed.
  const setPendingPrompt = useAiChatStore((s) => s.setPendingPrompt);

  const [showUpload, setShowUpload] = useState(false);
  const [category, setCategory] = useState<DocumentCategory>("lab_report");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const resetForm = () => {
    setPendingFile(null);
    setUploadError("");
    setCategory("lab_report");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError("");
    const file = e.target.files?.[0];
    if (!file) {
      setPendingFile(null);
      return;
    }
    if (!isAllowedUploadMimeType(file.type)) {
      setUploadError(
        `${file.type || "Unknown"} isn't accepted. Allowed: PDF, JPEG, PNG.`,
      );
      setPendingFile(null);
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setUploadError(
        `File is ${formatSize(file.size)} — limit is ${formatSize(MAX_SIZE_BYTES)}.`,
      );
      setPendingFile(null);
      return;
    }
    setPendingFile(file);
  };

  const handleUpload = async () => {
    if (!pendingFile) {
      setUploadError("Choose a file to upload.");
      return;
    }
    try {
      await uploadMutation.mutateAsync({ file: pendingFile, category });
      toast({ title: "Document uploaded", description: pendingFile.name });
      setShowUpload(false);
      resetForm();
    } catch (err) {
      setUploadError(describeError(err));
    }
  };

  const handleDelete = async (doc: PatientDocument) => {
    if (!confirm(`Delete "${doc.originalName}"? This can't be undone.`)) return;
    try {
      await deleteMutation.mutateAsync(doc.id);
      toast({ title: "Document deleted", description: doc.originalName });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Couldn't delete",
        description: describeError(err),
      });
    }
  };

  const handleDownload = async (doc: PatientDocument) => {
    try {
      await downloadMutation.mutateAsync({ id: doc.id, filename: doc.originalName });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Couldn't download",
        description: describeError(err),
      });
    }
  };

  /**
   * Same flow as AI Documents → General: seed the AI store with a hidden
   * prompt that references the document, then let the global `AIAssistantBar`
   * pop open and stream the response. Requires `careValidateFileId` because
   * the AI only has visibility into docs that were also uploaded to
   * CareValidate (i.e. `cv_upload=true`). Local-only docs disable the button.
   */
  const handleAnalyze = (doc: PatientDocument) => {
    const cvId = doc.careValidateFileId;
    if (!cvId) {
      toast({
        variant: "destructive",
        title: "Can't analyze this document",
        description:
          "Only documents linked to CareValidate can be analyzed. Upload from the AI Documents tab to enable analysis.",
      });
      return;
    }
    setPendingPrompt({
      message: `Please analyse my document "${doc.originalName}" (CareValidate file id: ${cvId}).`,
      isHidden: true,
      documentId: cvId,
    });
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
        <div>
          <p className="text-sm text-muted-foreground">
            Upload your own PDFs and images for safekeeping. Categorize them so
            they're easy to find later.
          </p>
        </div>
        <Button onClick={() => setShowUpload(true)} className="gap-2">
          <Upload className="w-4 h-4" /> Upload document
        </Button>
      </div>

      {isError && (
        <div className="mb-4 p-3 rounded-md border border-destructive/30 bg-destructive/5 text-destructive text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>Couldn't load your documents. Refresh to try again.</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-16 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : documents.length === 0 ? (
        <div className="apex-card border-dashed py-16 text-center">
          <FolderOpen className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="font-serif text-lg font-medium mb-1">No uploads yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Upload a PDF or image to get started.
          </p>
          <Button onClick={() => setShowUpload(true)} className="gap-2">
            <Upload className="w-4 h-4" /> Upload first document
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {documents.map((doc) => {
            const Icon = iconFor(doc.mimeType);
            const deleting =
              deleteMutation.isPending && deleteMutation.variables === doc.id;
            const downloading =
              downloadMutation.isPending &&
              (downloadMutation.variables as { id?: string } | undefined)?.id === doc.id;
            return (
              <div key={doc.id} className="apex-card p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-md bg-secondary flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" title={doc.originalName}>
                      {doc.originalName}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      <Badge variant="outline">{categoryLabel(doc.category)}</Badge>
                      <Badge variant="secondary" className="font-mono">
                        {formatSize(doc.size)}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-2">
                      Uploaded {safeFormat(doc.createdAt, "MMM d, yyyy 'at' h:mm a")}
                    </p>
                    <div className="flex gap-2 mt-3 flex-wrap">
                      <Button
                        size="sm"
                        className="gap-1.5 h-8"
                        onClick={() => handleAnalyze(doc)}
                        disabled={!doc.careValidateFileId}
                        title={
                          doc.careValidateFileId
                            ? "Run AI analysis on this document"
                            : "Only available for CareValidate-linked uploads."
                        }
                      >
                        <Sparkles className="w-3 h-3" />
                        Analyze with AI
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 h-8"
                        onClick={() => void handleDownload(doc)}
                        disabled={downloading}
                      >
                        {downloading ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
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
                        disabled={deleting}
                      >
                        {deleting ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
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
            <DialogTitle>Upload document</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="apex-eyebrow mb-1.5 block">Category</label>
              <Select value={category} onValueChange={(v) => setCategory(v as DocumentCategory)}>
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
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_UPLOAD_ACCEPT}
                onChange={handleFileChange}
                className="block w-full text-sm file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-secondary file:text-foreground hover:file:bg-secondary/80"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                PDF, JPEG, or PNG · up to {formatSize(MAX_SIZE_BYTES)}
              </p>
              {pendingFile && (
                <p className="text-xs mt-2 text-foreground font-mono truncate">
                  {pendingFile.name} · {formatSize(pendingFile.size)}
                </p>
              )}
            </div>

            {uploadError && (
              <div className="flex items-start gap-2 p-3 rounded-md border border-destructive/30 bg-destructive/5 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 pt-2">
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
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function safeFormat(value: string, fmt: string): string {
  try {
    return format(parseISO(value), fmt);
  } catch {
    return value;
  }
}
