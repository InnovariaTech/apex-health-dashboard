import { ArrowRight, ClipboardList, LayoutDashboard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

/**
 * Shown in place of a page whose service is switched off (today: the CareValidate pages — see
 * `@/constants/features`). Nothing is fetched; the page's own code is untouched behind this.
 */
export default function ServiceMoved({ title }: { title: string }) {
  const navigate = useNavigate();
  return (
    <div className="p-4 md:p-9 max-w-[1280px] mx-auto bg-background text-foreground">
      <h1 className="apex-page-title">{title}</h1>
      <div className="apex-card mt-7 flex flex-col items-center p-10 text-center md:p-14">
        <div
          className="grid h-16 w-16 place-items-center rounded-2xl"
          style={{ background: "var(--apex-accent-soft)", color: "var(--apex-accent-bright)" }}
        >
          <ClipboardList className="w-8 h-8" />
        </div>
        <h2 className="mt-5 text-xl font-semibold text-foreground">This section has moved</h2>
        <p className="mt-2 max-w-md text-sm text-ink-2">
          We&apos;ve moved to a new care platform. Your forms and their progress are now on your dashboard, and
          your care team will reach you there.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => navigate(createPageUrl("Dashboard"))}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110"
            style={{ background: "var(--apex-accent-bright)" }}
          >
            <LayoutDashboard className="w-4 h-4" /> Go to dashboard
          </button>
          <button
            onClick={() => navigate(createPageUrl("OutstandingForms"))}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-black/5"
          >
            My forms <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
