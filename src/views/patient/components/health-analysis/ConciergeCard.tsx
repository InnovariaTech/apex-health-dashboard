import { Calendar } from "lucide-react";

/**
 * Concierge medicine marketing card — static content from the
 * `New Ui/2 Health Analysis` mockup. No live data; the price + CTA copy
 * are owned by marketing and intentionally kept in code so design can
 * iterate without a backend dependency.
 *
 * Doctor photo lives in `public/health-analysis/doctor-consultation.jpg`
 * (copied verbatim from the mockup folder).
 */
export default function ConciergeCard() {
  return (
    <div className="apex-card overflow-hidden flex flex-col md:flex-row mb-6">
      <div className="md:w-[42%] md:max-w-[420px] aspect-[4/3] md:aspect-auto bg-secondary relative overflow-hidden">
        <img
          src="/health-analysis/doctor-consultation.jpg"
          alt="Apex MD physician reviewing results with a patient"
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="p-6 md:p-8 flex flex-col flex-1 min-w-0">
        <span
          className="font-mono text-[11px] font-bold uppercase tracking-[.1em]"
          style={{ color: "var(--apex-accent-bright)" }}
        >
          Concierge medicine
        </span>
        <h3 className="apex-card-title-ink mt-2">
          Work directly with an Apex MD physician — virtually
        </h3>
        <p className="text-[15px] text-ink-2 leading-[1.62] mt-3 max-w-[62ch]">
          Take the next step beyond your report. Get a personalized health
          optimization plan and work one-on-one with an Apex MD physician —
          with regular blood draws and advanced diagnostic testing to ensure
          optimal health is restored and maintained.
        </p>
        <div className="mt-auto pt-5 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--line)]">
          <div className="font-sans text-[14px] text-ink-3">
            Starting at{" "}
            <b className="text-[24px] text-foreground font-bold tracking-[-0.02em] mx-1">
              $399
            </b>
            <span className="text-[13px] text-ink-3 font-semibold">/month</span>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-[11px] text-white font-semibold text-[13.5px] transition-colors"
            style={{ background: "var(--apex-accent-bright)" }}
          >
            <Calendar className="w-4 h-4" strokeWidth={2} />
            Book a consultation
          </button>
        </div>
      </div>
    </div>
  );
}
