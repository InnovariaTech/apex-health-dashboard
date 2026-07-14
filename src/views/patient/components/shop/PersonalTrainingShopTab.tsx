// @ts-nocheck
import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ProductDetailDialog, {
  type DetailItem,
} from "@/views/patient/components/shop/ProductDetailDialog";
import type { PersonalTrainingPackage } from "@/types/shop/catalog_types";

export default function PersonalTrainingShopTab({
  packages,
}: {
  packages: PersonalTrainingPackage[];
}) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<DetailItem | null>(null);

  const openDetail = (p: PersonalTrainingPackage) => {
    setDetail({
      title: p.name,
      subtitle: `${p.sessions} one-on-one sessions`,
      priceLabel: `$${p.price.toFixed(2)} total · $${p.pricePerSession.toFixed(2)}/session`,
      badge: p.popular ? "Most Popular" : undefined,
      description:
        "Bundled personal-training sessions with a certified Apex MD coach. Pricing is per-package — sessions don't expire.",
      details: [
        { label: "Sessions", value: String(p.sessions) },
        { label: "Per session", value: `$${p.pricePerSession.toFixed(2)}` },
      ],
      features: p.features,
    });
    setOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {packages.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => openDetail(p)}
            className={`apex-card text-left flex flex-col p-5 transition-all duration-150 hover:-translate-y-px focus:outline-none focus-visible:ring-1 focus-visible:ring-ring ${p.popular ? "border-2 border-[var(--apex-accent)]" : ""}`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="font-serif text-lg font-semibold text-foreground">
                {p.name}
              </p>
              {p.popular ? (
                <Badge
                  variant="outline"
                  className="text-[10px] text-white border-transparent bg-[var(--apex-accent)]"
                >
                  <Sparkles className="w-3 h-3" />
                  Most Popular
                </Badge>
              ) : null}
            </div>

            <p className="text-[12.5px] text-muted-foreground">
              {p.sessions} sessions
            </p>

            <div className="mt-3">
              <p className="text-2xl font-semibold text-foreground">
                ${p.price}
              </p>
              <p className="text-[11.5px] text-muted-foreground">
                ${p.pricePerSession.toFixed(2)} per session
              </p>
            </div>

            <ul className="mt-4 space-y-1.5 flex-1">
              {p.features.map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-2 text-[13px] text-foreground"
                >
                  <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <p className="mt-4 text-[12px] text-ink-3">View details →</p>
          </button>
        ))}
      </div>

      <ProductDetailDialog open={open} onOpenChange={setOpen} item={detail} />
    </>
  );
}
