import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, X } from "lucide-react";
import { useSignupMutation } from "@/hooks/auth/useAuth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  PASSWORD_RULES,
  isPasswordValid,
} from "@/views/auth/utils/passwordRules";
import {
  extractApiErrorDetails,
  extractDisplayErrorMessage,
} from "@/utils/errorHandler";

export default function Signup() {
  const navigate = useNavigate();
  const signupMutation = useSignupMutation();
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  // Rule feedback appears once the user starts typing, so an untouched form
  // isn't a wall of red crosses.
  const passwordTouched = form.password.length > 0;
  const passwordOk = isPasswordValid(form.password);
  const confirmTouched = form.confirmPassword.length > 0;
  const passwordsMatch =
    form.password === form.confirmPassword && form.password.length > 0;
  const canSubmit =
    form.email.trim().length > 0 && passwordOk && passwordsMatch;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!passwordOk) {
      setError("Your password doesn't meet all the requirements yet.");
      return;
    }
    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await signupMutation.mutateAsync({
        email: form.email.trim(),
        password: form.password,
      });
      // Signup issues no CareValidate portal session — the user has to sign in
      // to get one, so hand off to /login rather than the dashboard.
      navigate("/login", {
        replace: true,
        state: { notice: "Account created. Please sign in to continue." },
      });
    } catch (err: unknown) {
      const details = extractApiErrorDetails(err);
      console.error("Signup failed", details);
      const message = extractDisplayErrorMessage(err);
      if (message.toLowerCase().includes("already")) {
        setError("That email is already registered.");
      } else {
        setError(message || "Unable to create account right now.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background text-foreground">
      <Card className="apex-card w-full max-w-md">
        <CardHeader className="space-y-3 items-center text-center">
          <img
            src="/images/apex-md-logo.png"
            alt="Apex MD Health"
            className="h-9 w-auto"
          />
          <h1 className="apex-page-title">
            Create <em>account</em>
          </h1>
          <p className="text-[13px] text-ink-2">
            Sign up to start using the dashboard
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <form className="space-y-4" onSubmit={handleSubmit}>
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
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="Choose a strong password"
                value={form.password}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setForm((p) => ({ ...p, password: e.target.value }))
                }
                aria-describedby="password-rules"
                required
              />

              {/* Live requirement checklist — re-evaluates on every keystroke. */}
              <ul
                id="password-rules"
                aria-live="polite"
                className="space-y-1.5 pt-2 m-0 list-none"
              >
                {PASSWORD_RULES.map((rule) => (
                  <RuleRow
                    key={rule.id}
                    label={rule.label}
                    met={rule.test(form.password)}
                    touched={passwordTouched}
                  />
                ))}
              </ul>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                placeholder="Re-enter your password"
                value={form.confirmPassword}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setForm((p) => ({ ...p, confirmPassword: e.target.value }))
                }
                aria-describedby="confirm-rule"
                required
              />
              <ul
                id="confirm-rule"
                aria-live="polite"
                className="space-y-1.5 pt-2 m-0 list-none"
              >
                <RuleRow
                  label="Passwords match"
                  met={passwordsMatch}
                  touched={confirmTouched}
                />
              </ul>
            </div>

            <Button
              className="w-full"
              type="submit"
              disabled={signupMutation.isPending || !canSubmit}
            >
              {signupMutation.isPending
                ? "Creating account..."
                : "Create account"}
            </Button>
          </form>

          <Separator />

          <p className="text-[13px] text-center text-ink-2">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * One requirement line. Before the field is touched it stays neutral; after
 * that it reads green (met) or muted-red (not yet met).
 */
function RuleRow({
  label,
  met,
  touched,
}: {
  label: string;
  met: boolean;
  touched: boolean;
}) {
  const color = !touched
    ? "var(--ink-3)"
    : met
      ? "var(--opt-d)"
      : "var(--ink-2)";

  return (
    <li
      className="flex items-center gap-2 font-sans"
      style={{ fontSize: 12, color, letterSpacing: "-0.005em" }}
    >
      <span
        className="grid place-items-center rounded-full shrink-0"
        style={{
          width: 15,
          height: 15,
          background: !touched
            ? "var(--surface-2)"
            : met
              ? "var(--opt-soft)"
              : "transparent",
          border: touched && !met ? "1px solid var(--line)" : "none",
        }}
      >
        {touched && met ? (
          <Check className="w-2.5 h-2.5" strokeWidth={3} />
        ) : touched ? (
          <X className="w-2.5 h-2.5" strokeWidth={2.5} />
        ) : null}
      </span>
      {label}
    </li>
  );
}
