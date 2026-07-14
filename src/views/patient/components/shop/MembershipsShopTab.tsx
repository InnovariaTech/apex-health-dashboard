// @ts-nocheck
import { useState } from "react";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ProductDetailDialog, {
  type DetailItem,
} from "@/views/patient/components/shop/ProductDetailDialog";
import type { MembershipPlan } from "@/types/shop/catalog_types";

/**
 * Pricing-tier cards for gym memberships. The `headerBg`/`headerText`
 * strings come straight from the JSON (Tailwind classes) so the catalog
 * can re-skin a tier without code changes. `current: true` flags the
 * plan a user is on today — purely static, no actual subscription
 * fetch.
 */
export default function MembershipsShopTab({
  plans,
}: {
  plans: MembershipPlan[];
}) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<DetailItem | null>(null);

  const openDetail = (p: MembershipPlan) => {
    setDetail({
      title: p.name,
      subtitle: p.current ? "Your current plan" : undefined,
      priceLabel: `$${p.price.toFixed(2)} ${p.period}`,
      badge: p.badge,
      description:
        "Static catalog tier — no live subscription state. Contact support to change tiers.",
      features: p.features,
    });
    setOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => openDetail(p)}
            className={`text-left rounded-[14px] border-2 overflow-hidden bg-card transition-all duration-150 hover:-translate-y-px focus:outline-none focus-visible:ring-1 focus-visible:ring-ring ${p.color}`}
          >
            <div
              className={`px-5 py-4 ${p.headerBg} ${p.headerText ?? "text-foreground"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-serif text-lg font-semibold">{p.name}</p>
                {p.badge ? (
                  <Badge variant="outline" className="text-[10px] bg-white/15 text-current border-current/30">
                    {p.badge}
                  </Badge>
                ) : null}
              </div>
              <p className="mt-2 text-2xl font-semibold">
                ${p.price}
                <span className="text-sm font-normal opacity-80 ml-0.5">
                  {p.period}
                </span>
              </p>
            </div>
            <div className="p-5 space-y-2">
              {p.features.map((f) => (
                <div key={f} className="flex items-start gap-2 text-[13px]">
                  <Check className="w-4 h-4 text-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">{f}</span>
                </div>
              ))}
              {p.current ? (
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground pt-2 border-t border-border mt-3">
                  Your current plan
                </p>
              ) : null}
            </div>
          </button>
        ))}
      </div>

      <ProductDetailDialog open={open} onOpenChange={setOpen} item={detail} />
    </>
  );
}
