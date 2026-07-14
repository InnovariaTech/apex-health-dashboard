// @ts-nocheck
import { useState } from "react";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ProductDetailDialog, {
  type DetailItem,
} from "@/views/patient/components/shop/ProductDetailDialog";
import type { SupplementItem } from "@/types/shop/catalog_types";

export default function SupplementsShopTab({
  items,
}: {
  items: SupplementItem[];
}) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<DetailItem | null>(null);

  const openDetail = (s: SupplementItem) => {
    const details: Array<{ label: string; value: string }> = [];
    if (typeof s.rating === "number") {
      const reviewsCopy =
        typeof s.reviews === "number" ? ` (${s.reviews} reviews)` : "";
      details.push({ label: "Rating", value: `${s.rating}${reviewsCopy}` });
    }
    if (s.flavors.length > 0) {
      details.push({ label: "Flavors", value: s.flavors.join(", ") });
    }
    setDetail({
      title: s.name,
      subtitle: s.tagline,
      image: s.image,
      priceLabel: `$${s.price.toFixed(2)} ${s.unit}`,
      badge: s.badge,
      badgeColor: s.badgeColor,
      description: s.description,
      details,
      features: s.benefits,
    });
    setOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
        {items.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => openDetail(s)}
            className="apex-card text-left flex flex-col overflow-hidden transition-all duration-150 hover:-translate-y-px hover:border-[var(--line-2)] focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <div className="w-full aspect-[4/3] bg-secondary overflow-hidden flex items-center justify-center p-3">
              {s.image ? (
                <img
                  src={s.image}
                  alt={s.name}
                  className="max-w-full max-h-full object-contain"
                />
              ) : null}
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-foreground text-[14px] leading-snug">
                    {s.name}
                  </p>
                  <p className="text-[11.5px] text-muted-foreground mt-0.5">
                    {s.tagline}
                  </p>
                </div>
                {s.badge ? (
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${s.badgeColor ? "text-white border-transparent " + s.badgeColor : ""}`}
                  >
                    {s.badge}
                  </Badge>
                ) : null}
              </div>

              {typeof s.rating === "number" ? (
                <div className="flex items-center gap-1.5 mt-2 text-[12px] text-ink-2">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span className="font-medium">{s.rating}</span>
                  {typeof s.reviews === "number" ? (
                    <span className="text-muted-foreground">
                      ({s.reviews.toLocaleString()})
                    </span>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-auto pt-3 flex items-center justify-between">
                <p className="font-semibold text-foreground text-[14px]">
                  ${s.price}
                  <span className="text-[11px] text-muted-foreground font-normal ml-0.5">
                    {s.unit}
                  </span>
                </p>
                <span className="text-[12px] text-ink-3">Details →</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <ProductDetailDialog open={open} onOpenChange={setOpen} item={detail} />
    </>
  );
}
