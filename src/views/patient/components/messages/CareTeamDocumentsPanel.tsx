import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { format } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, FileText, FolderOpen, Loader2, UploadCloud } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listChartDocuments, openChartDocument } from "@/api/healthie/documents";
import { uploadDocument } from "@/api/documents/patientDocuments";
import { useAuth } from "@/lib/AuthContext";
import { DOCUMENT_CATEGORY_META, type DocumentCategory } from "@/types/documents/document_types";

/**
 * Documents shared with the care team: everything on the patient's record (their uploads and the
 * clinic's), and an upload box.
 *
 * Uploads go through `/api/patient/documents` with sharing on, which stores the file at once and
 * copies it to the care-team record a few seconds later. So a new file shows as "Processing…"
 * until the record lists it.
 */

const ACCEPTED = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 10 * 1024 * 1024;
const QUERY_KEY = ["healthie", "chart-documents"] as const;

export default function CareTeamDocumentsPanel() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [category, setCategory] = useState<DocumentCategory>("lab_report");
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState<{ name: string; since: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const docs = useQuery({
    queryKey: QUERY_KEY,
    queryFn: listChartDocuments,
    // While a file is on its way to the record, look for it every few seconds.
    refetchInterval: processing.length > 0 ? 3_000 : 60_000,
    retry: false,
  });

  // Clear "Processing…" rows once the record lists the file, or after a minute.
  useEffect(() => {
    if (processing.length === 0) return;
    const names = new Set((docs.data ?? []).map((d) => d.fileName));
    setProcessing((prev) => prev.filter((p) => !names.has(p.name) && Date.now() - p.since < 60_000));
  }, [docs.data, processing.length]);

  const upload = async (file: File | null | undefined) => {
    if (!file) return;
    setError(null);
    if (!ACCEPTED.includes(file.type)) return setError("Please upload a PDF or an image (JPEG, PNG, WebP or GIF).");
    if (file.size > MAX_BYTES) return setError("That file is over 10 MB. Please upload a smaller one.");
    setUploading(true);
    try {
      // `cvUpload` is the backend's legacy name for "share with care team": the copy lands on the
      // patient's Healthie record.
      await uploadDocument({ file, category, cvUpload: true });
      setProcessing((prev) => [...prev, { name: file.name, since: Date.now() }]);
      void qc.invalidateQueries({ queryKey: QUERY_KEY });
    } catch (err) {
      const e = err as { details?: { message?: string } };
      setError(e?.details?.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const onPick = (e: ChangeEvent<HTMLInputElement>) => void upload(e.target.files?.[0]);
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    void upload(e.dataTransfer.files?.[0]);
  };

  const list = docs.data ?? [];
  const mine = (uploaderId?: string) => Boolean(uploaderId && user?.id && String(user.id) === uploaderId);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xl">
          <FolderOpen className="w-5 h-5" /> Documents
        </CardTitle>
        <p className="text-[12px] text-muted-foreground">
          <span className="font-mono">{list.length}</span> {list.length === 1 ? "document" : "documents"} · shared with
          your care team
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Upload */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`rounded-[14px] border-2 border-dashed p-5 text-center transition ${
            dragging ? "border-primary bg-primary/5" : "border-border bg-surface-2"
          }`}
        >
          <UploadCloud className="mx-auto w-7 h-7 text-muted-foreground" />
          <p className="mt-2 text-[13px] text-foreground">Drag a file here, or choose one to upload</p>
          <p className="text-[11.5px] text-muted-foreground">PDF, JPEG, PNG, WebP or GIF · up to 10 MB</p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as DocumentCategory)}
              className="h-9 rounded-md border border-input bg-background px-2 text-[13px]"
              aria-label="Document type"
            >
              {DOCUMENT_CATEGORY_META.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <Button type="button" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
              {uploading ? "Uploading…" : "Choose file"}
            </Button>
            <input ref={inputRef} type="file" accept={ACCEPTED.join(",")} className="hidden" onChange={onPick} />
          </div>
          {error && <p className="mt-2 text-[12.5px] text-red-600">{error}</p>}
        </div>

        {/* List */}
        {docs.isLoading ? (
          <div className="flex justify-center py-6 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : docs.isError ? (
          <p className="py-4 text-center text-[13px] text-muted-foreground">
            Documents couldn&apos;t be loaded right now. Please try again shortly.
          </p>
        ) : list.length === 0 && processing.length === 0 ? (
          <p className="py-4 text-center text-[13px] text-muted-foreground">No documents yet.</p>
        ) : (
          <ul className="divide-y divide-border rounded-[14px] border border-border">
            {processing.map((p) => (
              <li key={`p-${p.name}-${p.since}`} className="flex items-center gap-3 px-4 py-3 opacity-70">
                <Loader2 className="w-5 h-5 shrink-0 animate-spin text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium text-foreground">{p.name}</p>
                  <p className="text-[12px] text-muted-foreground">Processing… it will appear in a few seconds</p>
                </div>
              </li>
            ))}
            {list.map((d) => {
              const own = mine(d.uploadedBy?.id);
              const who = own
                ? "You"
                : [d.uploadedBy?.firstName, d.uploadedBy?.lastName].filter(Boolean).join(" ") || "Care team";
              return (
                <li key={d.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border bg-secondary">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium text-foreground">{d.fileName}</p>
                    <p className="text-[12px] text-muted-foreground">
                      {who}
                      {!own && <span style={{ color: "var(--opt)" }}> (Care team)</span>}
                      {d.createdAt && !Number.isNaN(new Date(d.createdAt).getTime())
                        ? ` · ${format(new Date(d.createdAt), "MMM d, yyyy")}`
                        : ""}
                    </p>
                  </div>
                  <Button type="button" size="sm" variant="outline" className="h-8" onClick={() => void openChartDocument(d.id)}>
                    <Eye className="w-3.5 h-3.5" /> View
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
