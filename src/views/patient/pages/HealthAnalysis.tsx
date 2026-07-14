// @ts-nocheck
import React, { useMemo, useRef, useState } from "react";
import { ClipboardSignature, RefreshCw, ShieldCheck, Sparkles, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  useAllPatientSummaries,
  useGeneratePatientSummary,
} from "@/hooks/ai-agent/useaiSummary";
import AnalysisScoreCard from "@/views/patient/components/health-analysis/AnalysisScoreCard";
import AnalysisBioAgeCard from "@/views/patient/components/health-analysis/AnalysisBioAgeCard";
import ConciergeCard from "@/views/patient/components/health-analysis/ConciergeCard";
import NarrativeReportCard from "@/views/patient/components/health-analysis/NarrativeReportCard";
import TrendsCard from "@/views/patient/components/health-analysis/TrendsCard";
import HistoryDrawer from "@/views/patient/components/health-analysis/HistoryDrawer";

/**
 * Health Analysis page — recomposed to mirror the `New Ui/2 Health Analysis`
 * mockup:
 *
 *   1. Page head (eyebrow + title + subtitle + Export PDF + Run new analysis)
 *   2. Hero (Score card · Bio age card)
 *   3. Concierge medicine marketing card
 *   4. Narrative report card
 *   5. Past-analyses drawer (collapsed by default)
 *   6. Status bar
 *
 * Each card pulls data from the hooks it needs (no prop drilling), except
 * the narrative card which receives the currently selected summary from
 * the page-level history drawer state.
 */
