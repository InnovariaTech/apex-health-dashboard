import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Eye, EyeOff, Mail } from "lucide-react";
import { useLoginMutation, useVerifyOtp } from "@/hooks/auth/useAuth";
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
import { queryKeys } from "@/hooks/queryKeys";
import { extractDisplayErrorMessage } from "@/utils/errorHandler";
import type { AuthUser } from "@/types/auth_types";

type Step = "credentials" | "otp";

export default function Login() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const loginMutation = useLoginMutation();
  const verifyMutation = useVerifyOtp();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // OTP step state — populated only when the login response carries
  // `requiredOtp: true`. We hold the authenticated user locally so that on
  // verify-success we can hydrate the auth query without a round-trip.
  const [step, setStep] = useState<Step>("credentials");
  const [pendingUser, setPendingUser] = useState<AuthUser | null>(null);
  const [otp, setOtp] = useState("");

  const handleCredentialsSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    try {
      const result = await loginMutation.mutateAsync(form);
      if (result.requiredOtp) {
        // Stay on this screen, switch to OTP step. The user is *not* visible
        // to AuthContext yet — useLoginMutation deliberately skipped the
        // setQueryData when requiredOtp=true.
        setPendingUser(result.user);
        setOtp("");
        setStep("otp");
        return;
      }
      navigate("/Dashboard");
    } catch (err: unknown) {
      setError(extractDisplayErrorMessage(err));
    }
  };

  const handleOtpSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (otp.length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }

    try {
      const { otpVerified } = await verifyMutation.mutateAsync({ code: otp });
      if (!otpVerified) {
        setError("That code didn't verify. Please try again.");
        return;
      }
      // Hydrate the auth query so AuthenticatedApp swaps to the in-app
      // routes immediately on the next render (avoids a flicker while
      // `me` refetches in the background).
      if (pendingUser) {
        queryClient.setQueryData(queryKeys.auth.user(), pendingUser);
      }
      navigate("/Dashboard");
    } catch (err: unknown) {
      setError(extractDisplayErrorMessage(err));
    }
  };

  const goBackToCredentials = () => {
    setStep("credentials");
    setOtp("");
    setPendingUser(null);
    setError("");
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
              {step === "credentials" ? (
                <>
                  <CardHeader className="space-y-3 px-0 pt-0 items-center text-center">
                    <div className="w-11 h-11 rounded-[12px] bg-foreground grid place-items-center">
                      <span className="font-serif text-xl font-semibold text-background leading-none">
                        A
                      </span>
                    </div>
                    <div className="apex-eyebrow">Apex MD Health</div>
                    <h1 className="apex-page-title">
                      Welcome <em>back</em>
                    </h1>
                    <p className="text-[13px] text-ink-2">
                      Sign in to access your dashboard
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4 px-0 pb-0 mt-6">
                    {error ? (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    ) : null}

                    <form className="space-y-4" onSubmit={handleCredentialsSubmit}>
                      <div className="space-y-1.5">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          autoComplete="email"
                          placeholder="you@example.com"
                          value={form.email}
                          onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            setForm((p) => ({ ...p, email: e.target.value }))
                          }
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            placeholder="Enter your password"
                            value={form.password}
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                              setForm((p) => ({ ...p, password: e.target.value }))
                            }
                            required
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            aria-label={
                              showPassword ? "Hide password" : "Show password"
                            }
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
                      <Button
                        className="w-full"
                        type="submit"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? "Signing in..." : "Sign in"}
                      </Button>
                    </form>
                  </CardContent>
                </>
              ) : (
                <>
                  <CardHeader className="space-y-3 px-0 pt-0 items-center text-center">
                    <div
                      className="w-11 h-11 rounded-[12px] grid place-items-center"
                      style={{ backgroundColor: "var(--apex-accent-soft)" }}
                    >
                      <Mail
                        className="w-5 h-5"
                        style={{ color: "var(--apex-accent)" }}
                      />
                    </div>
                    <div className="apex-eyebrow">Verification</div>
                    <h1 className="apex-page-title">
                      Check your <em>email</em>
                    </h1>
                    <p className="text-[13px] text-ink-2">
                      Enter the 6-digit code we just sent to{" "}
                      <span className="font-medium text-foreground">
                        {form.email}
                      </span>
                      .
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4 px-0 pb-0 mt-6">
                    {error ? (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    ) : null}

                    <form
                      className="space-y-5 flex flex-col items-center"
                      onSubmit={handleOtpSubmit}
                    >
                      <InputOTP
                        maxLength={6}
                        value={otp}
                        onChange={(v: string) =>
                          setOtp(v.replace(/\D/g, "").slice(0, 6))
                        }
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

                      <Button
                        className="w-full"
                        type="submit"
                        disabled={verifyMutation.isPending || otp.length !== 6}
                      >
                        {verifyMutation.isPending
                          ? "Verifying..."
                          : "Verify and continue"}
                      </Button>
                    </form>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={goBackToCredentials}
                        className="inline-flex items-center gap-1.5 text-[12px] text-ink-3 hover:text-foreground transition-colors"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        Back to sign-in
                      </button>
                    </div>
                  </CardContent>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
