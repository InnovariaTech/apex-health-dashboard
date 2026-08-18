// @ts-nocheck
import React, { useMemo, useState } from "react";
import { Calendar, ClipboardSignature, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBiomarkersSummary } from "@/hooks/biomarkers/useBiomarkers";
import type {
  BiomarkerCategoryMap,
  BiomarkerSummaryItem,
} from "@/types/biomarkers/biomarkers_types";
import BiomarkersKpiStrip from "@/views/patient/components/biomarkers/BiomarkersKpiStrip";
import BiomarkersFeaturedMarker from "@/views/patient/components/biomarkers/BiomarkersFeaturedMarker";
import BiomarkerTile from "@/views/patient/components/biomarkers/BiomarkerTile";
import BiomarkersFilterRow from "@/views/patient/components/biomarkers/BiomarkersFilterRow";
import BiomarkersInsights from "@/views/patient/components/biomarkers/BiomarkersInsights";
import BiomarkerDrillPanel from "@/views/patient/components/biomarkers/BiomarkerDrillPanel";
import BiomarkerPdfReport from "@/views/patient/components/biomarkers/BiomarkerPdfReport";
import {
  itemHasAnyValue,
  resolveRegistryRange,
} from "@/views/patient/utils/biomarkerHelpers";
import { useAllPatientSummaries } from "@/hooks/ai-agent/useaiSummary";
import { format, parseISO } from "date-fns";

/**
 * Hide biomarkers that don't have BOTH a low-normal and a high-normal bound.
 * Requires the resolved registry range to carry a two-sided normal range
 * (`normalMin` AND `normalMax`). This intentionally also hides one-directional
 * markers (higher-/lower-is-better, e.g. CRP, HbA1c, triglycerides, eGFR, HDL)
 * since they only define one side. Flip to `false` to show every tracked
 * marker regardless of range.
 */
const HIDE_MARKERS_WITHOUT_NORMAL_RANGE = true;

function hasTwoSidedNormalRange(item: BiomarkerSummaryItem): boolean {
  const range = resolveRegistryRange(item);
  return (
    range !== null && range.normalMin !== null && range.normalMax !== null
  );
}

function shouldShowMarker(item: BiomarkerSummaryItem): boolean {
  if (!itemHasAnyValue(item)) return false;
  if (HIDE_MARKERS_WITHOUT_NORMAL_RANGE && !hasTwoSidedNormalRange(item)) {
    return false;
  }
  return true;
}

/**
 * Biomarkers page — recomposed to mirror the `New Ui/3 Biomarkers` mockup.
 *
 * Layout order:
 *   1. Page head (title + subtitle with draw metadata + action buttons)
 *   2. KPI strip
 *   3. Featured marker block
 *   4. Filter row (category pills + Compare toggle)
 *   5. Biomarker tile grid
 *   6. Patterns & insights
 *
 * Phase 1 — no static reference-range dictionary yet, so tile range bars,
 * "what this measures" and the factors/plan sections of the drill panel
 * are deferred. See `BiomarkersFeaturedMarker` and `BiomarkerDrillPanel`
 * for the structure that'll fill in when Phase 2 lands.
 */
