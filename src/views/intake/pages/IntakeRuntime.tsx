import { useEffect } from "react";
import { AlertCircle, CheckCircle2, CreditCard, Loader2 } from "lucide-react";
import { useBack, useIntakeStep } from "@/hooks/intake/useIntake";
import FactsStepView from "@/views/intake/components/FactsStep";
import QuestionStepView from "@/views/intake/components/QuestionStep";
import IntakeContentBlocks from "@/views/intake/components/IntakeContentBlocks";
import IntakeShell from "@/views/intake/components/IntakeShell";
import { loadIntakeToken, saveIntakeToken } from "@/lib/intakeToken";
import type { CheckoutStep, IntakeStep } from "@/types/intake/intake_types";

/**
 * The patient intake runtime. Mounted pre-auth for `/intake/:token` — the token
 * is the only credential. One component switches on `data.kind`; every endpoint
 * returns the same union. `GET` on mount is the source of truth.
 */

function readToken(): string {
  if (typeof window === "undefined") return "";
  const raw =
    window.location.pathname.replace(/^\/intake\//, "").split(/[/?#]/)[0] ?? "";
  // The Stripe return page is `/intake/return` and carries no token — recover
  // the one we stashed during the walk. Any real token is persisted so it can.
  if (!raw || raw === "return") return loadIntakeToken();
  let token = raw;
  try {
    token = decodeURIComponent(raw);
  } catch {
    /* keep raw */
  }
  saveIntakeToken(token);
  return token;
}

const Shell = IntakeShell;

function Terminal({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="text-center space-y-4">
      <div className="flex justify-center">{icon}</div>
      <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
      {children}
    </div>
  );
}

function CheckoutStepView({
  step,
  token,
  onRetry,
}: {
  step: CheckoutStep;
  token: string;
  onRetry: () => void;
}) {
  const back = useBack(token);
  return (
    <div className="space-y-6">
      <IntakeContentBlocks content={step.content} />
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <CreditCard className="w-9 h-9 text-[#e11816]" />
        </div>
        <h1 className="text-xl font-semibold text-slate-900">
          One last step — payment
        </h1>
        <p className="text-sm text-slate-500">
          Your answers are saved. Complete payment to finish and send your intake
          for review.
        </p>
      </div>

      {step.checkoutUrl ? (
        <a
          href={step.checkoutUrl}
          className="block text-center rounded-lg bg-[#e11816] hover:bg-[#c3140f] text-white py-3 text-[15px] font-medium"
        >
          Proceed to secure payment
        </a>
      ) : (
        <div className="text-center space-y-3">
          <p className="text-sm text-slate-500 inline-flex items-center gap-2 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" /> Preparing your secure
            payment…
          </p>
          <button
            onClick={onRetry}
            className="block mx-auto rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700"
          >
            Try again
          </button>
        </div>
      )}

      <button
        onClick={() => back.mutate()}
        disabled={back.isPending}
        className="w-full text-center text-[13px] text-slate-500 hover:text-slate-800 disabled:opacity-50"
      >
        ← Change my answers
      </button>

      <p className="text-[11px] text-slate-400 text-center">
        Payment is processed securely by Stripe. You won't be charged twice.
      </p>
    </div>
  );
}

function StepView({
  step,
  token,
  onRetry,
}: {
  step: IntakeStep;
  token: string;
  onRetry: () => void;
}) {
  switch (step.kind) {
    case "facts":
      return <FactsStepView step={step} token={token} />;
    case "question":
      return <QuestionStepView step={step} token={token} />;
    case "checkout":
      return <CheckoutStepView step={step} token={token} onRetry={onRetry} />;
    case "terminated":
      return (
        <Terminal
          icon={<AlertCircle className="w-10 h-10 text-slate-400" />}
          title="We're unable to proceed"
        >
          {step.content?.length ? (
            <div className="text-left">
              <IntakeContentBlocks content={step.content} />
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Based on your answers, we can't continue with this request. Please
              contact your care team if you have questions.
            </p>
          )}
        </Terminal>
      );
    case "completed":
      return (
        <Terminal
          icon={<CheckCircle2 className="w-10 h-10 text-emerald-500" />}
          title="All done — thank you"
        >
          {step.content?.length ? (
            <div className="text-left">
              <IntakeContentBlocks content={step.content} />
            </div>
          ) : null}
          <p className="text-sm text-slate-500">
            We'll be in touch shortly. Please look out for any email or text
            messages at the contact information you provided.
          </p>
          {step.redirectUrl && (
            <a
              href={step.redirectUrl}
              className="inline-block rounded-lg bg-[#e11816] hover:bg-[#c3140f] text-white px-5 py-2.5 text-[15px] font-medium"
            >
              Continue
            </a>
          )}
        </Terminal>
      );
    default:
      return null;
  }
}

export default function IntakeRuntime() {
  const token = readToken();
  const { data: step, isLoading, isError, error, refetch } = useIntakeStep(token);

  const status = (error as { response?: { status?: number } })?.response?.status;
  const code = (error as { response?: { data?: { code?: string } } })?.response
    ?.data?.code;

  // 409 = already submitted (reopened old tab). Re-GET to render the terminal.
  useEffect(() => {
    if (isError && (status === 409 || code === "CONFLICT")) refetch();
  }, [isError, status, code, refetch]);

  if (!token) {
    return (
      <Shell>
        <Terminal
          icon={<AlertCircle className="w-10 h-10 text-red-400" />}
          title="This link isn't valid"
        >
          <p className="text-sm text-slate-500">
            Ask your care team for a new one.
          </p>
        </Terminal>
      </Shell>
    );
  }

  if (isLoading || (isError && (status === 409 || code === "CONFLICT"))) {
    return (
      <Shell>
        <div className="flex flex-col items-center py-10 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="mt-3 text-sm">Loading…</p>
        </div>
      </Shell>
    );
  }

  if (isError) {
    const expired = status === 410 || code === "GONE";
    const notFound = status === 404 || code === "NOT_FOUND";
    return (
      <Shell>
        <Terminal
          icon={<AlertCircle className="w-10 h-10 text-red-400" />}
          title={
            expired
              ? "This link has expired"
              : notFound
                ? "This link isn't valid"
                : "Something went wrong"
          }
        >
          {expired || notFound ? (
            <p className="text-sm text-slate-500">
              Ask your care team for a new one.
            </p>
          ) : (
            <button
              onClick={() => refetch()}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700"
            >
              Try again
            </button>
          )}
        </Terminal>
      </Shell>
    );
  }

  return (
    <Shell>
      {step && <StepView step={step} token={token} onRetry={() => refetch()} />}
    </Shell>
  );
}
