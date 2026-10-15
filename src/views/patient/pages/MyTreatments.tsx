import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  Loader2,
  MessageSquare,
  Pill,
  Sparkles,
} from "lucide-react";
import { openIntakeForm, useMyIntakes, usePendingIntakes } from "@/hooks/intake/usePendingIntakes";
import { useCareTeamThreads } from "@/hooks/healthie/useCareTeamMessages";
import { ProgressSegments, StatusBadge } from "@/views/patient/components/treatments/CaseBits";
import { buildCases, fmtCaseDate, type TreatmentCase } from "@/views/patient/utils/treatmentCases";
import { createPageUrl } from "@/utils";

/**
 * My Treatments, in the "My cases" design: stats, filters, one card per treatment with its
 * progress, each opening a detail page. Built from what the APIs give today — paid forms still to
 * fill in, and submitted ones with the care team. (The earlier hard-coded stack,
 * `@/components/health/MyTreatments`, is kept but no longer shown.)
 */

type Filter = "all" | "action" | "review" | "done";

const STAT_TONE = {
  brand: { strip: "var(--apex-accent-bright)", fg: "var(--apex-accent-bright)" },
  warn: { strip: "var(--bord)", fg: "var(--bord)" },
  ok: { strip: "var(--opt)", fg: "var(--opt-d)" },
  neutral: { strip: "var(--mute)", fg: "var(--mute)" },
} as const;

function Stat({
  label,
  value,
  sub,
  tone,
  icon: Icon,
}: {
  label: string;
  value: number;
  sub: string;
  tone: keyof typeof STAT_TONE;
  icon: typeof Briefcase;
}) {
  const t = STAT_TONE[tone];
  return (
    <div className="apex-card relative overflow-hidden px-[15px] py-[14px] md:px-5 md:py-[18px]">
      <span className="absolute inset-x-0 top-0 h-[3px]" style={{ background: t.strip }} />
      <span className="apex-eyebrow flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" style={{ color: t.fg }} />
        {label}
      </span>
      <p className="mt-2.5 text-[28px] font-extrabold leading-none tracking-[-0.03em] text-foreground md:text-[34px]">
        {value}
      </p>
      <p className="mt-1.5 text-[12px] text-ink-2">{sub}</p>
    </div>
  );
}

function CaseCard({ c, unread }: { c: TreatmentCase; unread: number }) {
  const body = (
    <>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11.5px] tracking-[0.04em] text-[var(--mute)]">{c.ref}</span>
          <StatusBadge status={c.status} />
        </div>
        <h3 className="apex-card-title my-2">{c.title}</h3>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[12.5px] text-ink-2">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {c.status === "action_needed" ? "Waiting for your answers" : `Updated ${fmtCaseDate(c.updatedAt)}`}
          </span>
          {c.status !== "action_needed" &&
            (unread > 0 ? (
              <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--apex-accent-bright)]">
                <MessageSquare className="w-3.5 h-3.5" />
                {unread} unread
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" /> Messages with your care team
              </span>
            ))}
        </div>
      </div>
      <ProgressSegments c={c} />
      {c.status === "action_needed" ? (
        <button
          onClick={(e) => {
            e.preventDefault();
            openIntakeForm(c.token!, c.id);
          }}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] px-[15px] py-[9px] text-[13px] font-semibold text-white hover:brightness-[1.08]"
          style={{ background: "var(--apex-accent-bright)" }}
        >
          Fill out form <ExternalLink className="w-4 h-4" />
        </button>
      ) : (
        <ChevronRight className="hidden w-5 h-5 text-[var(--mute)] md:block" />
      )}
    </>
  );
  const cls =
    "apex-card grid items-center gap-5 px-[22px] py-5 transition-shadow hover:shadow-[var(--shadow-card-hover)] md:grid-cols-[minmax(0,1fr)_250px_auto] md:gap-6";
  return c.status === "action_needed" ? (
    <div className={cls}>{body}</div>
  ) : (
    <Link to={`${createPageUrl("MyTreatments")}/${c.id}`} className={cls}>
      {body}
    </Link>
  );
}

