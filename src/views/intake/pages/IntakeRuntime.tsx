import { useEffect } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useIntakeStep } from "@/hooks/intake/useIntake";
import FactsStepView from "@/views/intake/components/FactsStep";
import QuestionStepView from "@/views/intake/components/QuestionStep";
import IntakeContentBlocks from "@/views/intake/components/IntakeContentBlocks";
import type { IntakeStep } from "@/types/intake/intake_types";

/**
 * The patient intake runtime. Mounted pre-auth for `/intake/:token` — the token
 * is the only credential. One component switches on `data.kind`; every endpoint
 * returns the same union. `GET` on mount is the source of truth.
 */

function readToken(): string {
  if (typeof window === "undefined") return "";
  const raw =
    window.location.pathname.replace(/^\/intake\//, "").split(/[/?#]/)[0] ?? "";
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Navbar — brand logo with a red accent underline */}
      <div className="h-16 bg-white border-b-[3px] border-[#e11816] flex items-center px-5 shadow-sm">
        <img
          src="/images/apex-md-logo.png"
          alt="APEX MD"
          className="h-8 w-auto"
        />
      </div>
      <div className="flex-1 flex justify-center px-4 py-8">
        <div className="w-full max-w-xl">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
            {/* Logo at the top of the form itself */}
            <div className="flex justify-center pb-5 mb-6 border-b border-slate-100">
              <img
                src="/images/apex-md-logo.png"
                alt="APEX MD"
                className="h-9 w-auto"
              />
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

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

function StepView({ step, token }: { step: IntakeStep; token: string }) {
  switch (step.kind) {
    case "facts":
      return <FactsStepView step={step} token={token} />;
    case "question":
      return <QuestionStepView step={step} token={token} />;
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

  return <Shell>{step && <StepView step={step} token={token} />}</Shell>;
}
