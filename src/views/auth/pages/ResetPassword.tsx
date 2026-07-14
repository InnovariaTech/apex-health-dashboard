import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Mail } from "lucide-react";
import { useForgotPassword, useResetPassword } from "@/hooks/auth/useAuth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { extractDisplayErrorMessage } from "@/utils/errorHandler";

/**
 * Reset password — multi-step.
 *
 *   Step 1: Email → POST /api/auth/forgot-password.
 *           Always shows the neutral "if this email is registered…" copy
 *           per the auth handoff doc (don't leak whether the email exists).
 *
 *   Step 2: 6-digit OTP + new password → POST /api/auth/reset-password.
 *           Body shape is `{ email, code, newPassword }` (replaces the
 *           deprecated `{ token, newPassword }` form).
 *
 * Deep-link: the password-reset email points users at
 * `/reset-password?email=…` so they land directly on Step 2 with the
 * email already filled in. A 30s cooldown gates the "Resend code" button
 * on Step 2 to prevent OTP spam.
 */

type Step = "request" | "verify";

const RESEND_COOLDOWN_SECONDS = 30;

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailFromUrl = (searchParams.get("email") ?? "").trim();

  const forgotMutation = useForgotPassword();
  const resetMutation = useResetPassword();

  const [step, setStep] = useState<Step>(emailFromUrl ? "verify" : "request");
  const [email, setEmail] = useState(emailFromUrl);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [doneState, setDoneState] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  // If the URL changes after mount (rare — but link refreshes), keep the
  // email in sync so the form doesn't desync from the address bar.
  useEffect(() => {
    if (emailFromUrl && emailFromUrl !== email) {
      setEmail(emailFromUrl);
      setStep("verify");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailFromUrl]);

  // Cooldown ticker for the resend button — guarded so we don't spawn an
  // interval when there's no countdown active.
  useEffect(() => {
    if (resendIn <= 0) return;
    const handle = window.setInterval(() => {
      setResendIn((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => window.clearInterval(handle);
  }, [resendIn]);

  // Auto-redirect to login a few seconds after a successful reset so the
  // user can read the success copy before being bounced.
  const redirectTimer = useRef<number | null>(null);
  useEffect(() => {
    if (!doneState) return;
    redirectTimer.current = window.setTimeout(() => {
      navigate("/login", { replace: true });
    }, 2500);
    return () => {
      if (redirectTimer.current) window.clearTimeout(redirectTimer.current);
    };
  }, [doneState, navigate]);

  const startCooldown = () => setResendIn(RESEND_COOLDOWN_SECONDS);

  const handleRequest = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setNotice("");
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError("Enter the email associated with your account.");
      return;
    }
    try {
      await forgotMutation.mutateAsync({ email: trimmed });
      setEmail(trimmed);
      setStep("verify");
      setNotice("If this email is registered, a code has been sent.");
      startCooldown();
    } catch (err: unknown) {
      setError(extractDisplayErrorMessage(err));
    }
  };

  const handleResend = async () => {
    if (resendIn > 0) return;
    setError("");
    setNotice("");
    try {
      await forgotMutation.mutateAsync({ email });
      setNotice("A new code has been sent if the email is registered.");
      startCooldown();
    } catch (err: unknown) {
      setError(extractDisplayErrorMessage(err));
    }
  };

  const handleVerify = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setNotice("");

    if (code.length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await resetMutation.mutateAsync({ email, code, newPassword });
      setDoneState(true);
    } catch (err: unknown) {
      setError(extractDisplayErrorMessage(err));
    }
  };

  const goBackToRequest = () => {
    setStep("request");
    setCode("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setNotice("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background text-foreground">
      <Card className="apex-card w-full max-w-5xl overflow-hidden">
        <div className="grid md:grid-cols-2 min-h-[620px]">
          <div className="hidden md:block bg-surface-2">
            <img
              src="/images/bgpatient11.png"
              alt="Patient background"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex items-center justify-center p-6 md:p-10 bg-card">
            <div className="w-full max-w-md">
              {doneState ? (
                <SuccessPanel />
              ) : step === "request" ? (
                <RequestStep
                  email={email}
                  setEmail={setEmail}
                  error={error}
                  notice={notice}
                  isSubmitting={forgotMutation.isPending}
                  onSubmit={handleRequest}
                />
              ) : (
                <VerifyStep
                  email={email}
                  code={code}
                  setCode={setCode}
                  newPassword={newPassword}
                  setNewPassword={setNewPassword}
                  confirmPassword={confirmPassword}
                  setConfirmPassword={setConfirmPassword}
                  showPassword={showPassword}
                  toggleShowPassword={() => setShowPassword((v) => !v)}
                  error={error}
                  notice={notice}
                  isSubmitting={resetMutation.isPending}
                  isResending={forgotMutation.isPending}
                  resendIn={resendIn}
                  onSubmit={handleVerify}
                  onResend={handleResend}
                  onBack={goBackToRequest}
                  showBack={!emailFromUrl}
                />
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── Step 1: request OTP ────────────────────────────────────────────────────

function RequestStep({
  email,
  setEmail,
  error,
  notice,
  isSubmitting,
  onSubmit,
}: {
  email: string;
  setEmail: (v: string) => void;
  error: string;
  notice: string;
  isSubmitting: boolean;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <>
      <CardHeader className="space-y-3 px-0 pt-0 items-center text-center">
        <div className="w-11 h-11 rounded-[12px] bg-foreground grid place-items-center">
          <KeyRound className="w-5 h-5 text-background" />
        </div>
        <div className="apex-eyebrow">Apex MD Health</div>
        <h1 className="apex-page-title">
          Forgot your <em>password?</em>
        </h1>
        <p className="text-[13px] text-ink-2">
          Enter your email and we'll send you a 6-digit code.
        </p>
      </CardHeader>
      <CardContent className="space-y-4 px-0 pb-0 mt-6">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {notice ? (
          <Alert>
            <AlertDescription>{notice}</AlertDescription>
          </Alert>
        ) : null}

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="reset-email">Email</Label>
            <Input
              id="reset-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
              required
            />
          </div>
          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send code"}
          </Button>
        </form>

        <div className="text-center pt-2">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-[12px] text-ink-3 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to sign-in
          </Link>
        </div>
      </CardContent>
    </>
  );
}

// ─── Step 2: verify OTP + new password ──────────────────────────────────────

function VerifyStep({
  email,
  code,
  setCode,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  showPassword,
  toggleShowPassword,
  error,
  notice,
  isSubmitting,
  isResending,
  resendIn,
  onSubmit,
  onResend,
  onBack,
  showBack,
}: {
  email: string;
  code: string;
  setCode: (v: string) => void;
  newPassword: string;
  setNewPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  showPassword: boolean;
  toggleShowPassword: () => void;
  error: string;
  notice: string;
  isSubmitting: boolean;
  isResending: boolean;
  resendIn: number;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onResend: () => void;
  onBack: () => void;
  showBack: boolean;
}) {
  const resendDisabled = resendIn > 0 || isResending;
  const resendLabel =
    resendIn > 0
      ? `Resend code in ${resendIn}s`
      : isResending
        ? "Sending..."
        : "Resend code";

  return (
    <>
      <CardHeader className="space-y-3 px-0 pt-0 items-center text-center">
        <div
          className="w-11 h-11 rounded-[12px] grid place-items-center"
          style={{ backgroundColor: "var(--apex-accent-soft)" }}
        >
          <Mail className="w-5 h-5" style={{ color: "var(--apex-accent)" }} />
        </div>
        <div className="apex-eyebrow">Reset password</div>
        <h1 className="apex-page-title">
          Enter your <em>code</em>
        </h1>
        <p className="text-[13px] text-ink-2">
          Enter the 6-digit code sent to{" "}
          <span className="font-medium text-foreground">{email}</span> and
          choose a new password.
        </p>
      </CardHeader>
      <CardContent className="space-y-4 px-0 pb-0 mt-6">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {notice ? (
          <Alert>
            <AlertDescription>{notice}</AlertDescription>
          </Alert>
        ) : null}

        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="flex flex-col items-center">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={(v: string) => setCode(v.replace(/\D/g, "").slice(0, 6))}
              autoFocus
              inputMode="numeric"
              pattern="\d*"
            >
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-password">New password</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setNewPassword(e.target.value)
                }
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={toggleShowPassword}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-3 hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <Input
              id="confirm-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Re-enter your new password"
              value={confirmPassword}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setConfirmPassword(e.target.value)
              }
              required
            />
          </div>

          <Button
            className="w-full"
            type="submit"
            disabled={isSubmitting || code.length !== 6}
          >
            {isSubmitting ? "Resetting..." : "Reset password"}
          </Button>
        </form>

        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={onResend}
            disabled={resendDisabled}
            className="text-[12px] text-ink-3 hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resendLabel}
          </button>
          {showBack ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-[12px] text-ink-3 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              Change email
            </button>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-[12px] text-ink-3 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              Back to sign-in
            </Link>
          )}
        </div>
      </CardContent>
    </>
  );
}

// ─── Success terminal state ─────────────────────────────────────────────────

function SuccessPanel() {
  return (
    <>
      <CardHeader className="space-y-3 px-0 pt-0 items-center text-center">
        <div
          className="w-11 h-11 rounded-[12px] grid place-items-center"
          style={{ backgroundColor: "var(--apex-accent-soft)" }}
        >
          <CheckCircle2
            className="w-5 h-5"
            style={{ color: "var(--apex-accent)" }}
          />
        </div>
        <div className="apex-eyebrow">All set</div>
        <h1 className="apex-page-title">
          Password <em>updated</em>
        </h1>
        <p className="text-[13px] text-ink-2">
          You can now sign in with your new password. Redirecting…
        </p>
      </CardHeader>
      <CardContent className="space-y-4 px-0 pb-0 mt-6">
        <Link to="/login" className="block">
          <Button className="w-full">Go to sign-in</Button>
        </Link>
      </CardContent>
    </>
  );
}