export default function HealthAnalysis() {
  const history = useAllPatientSummaries();
  const generate = useGeneratePatientSummary();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const printableRef = useRef<HTMLDivElement | null>(null);

  /**
   * Snapshot each top-level section into its own canvas, then lay them out
   * on an A4 PDF with smart page breaks (advance to a new page rather than
   * cutting through a card). A tall single section that's larger than one
   * page gets vertically tiled across pages.
   *
   * Both libs are dynamically imported so they don't bloat the initial
   * Dashboard bundle.
   */
  const handleExportPdf = async () => {
    if (!printableRef.current || exporting) return;
    setExporting(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 8; // mm, top + bottom + left + right
      const usableW = pageW - margin * 2;
      const usableH = pageH - margin * 2;

      let cursorY = margin;

      // Brand header (page 1 only)
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.setTextColor(26, 26, 26);
      pdf.text("Apex MD · Health Analysis", margin, cursorY + 4);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(120, 120, 120);
      pdf.text(
        format(new Date(), "EEEE, MMM d, yyyy"),
        pageW - margin,
        cursorY + 4,
        { align: "right" },
      );
      pdf.setDrawColor(230);
      pdf.line(margin, cursorY + 7, pageW - margin, cursorY + 7);
      cursorY += 12;

      const sections = Array.from(
        printableRef.current.children,
      ) as HTMLElement[];

      // scale 1.5 keeps text crisp at A4 print size while halving the
      // pixel work vs. scale 2 — html2canvas runs on the main thread, so
      // every doubling of pixels is felt as a UI freeze.
      const captureOpts = {
        scale: 1.5,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      } as const;

      // Yield to the browser between expensive sync captures so input,
      // animation frames, and our busy-overlay paint stay responsive.
      const yieldToBrowser = () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => setTimeout(resolve, 0)),
        );

      for (const section of sections) {
        // Skip zero-height / hidden nodes
        if (!section.offsetHeight) continue;

        await yieldToBrowser();
        const canvas = await html2canvas(section, captureOpts);
        const imgW = usableW;
        const imgH = (canvas.height * imgW) / canvas.width;
        const imgData = canvas.toDataURL("image/jpeg", 0.94);

        // Section fits on the rest of the current page
        if (imgH <= usableH - (cursorY - margin)) {
          pdf.addImage(imgData, "JPEG", margin, cursorY, imgW, imgH, undefined, "FAST");
          cursorY += imgH + 6;
          continue;
        }

        // Section is small enough for one page but doesn't fit the remainder
        if (imgH <= usableH) {
          pdf.addPage();
          cursorY = margin;
          pdf.addImage(imgData, "JPEG", margin, cursorY, imgW, imgH, undefined, "FAST");
          cursorY += imgH + 6;
          continue;
        }

        // Section is taller than a full page — vertically tile it.
        // Each slice covers one page (usableH mm), translated upward.
        pdf.addPage();
        let drawn = 0;
        while (drawn < imgH) {
          const yOffset = margin - drawn;
          pdf.addImage(imgData, "JPEG", margin, yOffset, imgW, imgH, undefined, "FAST");
          // Clip the parts that overflow the page area (jsPDF doesn't clip
          // by itself — we draw a white margin band on top/bottom).
          pdf.setFillColor(255, 255, 255);
          pdf.rect(0, 0, pageW, margin, "F");
          pdf.rect(0, pageH - margin, pageW, margin, "F");
          drawn += usableH;
          if (drawn < imgH) {
            pdf.addPage();
          } else {
            cursorY = margin + (imgH - (drawn - usableH)) + 6;
          }
        }
      }

      // Footer on every page
      const pageCount = pdf.getNumberOfPages();
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(150);
      for (let p = 1; p <= pageCount; p++) {
        pdf.setPage(p);
        pdf.text(
          `Apex MD · End-to-end encrypted`,
          margin,
          pageH - margin / 2,
        );
        pdf.text(
          `${p} / ${pageCount}`,
          pageW - margin,
          pageH - margin / 2,
          { align: "right" },
        );
      }

      const filename = `Apex MD Health Analysis - ${format(new Date(), "yyyy-MM-dd")}.pdf`;
      pdf.save(filename);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Couldn't export PDF",
        description: (err as Error)?.message ?? "Try again in a moment.",
      });
    } finally {
      setExporting(false);
    }
  };

  const sortedItems = useMemo(() => {
    const items = history.data?.items ?? [];
    return [...items].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [history.data?.items]);

  const latestSummary = sortedItems[0] ?? null;
  // Only the latest summary carries `report` today. If the user picks an
  // older entry from the drawer, fall back to the latest so the page
  // doesn't render an empty shell.
  const activeSummary = useMemo(() => {
    if (selectedId) {
      const picked = sortedItems.find((s) => s.id === selectedId);
      if (picked?.report) return picked;
    }
    return latestSummary;
  }, [selectedId, sortedItems, latestSummary]);

  const isLoading = history.isLoading;
  const isEmpty = !isLoading && !activeSummary;
  const activeReport = activeSummary?.report ?? null;

  return (
    <div className="p-4 md:p-9 max-w-[1280px] mx-auto bg-background text-foreground">
      {/* Page head */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="apex-ai-tag mb-3">
            <Sparkles className="w-3 h-3" strokeWidth={2.2} />
            AI health analysis
          </div>
          <h1 className="apex-page-title">
            Health <em>analysis</em>
          </h1>
          <p className="apex-page-sub">
            Personalized longitudinal insights from your latest lab work.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={handleExportPdf}
            disabled={exporting || isLoading || isEmpty}
            title={
              isEmpty
                ? "Run an analysis first"
                : "Export the report as a PDF"
            }
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ClipboardSignature className="w-4 h-4" />
            )}
            {exporting ? "Exporting…" : "Export as PDF"}
          </Button>
          <Button
            onClick={() => generate.mutate()}
            disabled={generate.isPending}
          >
            <RefreshCw
              className={`w-4 h-4 ${generate.isPending ? "animate-spin" : ""}`}
            />
            {generate.isPending ? "Analysing..." : "Run new analysis"}
          </Button>
        </div>
      </div>

      {/* Empty state */}
      {isEmpty && (
        <Card className="border-dashed">
          <CardContent className="p-10 text-center">
            <div
              className="w-14 h-14 rounded-[14px] grid place-items-center mx-auto mb-4"
              style={{ backgroundColor: "var(--apex-accent-soft)" }}
            >
              <Sparkles
                className="w-7 h-7"
                style={{ color: "var(--apex-accent)" }}
              />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-foreground tracking-[-0.02em]">
              No analysis yet
            </h2>
            <p className="text-[14px] text-ink-2 mb-6 max-w-md mx-auto">
              Run your first AI health analysis to see your overall score, key
              trends and a personalized narrative summary of your biomarkers.
            </p>
            <Button
              onClick={() => generate.mutate()}
              disabled={generate.isPending}
            >
              <Sparkles className="w-4 h-4" />
              {generate.isPending ? "Analysing..." : "Generate first analysis"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid lg:grid-cols-[1.32fr_1fr] gap-[22px]">
          <div className="apex-card h-[420px]" />
          <div className="apex-card h-[420px]" />
        </div>
      )}

      {!isLoading && activeSummary && (
        <div ref={printableRef}>
          {/* Hero — mockup .hero-grid: 1.4fr / 1fr, 18px gap */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-[18px] mb-[18px]">
            <AnalysisScoreCard />
            <AnalysisBioAgeCard />
          </div>

          {/* Concierge marketing */}
          <ConciergeCard />

          {/* Narrative report (structured per-system sections) */}
          <NarrativeReportCard narrative={activeReport?.narrative ?? null} />

          {/* Recent trends — Positive / Monitor split */}
          <TrendsCard trends={activeReport?.narrative?.trends ?? null} />

          {/* Past analyses drawer */}
          <HistoryDrawer
            items={sortedItems}
            activeId={selectedId ?? latestSummary?.id ?? null}
            onSelect={setSelectedId}
            isLoading={history.isLoading}
          />

          {/* Status bar */}
          <div className="apex-status-bar">
            <div className="section">
              <ShieldCheck className="w-3 h-3" />
              <strong>End-to-end encrypted</strong>
            </div>
            <div className="section">
              {sortedItems.length}{" "}
              {sortedItems.length === 1 ? "analysis" : "analyses"} on record
            </div>
            <div className="flex-1" />
            <div className="section">
              latest score <strong>{latestSummary?.healthScore ?? "—"}</strong>
            </div>
          </div>
        </div>
      )}

      {exporting && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center"
          style={{
            background: "rgba(20, 20, 26, 0.42)",
            backdropFilter: "blur(3px)",
          }}
          aria-live="polite"
        >
          <div
            className="flex flex-col items-center gap-4"
            style={{
              background: "#fff",
              border: "1px solid var(--line)",
              borderRadius: 16,
              padding: "26px 34px",
              boxShadow: "0 24px 60px rgba(20,20,30,.28)",
              minWidth: 280,
            }}
          >
            <Loader2
              className="w-7 h-7 animate-spin"
              style={{ color: "var(--apex-accent-bright)" }}
            />
            <div className="text-center">
              <p
                style={{
                  fontWeight: 700,
                  fontSize: 15.5,
                  color: "var(--ink)",
                }}
              >
                Generating your PDF…
              </p>
              <p
                className="mt-1.5"
                style={{ fontSize: 12.5, color: "var(--ink-3)" }}
              >
                Rendering each section in turn. The page may pause briefly.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
