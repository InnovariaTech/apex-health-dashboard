import type { VisitStatus } from "@/types/beluga/beluga_types";

/**
 * Presentation metadata for the ten visit statuses. Drive the UI from
 * `Visit.status` (never `resolvedStatus`). See `beluga-api.md`.
 */

type BadgeVariant =
  | "default"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "outline";

interface StatusMeta {
  label: string;
  variant: BadgeVariant;
  /** One-line explanation for the patient. */
  hint: string;
  /** Terminal states — nothing more will happen automatically. */
  terminal?: boolean;
}

const STATUS_META: Record<VisitStatus, StatusMeta> = {
  pending_response: {
    label: "Submitting",
    variant: "secondary",
    hint: "Your visit is being submitted.",
  },
  unknown: {
    label: "Checking",
    variant: "warning",
    hint: "We're confirming your visit was received.",
  },
  rejected: {
    label: "Not accepted",
    variant: "danger",
    hint: "This visit couldn't be created.",
    terminal: true,
  },
  awaiting_photos: {
    label: "Photo needed",
    variant: "warning",
    hint: "Upload a photo of your ID to finish submitting.",
  },
  pending: {
    label: "Pending",
    variant: "info",
    hint: "Waiting for a provider to pick up your visit.",
  },
  active: {
    label: "In progress",
    variant: "info",
    hint: "A provider is reviewing your visit.",
  },
  admin: {
    label: "Under review",
    variant: "warning",
    hint: "Your visit is under additional review.",
  },
  holding: {
    label: "On hold",
    variant: "warning",
    hint: "Your visit is temporarily on hold.",
  },
  resolved: {
    label: "Resolved",
    variant: "success",
    hint: "Your visit is complete.",
    terminal: true,
  },
  canceled: {
    label: "Canceled",
    variant: "default",
    hint: "This visit was canceled.",
    terminal: true,
  },
};

export function statusMeta(status: VisitStatus): StatusMeta {
  return (
    STATUS_META[status] ?? {
      label: status,
      variant: "default",
      hint: "",
    }
  );
}

/** The subset a patient would meaningfully filter by, in display order. */
export const FILTERABLE_STATUSES: VisitStatus[] = [
  "awaiting_photos",
  "pending",
  "active",
  "admin",
  "holding",
  "resolved",
  "canceled",
];

export function needsPhoto(status: VisitStatus): boolean {
  return status === "awaiting_photos";
}

/** Cancel is offered while a visit is still open (not terminal / pre-create). */
export function canCancel(status: VisitStatus): boolean {
  return (
    status === "awaiting_photos" ||
    status === "pending" ||
    status === "active" ||
    status === "admin" ||
    status === "holding"
  );
}

/**
 * Prescription resend/update makes sense once a provider is engaged. Beluga may
 * still answer with a non-actionable status (e.g. VISIT_WAS_REFERRED) on
 * resolved visits, which the UI surfaces.
 */
export function canPrescribe(status: VisitStatus): boolean {
  return (
    status === "active" ||
    status === "admin" ||
    status === "holding" ||
    status === "resolved"
  );
}