export default function Biomarkers() {
  const { data, isLoading, isError, refetch, isFetching } = useBiomarkersSummary();
  const [selected, setSelected] = useState<{
    item: BiomarkerSummaryItem;
    category: string;
  } | null>(null);
  const [activeCat, setActiveCat] = useState<string>("all");
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [pdfOpen, setPdfOpen] = useState<boolean>(false);

  // Bio-age for the PDF summary (from the latest AI report). React Query
  // de-dupes with the KPI strip's identical query.
  const summariesQuery = useAllPatientSummaries();
  const bioAge = summariesQuery.data?.items?.find((s) => s.report)?.report
    ?.biologicalAge;

  // Full category map after hiding markers with no usable reference range —
  // shared by the KPI strip, featured marker, and tile grid so every count
  // stays consistent.
  const filteredData = useMemo<BiomarkerCategoryMap>(() => {
    const out: BiomarkerCategoryMap = {};
    if (!data) return out;
    for (const [cat, items] of Object.entries(data)) {
      out[cat] = Array.isArray(items) ? items.filter(shouldShowMarker) : [];
    }
    return out;
  }, [data]);

  // Derived: only categories with at least one visible item.
  const categories = useMemo(() => {
    return Object.entries(filteredData)
      .map(([cat, items]) => [cat, items] as [string, BiomarkerSummaryItem[]])
      .filter(([, items]) => items.length > 0);
  }, [filteredData]);

  const totalTracked = useMemo(
    () => categories.reduce((sum, [, items]) => sum + items.length, 0),
    [categories],
  );

  // Pill counts.
  const categoryCounts = useMemo<Array<[string, number]>>(
    () => categories.map(([cat, items]) => [cat, items.length]),
    [categories],
  );

  // Items visible after filter.
  const visibleItems = useMemo(() => {
    const out: Array<{ item: BiomarkerSummaryItem; category: string }> = [];
    categories.forEach(([cat, items]) => {
      if (activeCat !== "all" && cat !== activeCat) return;
      items.forEach((item) => out.push({ item, category: cat }));
    });
    return out;
  }, [categories, activeCat]);

  // Latest draw date — pulled from the most recent trend point across all items.
  const latestDrawDate = useMemo(() => {
    let latest: string | null = null;
    for (const [, items] of categories) {
      for (const item of items) {
        const last = item.trend[item.trend.length - 1];
        const d = last?.date;
        if (d && (!latest || d > latest)) latest = d;
      }
    }
    return latest;
  }, [categories]);

  // Map category lookup for the drill panel (so we can look up the parent
  // category by item id when the featured card asks us to open).
  const itemsById = useMemo(() => {
    const map = new Map<string, { item: BiomarkerSummaryItem; category: string }>();
    for (const [cat, items] of categories) {
      for (const item of items) {
        const id = item.loinc || item.canonicalName || item.biomarkerName;
        if (id) map.set(id, { item, category: cat });
      }
    }
    return map;
  }, [categories]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-9 max-w-[1280px] mx-auto bg-background text-foreground">
      {/* Page head */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="apex-page-title">
            Biomarkers <em>panel</em>
          </h1>
          <div
            className="flex items-center gap-3 mt-2 flex-wrap"
            style={{ fontSize: 13, color: "var(--ink-2)" }}
          >
            <span>
              {totalTracked} of {totalTracked} tracked
            </span>
            {latestDrawDate && (
              <>
                <span
                  className="rounded-full inline-block"
                  style={{
                    width: 3,
                    height: 3,
                    background: "var(--ink-4)",
                  }}
                />
                <span>Drawn {fmtDraw(latestDrawDate)}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPdfOpen(true)}
            disabled={categories.length === 0}
            title="Preview & export a PDF report"
          >
            <ClipboardSignature className="w-3.5 h-3.5" /> Export PDF
          </Button>
          {/* Schedule panel hidden — no scheduling backend wired yet.
          <Button variant="default" size="sm" disabled title="Scheduling coming soon">
            <Calendar className="w-3.5 h-3.5" /> Schedule panel
          </Button>
          */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <div
          className="mb-6 apex-card flex items-center justify-between"
          style={{
            padding: 16,
            borderColor: "var(--att)",
            background: "var(--att-soft)",
          }}
        >
          <span style={{ color: "var(--att)" }}>
            Could not load biomarkers. Please try again.
          </span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {/* KPI strip */}
      {!isError && categories.length > 0 && <BiomarkersKpiStrip data={filteredData} />}

      {/* Featured marker */}
      {!isError && categories.length > 0 && (
        <BiomarkersFeaturedMarker
          data={filteredData}
          onOpen={(id) => {
            const entry = itemsById.get(id);
            if (entry) setSelected(entry);
          }}
        />
      )}

      {/* Filter row */}
      {!isError && categories.length > 0 && (
        <BiomarkersFilterRow
          categories={categoryCounts}
          totalCount={totalTracked}
          activeCat={activeCat}
          compareMode={compareMode}
          onCatChange={setActiveCat}
          onCompareToggle={() => setCompareMode((v) => !v)}
        />
      )}

      {/* Empty state */}
      {!isError && categories.length === 0 && (
        <div
          className="apex-card border-dashed text-center"
          style={{ padding: 40 }}
        >
          <p className="font-sans text-lg font-bold text-foreground mb-1">
            No biomarker data yet
          </p>
          <p style={{ fontSize: 13, color: "var(--ink-3)" }}>
            Once your lab results are uploaded and processed, they will appear
            here grouped by category.
          </p>
        </div>
      )}

      {/* Tile grid */}
      {visibleItems.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mb-7">
          {visibleItems.map(({ item, category }, idx) => (
            <BiomarkerTile
              key={`${item.loinc || item.canonicalName || "marker"}-${idx}`}
              item={item}
              category={category}
              index={idx}
              compareMode={compareMode}
              onOpen={() => setSelected({ item, category })}
            />
          ))}
        </div>
      )}

      {isFetching && !isLoading && (
        <p
          className="text-center py-4"
          style={{ fontSize: 12, color: "var(--ink-3)" }}
        >
          Refreshing…
        </p>
      )}

      {/* Patterns & insights */}
      {!isError && categories.length > 0 && <BiomarkersInsights />}

      {/* Drill panel */}
      <BiomarkerDrillPanel
        item={selected?.item ?? null}
        category={selected?.category ?? null}
        open={selected !== null}
        onClose={() => setSelected(null)}
      />

      {/* PDF export */}
      <BiomarkerPdfReport
        open={pdfOpen}
        onClose={() => setPdfOpen(false)}
        data={filteredData}
        bioAge={bioAge}
      />
    </div>
  );
}

function fmtDraw(iso: string): string {
  try {
    return format(parseISO(iso), "MMM d, yyyy");
  } catch {
    return iso;
  }
}
