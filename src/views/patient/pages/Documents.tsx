// @ts-nocheck
import React, { useState, useEffect } from "react";
import { api } from "@/api/client";
import { useDocuments } from "@/hooks/care-validate/useDocuments";
import type { PatientDocumentItem } from "@/types/care-validate/document_types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Upload, FolderOpen, FileText, Sparkles, Trash2,
  FlaskConical, Activity, Dumbbell, Pill, Stethoscope, File
} from "lucide-react";
import { format } from "date-fns";

const DOC_TYPES = [
  { value: "lab_results", label: "Lab Results", icon: FlaskConical, color: "text-blue-500" },
  { value: "dxa_scan", label: "DXA Scan", icon: Activity, color: "text-purple-500" },
  { value: "inbody_report", label: "InBody Report", icon: Dumbbell, color: "text-green-500" },
  { value: "imaging", label: "Imaging", icon: Activity, color: "text-orange-500" },
  { value: "prescription", label: "Prescription", icon: Pill, color: "text-red-500" },
  { value: "consultation_notes", label: "Consultation Notes", icon: Stethoscope, color: "text-teal-500" },
  { value: "other", label: "Other", icon: File, color: "text-muted-foreground" },
];

function getDocMeta(type) {
  return DOC_TYPES.find((d) => d.value === type) || DOC_TYPES[DOC_TYPES.length - 1];
}

function mapApiDocumentToPageDocument(doc: PatientDocumentItem) {
  const uploader = doc.raw?.raw?.uploadedBy || {};
  const uploaderName = [uploader.firstName, uploader.lastName].filter(Boolean).join(" ").trim();
  return {
    id: doc.id,
    file_name: doc.fileName || doc.raw?.fileName || doc.raw?.raw?.fileName || "Untitled Document",
    file_url: doc.raw?.raw?.url || doc.raw?.url || "",
    document_type: doc.raw?.type || "other",
    document_date: doc.raw?.raw?.createdAt || doc.createdAt || "",
    provider: uploaderName,
    notes: String(doc.raw?.notes || ""),
    ai_summary: String(doc.raw?.ai_summary || ""),
  };
}

