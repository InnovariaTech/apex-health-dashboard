import type { CaseDetailsItem } from "@/types/care-validate/case_types";

export type ChatAuthorRole =
  | "PATIENT"
  | "PROVIDER"
  | "CARE_TEAM"
  | "SUPPORT"
  | "SYSTEM";

export interface ChatAttachmentItem {
  id: string;
  fileName: string;
  url: string;
  isPHI: boolean;
  isRestricted: boolean;
  createdAt: string;
  uploadedBy: string;
}

export interface ChatMessageItem {
  id: string;
  text: string;
  createdAt: string;
  authorName: string;
  authorRole: ChatAuthorRole;
  authorRoleLabel: string;
  isRestricted: boolean;
  attachments: ChatAttachmentItem[];
}

export interface AttachmentMeta {
  extension: string;
  icon: string;
  isPreviewable: boolean;
  isImage: boolean;
  isPdf: boolean;
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function cleanString(value: unknown): string {
  return String(value ?? "").trim();
}

function formatPersonName(person: unknown): string {
  const row = toRecord(person);
  const firstName = cleanString(row.firstName);
  const lastName = cleanString(row.lastName);
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  return fullName || "Unknown";
}

function getAssigneeIds(caseDetails: CaseDetailsItem): Set<string> {
  const assignees = Array.isArray(caseDetails.raw?.assignees) ? caseDetails.raw.assignees : [];
  const ids = new Set<string>();

  assignees.forEach((entry) => {
    const row = toRecord(entry);
    const assignee = toRecord(row.assignee ?? row);
    const id = cleanString(assignee.id);
    if (id) ids.add(id);
  });

  return ids;
}

function deriveAuthorRole(
  comment: Record<string, unknown>,
  caseDetails: CaseDetailsItem
): { role: ChatAuthorRole; label: string } {
  const author = toRecord(comment.author);
  const authorId = cleanString(author.id);
  if (!authorId) return { role: "SYSTEM", label: "System" };

  const submitterId = cleanString(caseDetails.raw?.submitter?.id);
  if (submitterId && authorId === submitterId) {
    return { role: "PATIENT", label: "You" };
  }

  const assignedTo = toRecord(caseDetails.raw?.assignedTo);
  const hrRep = toRecord(caseDetails.raw?.hrRep);
  const providerIds = new Set([cleanString(assignedTo.id), cleanString(hrRep.id)].filter(Boolean));
  if (providerIds.has(authorId)) {
    return { role: "PROVIDER", label: "Doctor" };
  }

  const assigneeIds = getAssigneeIds(caseDetails);
  if (assigneeIds.has(authorId)) {
    return { role: "CARE_TEAM", label: "Support" };
  }

  return { role: "SUPPORT", label: "Support" };
}

function normalizeAttachment(raw: unknown): ChatAttachmentItem | null {
  const row = toRecord(raw);
  if (Boolean(row.isDeleted)) return null;

  const id = cleanString(row.id);
  const fileName = cleanString(row.fileName ?? row.name);
  const url = cleanString(row.url ?? row.fileUrl);
  if (!id || !fileName) return null;

  return {
    id,
    fileName,
    url,
    isPHI: Boolean(row.isPHI),
    isRestricted: Boolean(row.isRestricted),
    createdAt: cleanString(row.createdAt),
    uploadedBy: formatPersonName(row.uploadedBy),
  };
}

function normalizeComment(comment: unknown, caseDetails: CaseDetailsItem): ChatMessageItem | null {
  const row = toRecord(comment);
  const id = cleanString(row.id);
  if (!id) return null;

  const author = toRecord(row.author);
  const { role, label } = deriveAuthorRole(row, caseDetails);
  const attachments = Array.isArray(row.attachments) ? row.attachments : [];

  return {
    id,
    text: cleanString(row.text),
    createdAt: cleanString(row.createdAt),
    authorName: formatPersonName(author),
    authorRole: role,
    authorRoleLabel: label,
    isRestricted: Boolean(row.isRestricted),
    attachments: attachments
      .map(normalizeAttachment)
      .filter((att): att is ChatAttachmentItem => att !== null),
  };
}

export function extractChatMessages(
  caseDetails: CaseDetailsItem,
  options: { includeRestricted?: boolean } = {}
): ChatMessageItem[] {
  const includeRestricted = options.includeRestricted ?? false;
  const comments = Array.isArray(caseDetails.raw?.comments) ? caseDetails.raw.comments : [];

  return comments
    .map((comment) => normalizeComment(comment, caseDetails))
    .filter((message): message is ChatMessageItem => message !== null)
    .filter((message) => (includeRestricted ? true : !message.isRestricted))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function getAttachmentMeta(fileName: string): AttachmentMeta {
  const extension = cleanString(fileName.split(".").pop()).toLowerCase();
  const imageTypes = ["png", "jpg", "jpeg", "gif", "webp", "svg"];
  const previewable = ["pdf", ...imageTypes];

  const iconMap: Record<string, string> = {
    pdf: "PDF",
    png: "IMG",
    jpg: "IMG",
    jpeg: "IMG",
    gif: "IMG",
    webp: "IMG",
    svg: "IMG",
    doc: "DOC",
    docx: "DOC",
    xls: "XLS",
    xlsx: "XLS",
    zip: "ZIP",
  };

  return {
    extension,
    icon: iconMap[extension] || "FILE",
    isPreviewable: previewable.includes(extension),
    isImage: imageTypes.includes(extension),
    isPdf: extension === "pdf",
  };
}

export function formatChatTime(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate || "";

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

