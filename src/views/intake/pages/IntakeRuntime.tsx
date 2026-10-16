import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, CreditCard, Loader2 } from "lucide-react";
import { useBack, useChooseCheckout, useIntakeManifest, useIntakeStep } from "@/hooks/intake/useIntake";
import FactsStepView from "@/views/intake/components/FactsStep";
import QuestionStepView from "@/views/intake/components/QuestionStep";
import IntakeContentBlocks from "@/views/intake/components/IntakeContentBlocks";
import IntakeShell from "@/views/intake/components/IntakeShell";
import { loadIntakeToken, saveIntakeToken } from "@/lib/intakeToken";
import { getPendingIntakes } from "@/api/intake/intake";
import { announceIntakeCompleted } from "@/lib/intakeChannel";
import type { CheckoutOption, CheckoutStep, IntakeStep } from "@/types/intake/intake_types";

/**
 * The patient intake runtime. Mounted pre-auth for `/intake/:token` — the token
 * is the only credential. One component switches on `data.kind`; every endpoint
 * returns the same union. `GET` on mount is the source of truth.
 *
 * The walk wears the theme from its manifest (the partner it was started through, else the form's
 * own); every screen is drawn with the theme's `apx-*` parts.
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
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="flex justify-center">{icon}</div>
      <h2 className="apx-question-text" style={{ fontSize: "1.2em" }}>{title}</h2>
      {children}
    </div>
  );
}

/** "$299", "$299 / month for 3 months", "$897 · covers 3 months". Display only; Stripe charges the real amount. */
function planPriceLine(o: CheckoutOption): string {
  if (o.cost == null) return "";
  const n = Number(o.cost);
  const amount = `${o.currency === "USD" ? "$" : `${o.currency} `}${Number.isInteger(n) ? n : n.toFixed(2)}`;
  if (o.billingMode === "per_cycle") return `${amount} / month${o.totalCycles ? ` for ${o.totalCycles} months` : ""}`;
  return o.totalCycles && o.totalCycles > 1 ? `${amount} · covers ${o.totalCycles} months` : amount;
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
  const choose = useChooseCheckout(token);
  const options = step.options ?? [];
  const many = options.length > 1;
  // With several plans the patient picks one; the server then answers with that plan's Stripe link.
  const [picked, setPicked] = useState<string | null>(null);
  const [changing, setChanging] = useState(false);
  const [chooseError, setChooseError] = useState<string | null>(null);
  const choosing = many && (!step.checkoutUrl || changing);
  const chosen = many && step.checkoutUrl ? options.find((o) => o.checkoutFormId === picked) ?? null : null;

  const confirmPlan = async () => {
    if (!picked) return;
    setChooseError(null);
    try {
      await choose.mutateAsync(picked);
      setChanging(false);
    } catch {
      setChooseError("That plan couldn't be selected. Please try again.");
    }
  };

  return (
    <>
      <IntakeContentBlocks content={step.content} />
      <div className="flex flex-col items-center gap-2 text-center">
        <CreditCard className="w-9 h-9" style={{ color: "var(--apx-color-primary, #d30704)" }} />
        <h2 className="apx-question-text" style={{ fontSize: "1.2em" }}>
          {choosing ? "Choose your plan" : "One last step — payment"}
        </h2>
        <p className="apx-help-text">
          {choosing
            ? "Your answers are saved. Pick the plan that suits you, then continue to secure payment."
            : "Your answers are saved. Complete payment to finish and send your intake for review."}
        </p>
      </div>

      {choosing ? (
        <>
          <div className="apx-plans" role="radiogroup" aria-label="Plans">
            {options.map((o) => {
              const on = picked === o.checkoutFormId;
              return (
                <button
                  key={o.checkoutFormId}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setPicked(o.checkoutFormId)}
                  className={`apx-plan ${on ? "apx-plan-selected" : ""}`}
                >
                  <span
                    className="mt-[3px] grid h-4 w-4 shrink-0 place-items-center rounded-full border-2"
                    style={{ borderColor: "currentColor", opacity: on ? 1 : 0.45 }}
                  >
                    {on && <span className="h-2 w-2 rounded-full" style={{ background: "currentColor" }} />}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
                    <span className="font-semibold">{o.title}</span>
                    {o.description && <span className="apx-help-text" style={{ marginBottom: 0 }}>{o.description}</span>}
                  </span>
                  {planPriceLine(o) && <span className="shrink-0 font-semibold">{planPriceLine(o)}</span>}
                </button>
              );
            })}
          </div>
          {chooseError && <p className="apx-error" role="alert">{chooseError}</p>}
          <div className="flex">
            <button
              onClick={() => void confirmPlan()}
              disabled={!picked || choose.isPending}
              className="apx-button-primary flex-1"
            >
              {choose.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Continue to payment
            </button>
          </div>
        </>
      ) : (
        <>
          {chosen && (
            <div className="apx-plan apx-plan-selected" style={{ cursor: "default" }}>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="font-semibold">{chosen.title}</span>
                {planPriceLine(chosen) && <span className="apx-help-text" style={{ marginBottom: 0 }}>{planPriceLine(chosen)}</span>}
              </span>
              <button type="button" onClick={() => setChanging(true)} className="apx-help-text shrink-0 underline-offset-2 hover:underline">
                Change plan
              </button>
            </div>
          )}
      {step.checkoutUrl ? (
        <div className="flex">
          <a href={step.checkoutUrl} className="apx-button-primary flex-1">
            Proceed to secure payment
          </a>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="apx-help-text inline-flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Preparing your secure
            payment…
          </p>
          <button onClick={onRetry} className="apx-button-secondary">
            Try again
          </button>
        </div>
      )}
        </>
      )}

      <div className="flex justify-center">
        <button
          onClick={() => back.mutate()}
          disabled={back.isPending}
          className="apx-help-text underline-offset-2 hover:underline disabled:opacity-50"
        >
          ← Change my answers
        </button>
      </div>

      <p className="apx-help-text text-center" style={{ fontSize: "11.5px" }}>
        Payment is processed securely by Stripe. You won't be charged twice.
      </p>
    </>
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
          icon={<AlertCircle className="w-10 h-10 opacity-40" />}
          title="We're unable to proceed"
        >
          {step.content?.length ? (
            <div className="w-full text-left">
              <IntakeContentBlocks content={step.content} />
            </div>
          ) : (
            <p className="apx-help-text">
              Based on your answers, we can't continue with this request. Please
              contact your care team if you have questions.
            </p>
          )}
        </Terminal>
      );
    case "completed":
      return (
        <Terminal
          icon={<CheckCircle2 className="w-10 h-10" style={{ color: "var(--apx-color-success, #2e7d5a)" }} />}
          title="All done — thank you"
        >
          {step.content?.length ? (
            <div className="w-full text-left">
              <IntakeContentBlocks content={step.content} />
            </div>
          ) : null}
          <p className="apx-help-text">
            We'll be in touch shortly. Please look out for any email or text
            messages at the contact information you provided.
          </p>
          {step.redirectUrl && (
            <a href={step.redirectUrl} className="apx-button-primary">
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
  // Title and theme for the frame. Not waited on: the form works (in the Apex look) without it.
  const manifest = useIntakeManifest(token);
  const theme = manifest.data?.theme ?? null;
  const title = manifest.data?.title ?? null;

  // The app's axios layer hands errors over normalised — `{ status, code, details }` — so read
  // those first; `response` is only there for a raw axios error.
  const err = error as
    | { status?: number; code?: string; response?: { status?: number; data?: { code?: string } } }
    | null;
  const status = err?.status ?? err?.response?.status;
  const code = err?.code ?? err?.response?.data?.code;

  // A link opened from "Outstanding forms" carries its submission (`?s=`). Each read of the
  // pending list retires older links, so one can die while its tab is open; the answers are saved
  // server-side, so a signed-in patient just gets a fresh link for the same form and carries on.
  const submissionId =
    typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("s") : null;
  const [renewing, setRenewing] = useState<"idle" | "trying" | "failed">("idle");
  useEffect(() => {
    if (!isError || status !== 404 || !submissionId || renewing !== "idle") return;
    setRenewing("trying");
    getPendingIntakes()
      .then((intakes) => {
        const same = intakes.find((i) => i.submissionId === submissionId);
        if (!same) return setRenewing("failed");
        saveIntakeToken(same.token);
        window.location.replace(
          `/intake/${encodeURIComponent(same.token)}?s=${encodeURIComponent(submissionId)}`,
        );
      })
      .catch(() => setRenewing("failed"));
  }, [isError, status, submissionId, renewing]);

  // Finished: let a dashboard open in another tab drop it from "Outstanding forms".
  useEffect(() => {
    if (step?.kind === "completed") announceIntakeCompleted(step.submissionId);
  }, [step]);

  // 409 = already submitted (reopened old tab). Re-GET to render the terminal.
  useEffect(() => {
    if (isError && (status === 409 || code === "CONFLICT")) refetch();
  }, [isError, status, code, refetch]);

  if (!token) {
    return (
      <IntakeShell theme={theme} title={title}>
        <Terminal
          icon={<AlertCircle className="w-10 h-10" style={{ color: "var(--apx-color-error, #b23a3a)" }} />}
          title="This link isn't valid"
        >
          <p className="apx-help-text">
            Ask your care team for a new one.
          </p>
        </Terminal>
      </IntakeShell>
    );
  }

  if (
    isLoading ||
    (isError && (status === 409 || code === "CONFLICT")) ||
    renewing === "trying" ||
    (isError && status === 404 && submissionId && renewing === "idle")
  ) {
    return (
      <IntakeShell theme={theme} title={title}>
        <div className="flex flex-col items-center py-10 opacity-60">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="apx-help-text mt-3">Loading…</p>
        </div>
      </IntakeShell>
    );
  }

  if (isError) {
    const expired = status === 410 || code === "GONE";
    const notFound = status === 404 || code === "NOT_FOUND";
    return (
      <IntakeShell theme={theme} title={title}>
        <Terminal
          icon={<AlertCircle className="w-10 h-10" style={{ color: "var(--apx-color-error, #b23a3a)" }} />}
          title={
            expired
              ? "This link has expired"
              : notFound
                ? "This link isn't valid"
                : "Something went wrong"
          }
        >
          {expired || notFound ? (
            <p className="apx-help-text">
              Ask your care team for a new one.
            </p>
          ) : (
            <button onClick={() => refetch()} className="apx-button-secondary">
              Try again
            </button>
          )}
        </Terminal>
      </IntakeShell>
    );
  }

  return (
    <IntakeShell theme={theme} title={title}>
      {step && <StepView step={step} token={token} onRetry={() => refetch()} />}
    </IntakeShell>
  );
}
