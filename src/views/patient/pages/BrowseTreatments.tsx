// @ts-nocheck
import React from "react";
import { useGroupedTreatments } from "@/hooks/care-validate/useTreatments";
import { htmlToPlainText } from "@/lib/htmlUtils";
import { useEnvironment } from "@/lib/EnvironmentContext";
import { resolveTreatmentFormUrl } from "@/lib/formLinks";

export default function BrowseTreatments() {
  const { groups, isLoading, isError } = useGroupedTreatments({ isVisible: true });
  const { environment } = useEnvironment();
  const envId = environment?.id;

  return (
    <div className="p-4 md:p-8 space-y-8 bg-slate-50 min-h-screen">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Browse Treatments</h1>
        <p className="text-sm text-slate-600 mt-1">
          Explore available treatments grouped by category.
        </p>
      </header>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 rounded-full border-4 border-slate-200 border-t-slate-700 animate-spin" />
        </div>
      )}

      {isError && (
        <div className="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          Failed to load treatment categories. Please refresh and try again.
        </div>
      )}

      {!isLoading && !isError && groups.length === 0 && (
        <div className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-600">
          No treatments found.
        </div>
      )}

      {!isLoading &&
        !isError &&
        groups.map((group) => (
          <section key={group.category} className="space-y-4">
            <div className="flex items-baseline justify-between border-b border-slate-200 pb-2">
              <h2 className="text-xl font-semibold text-slate-900">{group.category}</h2>
              <span className="text-xs text-slate-500">
                {group.items.length} {group.items.length === 1 ? "item" : "items"}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
    <article className="group rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
      <div className="aspect-square bg-slate-100 flex items-center justify-center overflow-hidden">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <span className="text-xs text-slate-400">No image</span>
        )}
      </div>

      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="font-semibold text-slate-900 leading-snug">{item.name}</h3>
        <p className="text-base font-bold text-slate-900">
          {typeof item.price === "number" && item.price > 0 ? `$${item.price}` : "Contact for pricing"}
          {item.priceUnit ? (
            <span className="text-xs font-normal text-slate-500 ml-1">{item.priceUnit}</span>
          ) : null}
        </p>

        {descriptionPreview ? (
          <p className="text-xs text-slate-500 line-clamp-3">{descriptionPreview}</p>
        ) : null}

        <div className="mt-auto pt-3">
          <a
            href={formUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center rounded-md bg-slate-900 text-white text-sm font-medium py-2 hover:bg-slate-800 transition-colors"
          >
            Get Started
          </a>
        </div>
      </div>
    </article>
  );
}
