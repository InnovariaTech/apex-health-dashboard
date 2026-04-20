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
    return <ImageIcon className="w-5 h-5 text-primary" />;
  }

  if (extension === "pdf") {
    return <FileText className="w-5 h-5 text-primary" />;
  }

  return <Paperclip className="w-5 h-5 text-primary" />;
}

function DocumentRow({ document }: { document: NormalizedDocumentItem }) {
  const content = (
    <div className="flex items-start gap-3 p-3 rounded-md border border-border hover:bg-muted/40 transition-colors">
      <div className="mt-0.5">{getDocumentIcon(document.extension)}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground truncate">{document.fileName}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">{document.uploadedBy}</span>
          <span className="text-xs text-muted-foreground">{formatDocumentDate(document.createdAt)}</span>
          {document.category && (
            <Badge variant="secondary" className="text-[10px] font-semibold">
              {document.category}
            </Badge>
          )}
          {document.isPHI && (
            <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700">
              PHI
            </Badge>
          )}
          {document.isRestricted && (
            <Badge variant="outline" className="text-[10px] border-destructive/40 text-destructive">
              Restricted
            </Badge>
          )}
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
    <Card className="border-2 border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No documents.</p>
        ) : (
          <>
            {visible.map((document) => (
              <DocumentRow key={document.id} document={document} />
            ))}
            <p className="text-xs text-muted-foreground">
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
        <Card className="border-2 border-border">
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

