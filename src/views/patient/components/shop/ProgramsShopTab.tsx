// @ts-nocheck
import { useState } from "react";
import { Calendar, Dumbbell, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ProductDetailDialog, {
  type DetailItem,
} from "@/views/patient/components/shop/ProductDetailDialog";
import type { TrainingProgram } from "@/types/shop/catalog_types";

export default function ProgramsShopTab({
  programs,
}: {
  programs: TrainingProgram[];
}) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<DetailItem | null>(null);

  const openDetail = (p: TrainingProgram) => {
    setDetail({
      title: p.name,
      subtitle: p.tagline,
      image: p.image,
      priceLabel: `$${p.price}`,
      badge: p.badge,
      badgeColor: p.badgeColor,
      description: p.description,
      details: [
        { label: "Duration", value: p.duration },
        { label: "Frequency", value: p.sessions },
        { label: "Level", value: p.level },
        { label: "Coach", value: p.coach },
      ],
      features: p.includes,
    });
    setOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
        {programs.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => openDetail(p)}
            className="apex-card text-left flex flex-col overflow-hidden transition-all duration-150 hover:-translate-y-px hover:border-[var(--line-2)] focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <div className="w-full aspect-[4/3] bg-secondary overflow-hidden flex items-center justify-center p-3">
              {p.image ? (
                <img
                  src={p.image}
                  alt={p.name}
                  className="max-w-full max-h-full object-contain"
                />
              ) : null}
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-foreground text-[14px] leading-snug">
                    {p.name}
                  </p>
                  <p className="text-[11.5px] text-muted-foreground mt-0.5">
                    {p.tagline}
                  </p>
                </div>
                {p.badge ? (
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${p.badgeColor ? "text-white border-transparent " + p.badgeColor : ""}`}
                  >
                    {p.badge}
                  </Badge>
                ) : null}
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11.5px]">
                <div className="flex items-center gap-1.5 text-ink-2">
                  <Calendar className="w-3 h-3" />
                  {p.duration}
                </div>
                <div className="flex items-center gap-1.5 text-ink-2">
                  <Dumbbell className="w-3 h-3" />
                  {p.sessions}
                </div>
                <div className="flex items-center gap-1.5 text-ink-2 col-span-2">
                  <User className="w-3 h-3" />
                  {p.coach} · {p.level}
                </div>
              </dl>

              <div className="mt-auto pt-3 flex items-center justify-between">
                <p className="font-semibold text-foreground text-[14px]">
                  ${p.price}
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