export default function Documents() {
  const [currentUser, setCurrentUser] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(null); // doc id being analyzed
  const [showUpload, setShowUpload] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [uploadForm, setUploadForm] = useState({
    document_type: "lab_results",
    document_date: format(new Date(), "yyyy-MM-dd"),
    provider: "",
    notes: "",
  });
  const [filterType, setFilterType] = useState("all");
  const { data: apiDocuments = [], isLoading, isError } = useDocuments();

  useEffect(() => {
    api.auth.me().then(setCurrentUser).catch(() => setCurrentUser(null));
  }, []);

  useEffect(() => {
    setDocuments(apiDocuments.map(mapApiDocumentToPageDocument));
  }, [apiDocuments]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !currentUser) return;
    setIsUploading(true);
    const { file_url } = await api.integrations.Core.UploadFile({ file });
    const doc = await api.entities.PatientDocument.create({
      user_id: currentUser.email,
      file_name: file.name,
      file_url,
      document_type: uploadForm.document_type,
      document_date: uploadForm.document_date,
      provider: uploadForm.provider,
      notes: uploadForm.notes,
      is_encrypted: true,
    });
    setDocuments((prev) => [doc, ...prev]);
    setIsUploading(false);
    setShowUpload(false);
    setUploadForm({ document_type: "lab_results", document_date: format(new Date(), "yyyy-MM-dd"), provider: "", notes: "" });
  };

  const handleAnalyze = async (doc) => {
    setIsAnalyzing(doc.id);
    const prompt = `You are an expert medical AI assistant at Apex MD. A patient has uploaded a medical document (${doc.document_type.replace(/_/g, " ")}) titled "${doc.file_name}"${doc.provider ? ` from ${doc.provider}` : ""}${doc.document_date ? ` dated ${doc.document_date}` : ""}.

Please analyze this document and provide:
1. A clear summary of what the document contains and key findings
2. Any values or metrics that are outside optimal ranges (flag these clearly)
3. Clinical interpretation — what does this mean for the patient's health?
4. Specific actionable recommendations (supplements, peptides, lifestyle changes, medical follow-ups)
5. Any urgent concerns the patient should discuss with their Apex MD physician

Important: Be specific and reference actual values when visible. Always recommend confirming with their physician.`;

    const summary = await api.integrations.Core.InvokeLLM({
      prompt,
      file_urls: [doc.file_url],
    });

    await api.entities.PatientDocument.update(doc.id, { ai_summary: summary });
    setDocuments((prev) => prev.map((d) => d.id === doc.id ? { ...d, ai_summary: summary } : d));
    setIsAnalyzing(null);
    setSelectedDoc((prev) => prev?.id === doc.id ? { ...prev, ai_summary: summary } : prev);
  };

  const handleDelete = async (docId) => {
    await api.entities.PatientDocument.delete(docId);
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    if (selectedDoc?.id === docId) setSelectedDoc(null);
  };

  const filtered = filterType === "all" ? documents : documents.filter((d) => d.document_type === filterType);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto bg-background min-h-screen">
      {/* Header */}
      <div className="mb-8 pb-6 border-b-2 border-border">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-sm flex items-center justify-center">
              <FolderOpen className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">MY DOCUMENTS</h1>
              <p className="text-muted-foreground font-semibold">Labs, scans, reports — AI-analyzed for insights</p>
            </div>
          </div>
          <Button
            onClick={() => setShowUpload(true)}
            className="bg-primary hover:bg-primary/80 text-primary-foreground font-bold"
          >
            <Upload className="w-5 h-5 mr-2" />
            UPLOAD DOCUMENT
          </Button>
        </div>
      </div>

      {/* AI tip banner */}
      <Card className="mb-6 border-2 border-primary/40 bg-primary/5">
        <CardContent className="p-4 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-foreground">
            Upload your labs, DXA scans, or InBody reports and tap <strong>Analyze with AI</strong> to get personalized insights, flag abnormal values, and receive targeted recommendations from your Apex MD AI assistant.
          </p>
        </CardContent>
      </Card>

      {isError && (
        <Card className="mb-6 border-2 border-destructive/30 bg-destructive/5">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-foreground">
              Unable to load documents right now. Please refresh and try again.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        <Button
          size="sm"
          variant={filterType === "all" ? "default" : "outline"}
          onClick={() => setFilterType("all")}
          className={`font-bold ${filterType === "all" ? "bg-primary text-primary-foreground" : "border-border"}`}
        >
          All ({documents.length})
        </Button>
        {DOC_TYPES.map((dt) => {
          const count = documents.filter((d) => d.document_type === dt.value).length;
          if (count === 0) return null;
          return (
            <Button
              key={dt.value}
              size="sm"
              variant={filterType === dt.value ? "default" : "outline"}
              onClick={() => setFilterType(dt.value)}
              className={`font-bold ${filterType === dt.value ? "bg-primary text-primary-foreground" : "border-border"}`}
            >
              {dt.label} ({count})
            </Button>
          );
        })}
      </div>

      {/* Document grid */}
      {filtered.length === 0 ? (
        <Card className="border-2 border-border border-dashed">
          <CardContent className="py-16 text-center">
            <FolderOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">No documents yet</h3>
            <p className="text-muted-foreground mb-4">Upload your lab results, scans, and reports to get started</p>
            <Button onClick={() => setShowUpload(true)} className="bg-primary text-primary-foreground font-bold">
              <Upload className="w-4 h-4 mr-2" /> Upload First Document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((doc) => {
            const meta = getDocMeta(doc.document_type);
            const Icon = meta.icon;
            return (
              <Card
                key={doc.id}
                className="border-2 border-border hover:border-primary transition-all cursor-pointer"
                onClick={() => setSelectedDoc(doc)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Icon className={`w-5 h-5 ${meta.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-bold text-foreground text-sm truncate">{doc.file_name}</h3>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                          className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge variant="outline" className="text-xs border-border">{meta.label}</Badge>
                        {doc.document_date && (
                          <Badge variant="outline" className="text-xs border-border">{doc.document_date}</Badge>
                        )}
                        {doc.provider && (
                          <Badge variant="outline" className="text-xs border-border">{doc.provider}</Badge>
                        )}
                      </div>
                      {doc.ai_summary ? (
                        <p className="text-xs text-muted-foreground line-clamp-2">{doc.ai_summary.slice(0, 120)}…</p>
                      ) : (
                        <Button
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleAnalyze(doc); }}
                          disabled={isAnalyzing === doc.id}
                          className="bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground font-bold text-xs h-7 mt-1"
                        >
                          {isAnalyzing === doc.id ? (
                            <><div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1" /> Analyzing…</>
                          ) : (
                            <><Sparkles className="w-3 h-3 mr-1" /> Analyze with AI</>
                          )}
                        </Button>
                      )}
                      {/* {doc.file_url && (
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-block mt-2"
                        >
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-border font-bold text-xs h-7"
                          >
                            <FileText className="w-3 h-3 mr-1" /> View File
                          </Button>
                        </a>
                      )} */}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-foreground">UPLOAD DOCUMENT</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold text-foreground uppercase mb-2 block">Document Type</label>
              <Select value={uploadForm.document_type} onValueChange={(v) => setUploadForm({ ...uploadForm, document_type: v })}>
                <SelectTrigger className="border-2 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map((dt) => (
                    <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-bold text-foreground uppercase mb-2 block">Document Date</label>
              <input
                type="date"
                value={uploadForm.document_date}
                onChange={(e) => setUploadForm({ ...uploadForm, document_date: e.target.value })}
                className="w-full border-2 border-border rounded-md px-3 py-2 text-sm bg-background text-foreground"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-foreground uppercase mb-2 block">Provider / Lab Name</label>
              <input
                type="text"
                value={uploadForm.provider}
                onChange={(e) => setUploadForm({ ...uploadForm, provider: e.target.value })}
                placeholder="e.g., LabCorp, Quest, Apex MD"
                className="w-full border-2 border-border rounded-md px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-foreground uppercase mb-2 block">Notes (optional)</label>
              <Textarea
                value={uploadForm.notes}
                onChange={(e) => setUploadForm({ ...uploadForm, notes: e.target.value })}
                placeholder="Any context about this document..."
                className="border-2 border-border"
                rows={2}
              />
            </div>
            <label className="cursor-pointer block">
              <input type="file" accept=".pdf,.png,.jpg,.jpeg,.csv,.xlsx" onChange={handleFileUpload} className="hidden" />
              <div className={`w-full border-2 border-dashed border-primary rounded-lg p-6 text-center transition-all ${isUploading ? "opacity-60" : "hover:bg-primary/5"}`}>
                {isUploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    <p className="text-sm font-semibold text-foreground">Uploading…</p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-primary mx-auto mb-2" />
                    <p className="font-bold text-foreground">Click to select file</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, PNG, JPG, CSV, XLSX</p>
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
          {selectedDoc && (() => {
            const meta = getDocMeta(selectedDoc.document_type);
            const Icon = meta.icon;
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <Icon className={`w-5 h-5 ${meta.color}`} />
                    </div>
                    <div>
                      <DialogTitle className="text-xl font-bold text-foreground">{selectedDoc.file_name}</DialogTitle>
                      <p className="text-sm text-muted-foreground">{meta.label}{selectedDoc.provider ? ` · ${selectedDoc.provider}` : ""}{selectedDoc.document_date ? ` · ${selectedDoc.document_date}` : ""}</p>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-4 mt-2">
                  {selectedDoc.notes && (
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Notes</p>
                      <p className="text-sm text-foreground">{selectedDoc.notes}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <a href={selectedDoc.file_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="border-2 border-border font-bold">
                        <FileText className="w-4 h-4 mr-2" /> View File
                      </Button>
                    </a>
                    {!selectedDoc.ai_summary && (
                      <Button
                        size="sm"
                        onClick={() => handleAnalyze(selectedDoc)}
                        disabled={isAnalyzing === selectedDoc.id}
                        className="bg-primary text-primary-foreground font-bold"
                      >
                        {isAnalyzing === selectedDoc.id ? (
                          <><div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-2" /> Analyzing…</>
                        ) : (
                          <><Sparkles className="w-4 h-4 mr-2" /> Analyze with AI</>
                        )}
                      </Button>
                    )}
                    {selectedDoc.ai_summary && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAnalyze(selectedDoc)}
                        disabled={isAnalyzing === selectedDoc.id}
                        className="border-2 border-border font-bold"
                      >
                        <Sparkles className="w-4 h-4 mr-2" /> Re-analyze
                      </Button>
                    )}
                  </div>

                  {isAnalyzing === selectedDoc.id && (
                    <Card className="border-2 border-primary/30 bg-primary/5">
                      <CardContent className="p-4 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
                        <p className="text-sm font-semibold text-foreground">AI is reading your document…</p>
                        <p className="text-xs text-muted-foreground mt-1">This may take 15–30 seconds</p>
                      </CardContent>
                    </Card>
                  )}

                  {selectedDoc.ai_summary && (
                    <Card className="border-2 border-primary/30 bg-primary/5">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-primary" /> AI Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{selectedDoc.ai_summary}</p>
                      </CardContent>
                    </Card>
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