export default function MyTreatments() {
  const pending = usePendingIntakes();
  const mine = useMyIntakes();
  const { unreadCount } = useCareTeamThreads();
  const [filter, setFilter] = useState<Filter>("all");

  const cases = useMemo(() => buildCases(pending.data ?? [], mine.data ?? []), [pending.data, mine.data]);
  const counts = {
    all: cases.length,
    action: cases.filter((c) => c.status === "action_needed").length,
    review: cases.filter((c) => c.status === "in_review").length,
    done: cases.filter((c) => c.status === "completed").length,
  };
  const shown = cases.filter((c) =>
    filter === "all"
      ? true
      : filter === "action"
        ? c.status === "action_needed"
        : filter === "review"
          ? c.status === "in_review"
          : c.status === "completed",
  );
  const loading = mine.isLoading && pending.isLoading;
  // One conversation per patient today, so its unread count belongs to the in-review cases.
  const unreadFor = (c: TreatmentCase) => (c.status === "in_review" ? unreadCount : 0);

  return (
    <div className="p-4 md:p-9 max-w-[1240px] bg-background text-foreground">
      <div className="mb-7">
        <span className="apex-ai-tag">
          <Briefcase className="w-3 h-3" /> {cases.length} {cases.length === 1 ? "treatment" : "treatments"}
        </span>
        <h1 className="apex-page-title mt-3">
          My <em>Treatments</em>
        </h1>
        <p className="apex-page-sub">
          Your care with the Apex MD team, from intake to plan. Messages and documents for your care live here too.
        </p>
      </div>

      <div className="mb-9 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          label="Open"
          value={counts.action + counts.review}
          sub="Active or awaiting review"
          tone="brand"
          icon={Briefcase}
        />
        <Stat label="In review" value={counts.review} sub="With your care team now" tone="warn" icon={Clock} />
        <Stat label="Completed" value={counts.done} sub="Closed and archived" tone="ok" icon={CheckCircle2} />
        <Stat
          label="Unread messages"
          value={unreadCount}
          sub={unreadCount ? "From your care team" : "You're all caught up"}
          tone={unreadCount ? "brand" : "neutral"}
          icon={MessageSquare}
        />
      </div>

      <p className="apex-eyebrow mb-3">All treatments</p>
      <div className="mb-3.5 flex gap-2 overflow-x-auto md:flex-wrap">
        {(
          [
            ["all", "All", counts.all],
            ["action", "Action needed", counts.action],
            ["review", "In review", counts.review],
            ["done", "Completed", counts.done],
          ] as const
        ).map(([key, label, n]) => {
          const active = filter === key;
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`inline-flex shrink-0 items-center gap-[7px] rounded-full border px-[13px] py-[7px] text-[12.5px] font-medium transition ${
                active ? "text-white" : "border-border bg-card text-foreground"
              }`}
              style={active ? { background: "var(--apex-accent-bright)", borderColor: "var(--apex-accent-bright)" } : undefined}
            >
              {label}
              <span className={`font-mono text-[10.5px] ${active ? "opacity-75" : "text-[var(--mute)]"}`}>{n}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="py-20 flex justify-center text-ink-2">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : shown.length > 0 ? (
        <div className="space-y-3">
          {shown.map((c) => (
            <CaseCard key={c.id} c={c} unread={unreadFor(c)} />
          ))}
        </div>
      ) : cases.length > 0 ? (
        <div className="apex-card p-10 text-center">
          <p className="font-semibold text-foreground">Nothing here</p>
          <p className="mt-1 text-sm text-ink-2">No treatments match this filter yet.</p>
        </div>
      ) : (
        <div className="apex-card flex flex-col items-center p-12 text-center">
          <div
            className="grid h-16 w-16 place-items-center rounded-2xl"
            style={{ background: "var(--apex-accent-soft)", color: "var(--apex-accent-bright)" }}
          >
            <Pill className="w-8 h-8" />
          </div>
          <p className="mt-4 text-xl font-semibold text-foreground">No treatments yet</p>
          <p className="mt-1 max-w-md text-sm text-ink-2">
            When you start a program or treatment with us, it shows up here with every step and what comes next.
          </p>
          <Link
            to={createPageUrl("Shop")}
            className="mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110"
            style={{ background: "var(--apex-accent-bright)" }}
          >
            <Sparkles className="w-4 h-4" /> Explore programs
          </Link>
        </div>
      )}
    </div>
  );
}
