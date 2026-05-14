import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSignupMutation } from "@/hooks/auth/useAuth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { extractApiErrorDetails, extractDisplayErrorMessage } from "@/utils/errorHandler";

export default function Signup() {
  const navigate = useNavigate();
  const signupMutation = useSignupMutation();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    try {
      await signupMutation.mutateAsync(form);
      navigate("/");
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
          <div className="w-11 h-11 rounded-[12px] bg-foreground grid place-items-center">
            <span className="font-serif text-xl font-semibold text-background leading-none">
              A
            </span>
          </div>
          <div className="apex-eyebrow">Apex MD Health</div>
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
              <Label htmlFor="full_name">Full name</Label>
              <Input
                id="full_name"
                placeholder="Jane Smith"
                value={form.full_name}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setForm((p) => ({ ...p, full_name: e.target.value }))
                }
                required
              />
            </div>
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
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                placeholder="+1 (555) 123-4567"
                value={form.phone}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setForm((p) => ({ ...p, phone: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 6 characters"
                value={form.password}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setForm((p) => ({ ...p, password: e.target.value }))
                }
                required
              />
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
                required
              />
            </div>
            <Button
              className="w-full"
              type="submit"
              disabled={signupMutation.isPending}
            >
              {signupMutation.isPending ? "Creating account..." : "Create account"}
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
