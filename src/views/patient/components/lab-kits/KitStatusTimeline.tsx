// @ts-nocheck
import { useMemo } from "react";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  Hourglass,
  Package,
  PackageCheck,
  TestTube,
  Truck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type {
  TassoOrderEvent,
  TassoOrderStatus,
} from "@/types/tasso/patient_types";

/**
 * Groups a flat list of order events by `orderId` and renders one card
 * per order. Each card shows the latest status as the headline + a
 * chronological history below. Latest-event-per-order drives the badge
 * color.
 *
 * Event grouping happens here (UI concern), not in the API client, so
 * future filter UIs (e.g. show only kits in transit) can read the raw
 * events without reshuffling.
 */
export default function KitStatusTimeline({
  events,
}: {
  events: TassoOrderEvent[];
}) {
  const grouped = useMemo(() => groupByOrder(events), [events]);

  if (grouped.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center space-y-2">
          <Package className="w-10 h-10 mx-auto text-muted-foreground/40" />
          <p className="font-medium text-foreground">No kits yet</p>
          <p className="text-sm text-muted-foreground">
            When your provider orders an at-home test, you'll see its
            shipping and lab status updates here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {grouped.map((group) => (
        <KitOrderCard key={group.orderId} group={group} />
      ))}
    </div>
  );
}

function KitOrderCard({ group }: { group: OrderGroup }) {
  const latest = group.events[0];
  const meta = STATUS_META[latest.eventContext.status] ?? STATUS_META.default;
  const Icon = meta.icon;
  return (
    <Card className="border-2 border-border">
      <CardContent className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--apex-accent-soft)" }}
          >
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="font-semibold text-foreground">{meta.label}</p>
              <Badge variant="outline" className={meta.badgeClass}>
                {humanizeStatus(latest.eventContext.status)}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Order ID{" "}
              <span className="font-mono">
                {group.orderId.slice(0, 8)}…
              </span>{" "}
              · Updated {relativeTime(latest.eventContext.statusChangedAt)}
            </p>
          </div>
        </div>

        {/* Per-order history */}
        <ol className="space-y-3 ml-1 border-l border-border pl-4">
          {group.events.map((e, idx) => {
            const stepMeta =
              STATUS_META[e.eventContext.status] ?? STATUS_META.default;
            const StepIcon = stepMeta.dotIcon ?? stepMeta.icon;
            const isLatest = idx === 0;
            return (
              <li
                key={`${e.orderId}-${e.eventContext.statusChangedAt}`}
                className="relative"
              >
                <span
                  className={`absolute -left-[22px] top-0.5 w-3 h-3 rounded-full ${
                    isLatest
                      ? "bg-primary border-2 border-primary"
                      : "bg-background border-2 border-muted-foreground/40"
                  }`}
                />
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <p
                    className={`text-sm ${isLatest ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                  >
                    <StepIcon
                      className={`w-3 h-3 inline-block mr-1.5 ${isLatest ? "text-primary" : ""}`}
                    />
                    {humanizeStatus(e.eventContext.status)}
                  </p>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {safeFormat(e.eventContext.statusChangedAt, "MMM d, h:mm a")}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}

// ─── Status metadata + helpers ────────────────────────────────────────────

interface StatusMeta {
  label: string;
  icon: typeof Package;
  dotIcon?: typeof Package;
  badgeClass: string;
}

const STATUS_META: Record<string, StatusMeta> = {
  accepted: {
    label: "Order accepted",
    icon: Package,
    badgeClass: "text-muted-foreground",
  },
  pendingFulfillment: {
    label: "Preparing your kit",
    icon: Hourglass,
    badgeClass: "text-muted-foreground",
  },
  inTransitToPatient: {
    label: "Kit on the way",
    icon: Truck,
    badgeClass: "border-amber-500 text-amber-600",
  },
  atPatient: {
    label: "Kit delivered",
    icon: PackageCheck,
    badgeClass: "border-primary text-primary",
  },
  inTransitToLab: {
    label: "Sample on the way to lab",
    icon: Truck,
    badgeClass: "border-amber-500 text-amber-600",
  },
  atLab: {
    label: "Sample at the lab",
    icon: TestTube,
    badgeClass: "border-amber-500 text-amber-600",
  },
  resultsReady: {
    label: "Results ready",
    icon: CheckCircle2,
    badgeClass: "border-emerald-500 text-emerald-600",
  },
  delayed: {
    label: "Delayed",
    icon: AlertCircle,
    badgeClass: "border-destructive text-destructive",
  },
  problem: {
    label: "Problem reported",
    icon: AlertCircle,
    badgeClass: "border-destructive text-destructive",
  },
  cancelled: {
    label: "Cancelled",
    icon: AlertCircle,
    badgeClass: "text-muted-foreground line-through",
  },
  returned: {
    label: "Returned",
    icon: AlertCircle,
    badgeClass: "text-muted-foreground",
  },
  rejected: {
    label: "Rejected",
    icon: AlertCircle,
    badgeClass: "border-destructive text-destructive",
  },
  failed: {
    label: "Failed",
    icon: AlertCircle,
    badgeClass: "border-destructive text-destructive",
  },
  default: {
    label: "Status update",
    icon: Circle,
    badgeClass: "text-muted-foreground",
  },
};

interface OrderGroup {
  orderId: string;
  events: TassoOrderEvent[];
}

/** Group by `orderId`, sort each order's events newest-first. */
function groupByOrder(events: TassoOrderEvent[]): OrderGroup[] {
  const map = new Map<string, TassoOrderEvent[]>();
  for (const e of events) {
    if (!map.has(e.orderId)) map.set(e.orderId, []);
    map.get(e.orderId)!.push(e);
  }
  const groups: OrderGroup[] = [];
  for (const [orderId, items] of map) {
    items.sort(
      (a, b) =>
        Date.parse(b.eventContext.statusChangedAt) -
        Date.parse(a.eventContext.statusChangedAt),
    );
    groups.push({ orderId, events: items });
  }
  // Sort orders by their latest event newest-first.
  groups.sort(
    (a, b) =>
      Date.parse(b.events[0]?.eventContext.statusChangedAt ?? "") -
      Date.parse(a.events[0]?.eventContext.statusChangedAt ?? ""),
  );
  return groups;
}

function humanizeStatus(status: TassoOrderStatus): string {
  // Convert camelCase → Title Case With Spaces.
  return String(status)
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function relativeTime(iso: string): string {
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true });
  } catch {
    return iso;
  }
}

function safeFormat(iso: string, pattern: string): string {
  try {
    return format(parseISO(iso), pattern);
  } catch {
    return iso;
  }
}
