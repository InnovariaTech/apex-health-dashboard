import { useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import IntakeShell from "@/views/intake/components/IntakeShell";
import { ThemedIdentityField, useIdentityPlaceholder } from "@/components/theme/ThemeScope";
import { usePublicIntakeForm, useStartPublicIntake } from "@/hooks/intake/useIntake";
import { saveIntakeToken } from "@/lib/intakeToken";
import type { IdentityThemeField } from "@/types/intake/theme_types";

/**
 * The public storefront door: `/intake/public?formKey=…&productId=…`.
 *
 * A stranger fills an identity block, we mint a token (`POST
 * /api/intake/public/start`), persist it, and hand off to the normal walk at
 * `/intake/<token>`. Every refusal is a flat 404 → one "not available" message.
 *
 * Drawn with the same themed parts as the walk. Its title and theme come from
 * `GET /api/intake/public/:formKey` (partner from this page's address, plus the form's own theme),
 * so it looks like the questions after it; each field also wears `identity.<field>`.
 * See `branding/theme-rules.md` § identity.
 */

/** A labelled details field: the theme's question parts plus that field's `identity` styles. */
function Field({
  field,
  label,
  optional,
  type = "text",
  value,
  onChange,
  defaultPlaceholder = "",
}: {
  field: IdentityThemeField;
  label: string;
  optional?: boolean;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  defaultPlaceholder?: string;
}) {
  const placeholder = useIdentityPlaceholder(field, defaultPlaceholder);
  const id = `identity-${field}`;
  return (
    <ThemedIdentityField field={field} className="gap-1.5">
      <label className="apx-question-text" htmlFor={id}>
        {label}
        {optional && <span className="opacity-60" style={{ fontWeight: 400 }}> (optional)</span>}
      </label>
      <input
        id={id}
        type={type}
        className="apx-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || undefined}
      />
    </ThemedIdentityField>
  );
}

function readQuery(): { formKey: string; productId: string } {
  if (typeof window === "undefined") return { formKey: "", productId: "" };
  const q = new URLSearchParams(window.location.search);
  return { formKey: q.get("formKey") ?? "", productId: q.get("productId") ?? "" };
}

export default function PublicIntakeStart() {
  const { formKey, productId } = readQuery();
  const start = useStartPublicIntake();
  const form = usePublicIntakeForm(formKey);
  const theme = form.data?.theme ?? null;
  const title = form.data?.title ?? null;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notAvailable, setNotAvailable] = useState(!formKey);

  const valid =
    firstName.trim() && lastName.trim() && dob && /.+@.+\..+/.test(email);

  const submit = async () => {
    setError(null);
    try {
      const res = await start.mutateAsync({
        formKey,
        ...(productId ? { productId } : {}),
        identity: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          dob,
          email: email.trim(),
          ...(phone.trim() ? { phone: phone.trim() } : {}),
        },
      });
      // Persist so a refresh keeps the walk, then hand off to the runtime.
      saveIntakeToken(res.token);
      window.location.assign(`/intake/${encodeURIComponent(res.token)}`);
    } catch (err) {
      // The axios layer normalises errors to `{ status, … }`; `response` only exists on a raw one.
      const e = err as { status?: number; response?: { status?: number } } | null;
      const status = e?.status ?? e?.response?.status;
      if (status === 404) setNotAvailable(true);
      else
        setError("Something went wrong. Please try again.");
    }
  };

  // Same refusals as `/start`: unknown, unpublished, not public, Healthie-sold, another partner's.
  const formStatus = (form.error as { status?: number; response?: { status?: number } } | null)?.status
    ?? (form.error as { response?: { status?: number } } | null)?.response?.status;

  if (notAvailable || formStatus === 404 || formStatus === 400) {
    return (
      <IntakeShell>
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="w-10 h-10 opacity-40" />
          <h2 className="apx-question-text" style={{ fontSize: "1.2em" }}>
            This form is not available
          </h2>
          <p className="apx-help-text">
            Please check the link, or contact us if you think this is a mistake.
          </p>
        </div>
      </IntakeShell>
    );
  }

  // Wait for the theme rather than flash the Apex look first. Any other failure falls back to it.
  if (form.isLoading) {
    return (
      <IntakeShell>
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin opacity-40" />
        </div>
      </IntakeShell>
    );
  }

  return (
    <IntakeShell theme={theme} title={title}>
      <div>
        <h2 className="apx-question-text" style={{ fontSize: "1.2em" }}>
          Let's get started
        </h2>
        <p className="apx-help-text">
          A few details before your questions. This lets us save your progress
          and follow up if needed.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field field="firstName" label="First name" value={firstName} onChange={setFirstName} />
        <Field field="lastName" label="Last name" value={lastName} onChange={setLastName} />
      </div>

      <Field field="dob" label="Date of birth" type="date" value={dob} onChange={setDob} />

      <Field
        field="email"
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        defaultPlaceholder="you@example.com"
      />

      <Field
        field="phone"
        label="Phone"
        optional
        type="tel"
        value={phone}
        onChange={setPhone}
        defaultPlaceholder="+1 512 555 0100"
      />

      {error && <p className="apx-error" role="alert">{error}</p>}

      <div className="flex">
        <button onClick={submit} disabled={!valid || start.isPending} className="apx-button-primary flex-1">
          {start.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Start
        </button>
      </div>
    </IntakeShell>
  );
}
