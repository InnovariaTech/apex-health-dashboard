// @ts-nocheck
import React from "react";
import { useGroupedTreatments } from "@/hooks/care-validate/useTreatments";
import { htmlToPlainText } from "@/lib/htmlUtils";
import { useEnvironment } from "@/lib/EnvironmentContext";
import { resolveTreatmentFormUrl } from "@/lib/formLinks";
import { Button } from "@/components/ui/button";
import { ImageOff } from "lucide-react";

export default function BrowseTreatments() {
  const { groups, isLoading, isError } = useGroupedTreatments({ isVisible: true });
  const { environment } = useEnvironment();
  const envId = environment?.id;

  return (
    <div className="p-4 md:p-9 max-w-[1480px] mx-auto bg-background text-foreground min-h-screen">
      {/* Page head */}
      <div className="mb-6 pb-5 border-b border-border">
        <div className="apex-eyebrow mb-2">Catalog</div>
        <h1 className="apex-page-title">
          Browse <em>treatments</em>
        </h1>
        <p className="text-[13px] text-ink-2 mt-2">
          Explore available treatments grouped by category.
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      )}

      {isError && (
        <div
          className="apex-card p-4 text-sm"
          style={{ borderColor: "var(--att)", background: "var(--att-soft)" }}
        >
          <span style={{ color: "var(--att)" }}>
            Failed to load treatment categories. Please refresh and try again.
          </span>
        </div>
      )}

      {!isLoading && !isError && groups.length === 0 && (
        <div className="apex-card border-dashed p-10 text-center">
          <p className="font-serif text-lg font-medium text-foreground mb-1">
            No treatments found
          </p>
          <p className="text-[13px] text-muted-foreground">
            Once treatments are published, they will appear here grouped by category.
          </p>
        </div>
      )}

      {!isLoading &&
        !isError &&
        groups.map((group) => (
          <section key={group.category} className="mb-9">
            <div className="flex items-baseline justify-between border-b border-border pb-2.5 mb-4">
              <h2 className="apex-card-title">{group.category}</h2>
              <span className="apex-eyebrow">
                {group.items.length} {group.items.length === 1 ? "item" : "items"}
              </span>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {group.items.map((item) => (
                <TreatmentCard key={item.id} item={item} envId={envId} />
              ))}
            </div>
          </section>
        ))}
    </div>
  );
}

function TreatmentCard({ item, envId }) {
  const descriptionPreview = htmlToPlainText(item.description || "");
  const formUrl = resolveTreatmentFormUrl({
    envId,
    bundleName: item.name,
    externalUrl: item.externalUrl,
    externalFormUrl: item.externalFormUrl,
  });

  return (
    <article className="apex-card group overflow-hidden flex flex-col transition-all duration-150 hover:-translate-y-px hover:border-[var(--line-2)]">
      <div className="aspect-square bg-surface-2 flex items-center justify-center overflow-hidden border-b border-border">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <span className="flex flex-col items-center gap-1.5 text-ink-4">
            <ImageOff className="w-5 h-5" />
            <span className="apex-eyebrow">No image</span>
          </span>
        )}
      </div>

      <div className="p-[18px] flex flex-col gap-2 flex-1">
        <h3 className="text-[14px] font-medium leading-snug text-foreground">
          {item.name}
        </h3>
        <p className="font-mono text-[18px] font-medium tracking-[-0.02em] text-foreground">
          {typeof item.price === "number" && item.price > 0
            ? `$${item.price}`
            : "Contact for pricing"}
          {item.priceUnit ? (
            <span className="font-sans text-[11px] font-normal text-muted-foreground ml-1">
              {item.priceUnit}
            </span>
          ) : null}
        </p>

        {descriptionPreview ? (
          <p className="text-[12px] text-muted-foreground line-clamp-3 leading-relaxed">
            {descriptionPreview}
          </p>
        ) : null}

        <div className="mt-auto pt-3">
          <Button asChild variant="dark" className="w-full">
            <a href={formUrl} target="_blank" rel="noopener noreferrer">
              Get Started
            </a>
          </Button>
        </div>
      </div>
    </article>
  );
}
