// @ts-nocheck
import { Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * Shared detail modal for non-medical shop items (supplements, memberships,
 * programs, PT packages). The catalog is static — there's no checkout
 * wired up — so the primary CTA is a placeholder "Contact to purchase"
 * that surfaces a `mailto:` link.
 */
interface DetailItem {
  title: string;
  subtitle?: string;
  image?: string;
  priceLabel?: string;
  badge?: string;
  badgeColor?: string;
  description?: string;
  details?: Array<{ label: string; value: string }>;
  features?: string[];
}

export default function ProductDetailDialog({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  item: DetailItem | null;
}) {
  if (!item) return null;
  const subject = encodeURIComponent(`Apex MD purchase inquiry — ${item.title}`);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          {item.image ? (
            <div className="w-full aspect-[16/9] rounded-md overflow-hidden bg-secondary mb-3 flex items-center justify-center p-4">
              <img
                src={item.image}
                alt={item.title}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ) : null}
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            {item.title}
            {item.badge ? (
              <Badge
                variant="outline"
                className={`text-[10px] ${item.badgeColor ? "text-white border-transparent " + item.badgeColor : ""}`}
              >
                {item.badge}
              </Badge>
            ) : null}
          </DialogTitle>
          {item.subtitle ? (
            <DialogDescription>{item.subtitle}</DialogDescription>
          ) : null}
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {item.priceLabel ? (
            <p className="text-lg font-semibold text-foreground">
              {item.priceLabel}
            </p>
          ) : null}

          {item.description ? (
            <p className="text-muted-foreground">{item.description}</p>
          ) : null}

          {item.details && item.details.length > 0 ? (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
              {item.details.map((d) => (
                <div key={d.label} className="flex flex-col">
                  <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {d.label}
                  </dt>
                  <dd className="text-foreground">{d.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {item.features && item.features.length > 0 ? (
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">
                Includes
              </p>
              <ul className="space-y-1.5">
                {item.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-foreground"
                  >
                    <span
                      aria-hidden
                      className="w-1.5 h-1.5 rounded-full bg-foreground mt-2 flex-shrink-0"
                    />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <a href={`mailto:support@apexmd.com?subject=${subject}`}>
            <Button>
              <Mail className="w-4 h-4" />
              Contact to purchase
            </Button>
          </a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type { DetailItem };
