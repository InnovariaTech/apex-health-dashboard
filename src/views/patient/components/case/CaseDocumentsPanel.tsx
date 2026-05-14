import { FileText, Image as ImageIcon, Paperclip } from "lucide-react";
import type { CaseDetailsItem } from "@/types/care-validate/case_types";
import type { PatientDocumentItem } from "@/types/care-validate/document_types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  formatDocumentDate,
  normalizeCaseDocuments,
  normalizeUserDocuments,
  type NormalizedDocumentItem,
} from "@/views/patient/utils/caseDocumentsUtils";

interface CaseDocumentsPanelProps {
  caseDetails: CaseDetailsItem;
  userDocuments: PatientDocumentItem[];
  isUserDocumentsLoading: boolean;
}

function getDocumentIcon(extension: string) {
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(extension)) {
    return <ImageIcon className="w-4 h-4 text-primary" />;
  }

  if (extension === "pdf") {
    return <FileText className="w-4 h-4 text-primary" />;
  }

  return <Paperclip className="w-4 h-4 text-primary" />;
}

function DocumentRow({ document }: { document: NormalizedDocumentItem }) {
  const content = (
    <div className="flex items-start gap-3 p-3 rounded-[10px] border border-border bg-surface-2 hover:border-[var(--line-2)] transition-colors">
      <div className="mt-0.5 w-8 h-8 rounded-md bg-card border border-border flex items-center justify-center shrink-0">
        {getDocumentIcon(document.extension)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-foreground truncate">
          {document.fileName}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="text-[12px] text-muted-foreground">
            {document.uploadedBy}
          </span>
          <span className="text-[12px] font-mono text-muted-foreground">
            {formatDocumentDate(document.createdAt)}
          </span>
          {document.category && (
            <Badge variant="secondary">{document.category}</Badge>
          )}
          {document.isPHI && <Badge variant="warning">PHI</Badge>}
          {document.isRestricted && <Badge variant="danger">Restricted</Badge>}
        </div>
      </div>
    </div>
  );

  if (!document.url) return content;

  return (
    <a href={document.url} target="_blank" rel="noopener noreferrer" className="block">
      {content}
    </a>
  );
}

function DocumentSection({
  title,
  documents,
}: {
  title: string;
  documents: NormalizedDocumentItem[];
}) {
  const pageSize = 10;
  const visible = documents.slice(0, pageSize);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {documents.length === 0 ? (
          <div className="py-10 text-center border border-dashed border-border rounded-[10px]">
            <p className="text-[13px] text-muted-foreground">No documents.</p>
          </div>
        ) : (
          <>
            {visible.map((document) => (
              <DocumentRow key={document.id} document={document} />
            ))}
            <p className="text-[11px] font-mono text-muted-foreground">
              1-{Math.min(pageSize, documents.length)} of {documents.length}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function CaseDocumentsPanel({
  caseDetails,
  userDocuments,
  isUserDocumentsLoading,
}: CaseDocumentsPanelProps) {
  const caseDocuments = normalizeCaseDocuments(caseDetails);
  const normalizedUserDocuments = normalizeUserDocuments(userDocuments);

  return (
    <div className="space-y-4">
      <DocumentSection title="Case Documents" documents={caseDocuments} />
      {/* {isUserDocumentsLoading ? (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Loading user documents...</p>
          </CardContent>
        </Card>
      ) : (
        <DocumentSection title="User Documents" documents={normalizedUserDocuments} />
      )} */}
    </div>
  );
}
