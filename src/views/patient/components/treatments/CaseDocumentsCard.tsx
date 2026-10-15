import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FileText, Loader2, UploadCloud } from "lucide-react";
import { listChartDocuments, openChartDocument } from "@/api/healthie/documents";
import { uploadDocument } from "@/api/documents/patientDocuments";
import { DOCUMENT_CATEGORY_META, type DocumentCategory } from "@/types/documents/document_types";
import { fmtCaseDate } from "@/views/patient/utils/treatmentCases";

/**
 * Sidebar "Documents" card: the patient's record (one per patient today, shared by every
 * treatment) and a small upload. Uploads are copied to the record a few seconds later, so a new
 * file shows as processing until the record lists it.
 */

const ACCEPTED = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 10 * 1024 * 1024;
const QUERY_KEY = ["healthie", "chart-documents"] as const;

export default function CaseDocumentsCard() {
  const qc = useQueryClient();
  const [category, setCategory] = useState<DocumentCategory>("lab_report");
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState<{ name: string; since: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const docs = useQuery({
    queryKey: QUERY_KEY,
    queryFn: listChartDocuments,
    refetchInterval: processing.length > 0 ? 3_000 : 60_000,
    retry: false,
  });

  useEffect(() => {
    if (processing.length === 0) return;
    const names = new Set((docs.data ?? []).map((d) => d.fileName));
    setProcessing((prev) => prev.filter((p) => !names.has(p.name) && Date.now() - p.since < 60_000));
  }, [docs.data, processing.length]);

  const onPick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    if (!ACCEPTED.includes(file.type)) return setError("PDF or image (JPEG, PNG, WebP, GIF) only.");
    if (file.size > MAX_BYTES) return setError("That file is over 10 MB.");
    setUploading(true);
    try {
      // `cvUpload` is the backend's legacy name for "share with care team".
      await uploadDocument({ file, category, cvUpload: true });
      setProcessing((p) => [...p, { name: file.name, since: Date.now() }]);
      void qc.invalidateQueries({ queryKey: QUERY_KEY });
    } catch (err) {
      const e2 = err as { details?: { message?: string } };
      setError(e2?.details?.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const list = docs.data ?? [];
  return (
    <div className="apex-card p-[22px]">
      <div className="mb-2 flex items-center">
        <span className="apex-eyebrow">Documents</span>
        <span className="ml-auto font-mono text-[11px] text-ink-2">{list.length}</span>
      </div>

      {docs.isLoading ? (
        <div className="flex justify-center py-4 text-ink-2">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      ) : list.length === 0 && processing.length === 0 ? (
        <p className="py-1.5 text-[13px] text-ink-2">No documents yet. Upload one below.</p>
      ) : (
        <ul className="divide-y divide-border">
          {processing.map((p) => (
            <li key={`p-${p.name}-${p.since}`} className="flex items-center gap-3 py-2.5 opacity-70">
              <Loader2 className="w-4 h-4 shrink-0 animate-spin text-ink-2" />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-foreground">{p.name}</p>
                <p className="text-[11.5px] text-ink-2">Processing…</p>
              </div>
            </li>
          ))}
          {list.map((d) => (
            <li key={d.id}>
              <button
                onClick={() => void openChartDocument(d.id)}
                className="flex w-full items-center gap-3 py-2.5 text-left hover:opacity-80"
              >
                <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-md border border-border bg-secondary">
                  <FileText className="w-4 h-4 text-ink-2" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-foreground">{d.fileName}</span>
                  <span className="block text-[11.5px] text-ink-2">{fmtCaseDate(d.createdAt)}</span>
                </span>
                <Download className="w-4 h-4 shrink-0 text-ink-2" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as DocumentCategory)}
          className="h-8 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-[12.5px]"
          aria-label="Document type"
        >
          {DOCUMENT_CATEGORY_META.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-[12.5px] font-medium text-foreground hover:bg-black/[0.04] disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
          Upload
        </button>
        <input ref={inputRef} type="file" accept={ACCEPTED.join(",")} className="hidden" onChange={onPick} />
      </div>
      {error && <p className="mt-1.5 text-[12px] text-red-600">{error}</p>}
    </div>
  );
}
