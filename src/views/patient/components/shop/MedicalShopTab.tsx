// @ts-nocheck
import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getMedicalBadgeColor } from "@/views/patient/components/shop/badgeColors";
import type { MedicalCategory } from "@/types/shop/catalog_types";

/**
 * Medical catalog tab — six clinical categories (Weight Loss, TRT, HRT,
 * Peptides, Lab Diagnostics, etc.). Each category can carry multiple
 * sections; each section ships its own product grid. Cards link out to
 * the external order form via `product.url` in a new tab.
 *
 * Renders a horizontally-scrollable chip row for category selection so
 * we don't trigger another shadcn Tabs nesting inside the page-level
 * Tabs and risk style conflicts.
 */
export default function MedicalShopTab({
  categories,
}: {
  categories: MedicalCategory[];
}) {
  const [activeCategoryId, setActiveCategoryId] = useState<string>(
    categories[0]?.id ?? "",
  );
  const activeCategory =
    categories.find((c) => c.id === activeCategoryId) ?? categories[0];

  if (!activeCategory) {
    return (
      <p className="text-sm text-muted-foreground">No medical categories.</p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((c) => {
          const isActive = c.id === activeCategory.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveCategoryId(c.id)}
              className={
                isActive
                  ? "px-3.5 py-1.5 rounded-full text-[12.5px] font-medium bg-foreground text-background border border-foreground whitespace-nowrap"
                  : "px-3.5 py-1.5 rounded-full text-[12.5px] font-medium bg-card text-foreground border border-border hover:border-[var(--line-2)] whitespace-nowrap"
              }
            >
              {c.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-8">
        {activeCategory.sections.map((s) => (
          <section key={s.id}>
            <div
              className="mb-5 rounded-[14px] border border-border bg-card overflow-hidden"
            >
              {/* Color band at the top — pulls from each section's
                  `badgeColor` so GLP-1 / Longevity / TRT each get their
                  own accent. Thin enough to feel like a header strip,
                  thick enough to read at a glance. */}
              <div className={`h-1.5 ${s.badgeColor || "bg-foreground"}`} />
              <div className="p-5 md:p-6 flex flex-col md:flex-row md:items-end gap-4 md:gap-6">
                <div className="flex-1 min-w-0">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium text-white ${s.badgeColor || "bg-foreground"}`}
                  >
                    {s.tagline}
                  </span>
                  <h2 className="font-serif text-2xl md:text-3xl font-semibold text-foreground mt-2.5 leading-tight">
                    {s.label}
                  </h2>
                  <p className="text-[13.5px] text-muted-foreground mt-2 max-w-2xl">
                    {s.description}
                  </p>
                </div>
                {s.quizUrl ? (
                  <a
                    href={s.quizUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="md:flex-shrink-0"
                  >
                    <Button variant="outline" size="sm">
                      Take the quiz
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </a>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {s.products.map((p) => (
                <a
                  key={`${s.id}-${p.name}`}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="apex-card flex flex-col overflow-hidden transition-all duration-150 hover:-translate-y-px hover:border-[var(--line-2)]"
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
                      <p className="font-medium text-foreground text-[14px] leading-snug">
                        {p.name}
                      </p>
                      {p.badge ? (
                        <Badge
                          variant="outline"
                          className={`text-[10px] text-white border-transparent ${getMedicalBadgeColor(p.badge)}`}
                        >
                          {p.badge}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-[12px] text-muted-foreground mt-1.5">
                      {p.desc}
                    </p>
                    <div className="mt-auto pt-3 flex items-center justify-between">
                      <p className="font-semibold text-foreground text-[14px]">
                        {p.price}
                      </p>
                      <span className="text-[12px] inline-flex items-center gap-1 text-ink-3">
                        Shop
                        <ExternalLink className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
