// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { useTreatmentBundleById } from "@/hooks/care-validate/useTreatments";
import { useCreateCase } from "@/hooks/care-validate/useCases";
import { useProfile } from "@/hooks/care-validate/useProfile";
import { useAuthUser } from "@/hooks/auth/useAuth";
import {
  chunkQuestions,
  encodeAnswer,
  parseIntakeForm,
  US_STATES,
  validateAnswer,
  type AnswerValue,
  type IntakeFormSchema,
  type IntakeQuestion,
} from "@/views/patient/utils/intakeFormUtils";
import type { TreatmentBundleItem } from "@/types/care-validate/treatments_types";
import type {
  CaseShippingAddress,
  CreateCaseBody,
  CreateCaseQuestionAnswer,
} from "@/types/care-validate/case_types";
import IntakeQuestionInput from "./IntakeQuestion";

const EMPTY_IDENTITY = {
  firstName: "",
  lastName: "",
  email: "",
  dob: "",
  gender: "MALE",
  phoneNumber: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "US",
};

const QUESTIONS_PER_STEP = 3;

interface IntakeFormDialogProps {
  bundle: TreatmentBundleItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function IntakeFormDialog({
  bundle,
  open,
  onOpenChange,
}: IntakeFormDialogProps) {
  const navigate = useNavigate();
  const profileQuery = useProfile();
  const authQuery = useAuthUser();
  const createCase = useCreateCase();
  const bundleQuery = useTreatmentBundleById(bundle?.id ?? "", {
    includeIntakeForm: true,
  });

  const detailBundle = bundleQuery.data ?? bundle;
  const schema = useMemo<IntakeFormSchema | null>(() => {
    if (!detailBundle?.raw) return null;
    return parseIntakeForm(detailBundle.raw);
  }, [detailBundle]);

  const pages = useMemo(
    () => (schema ? chunkQuestions(schema.questions, QUESTIONS_PER_STEP) : []),
    [schema]
  );

  /* ── Identity step state ───────────────────────────────────────────────── */
  const [identity, setIdentity] = useState(EMPTY_IDENTITY);
  useEffect(() => {
    if (!open) return;
    const p = profileQuery.data ?? {};
    const u = authQuery.data ?? {};
    setIdentity((prev) => ({
      ...prev,
      firstName: prev.firstName || String(p.firstName ?? ""),
      lastName: prev.lastName || String(p.lastName ?? ""),
      email: prev.email || String(p.email ?? u.email ?? ""),
      dob: prev.dob || normalizeDob(p.dob),
      gender: prev.gender || (p.gender ? String(p.gender) : "MALE"),
      phoneNumber: prev.phoneNumber || String(p.phoneNumber ?? ""),
      addressLine1: prev.addressLine1 || String(p.address ?? ""),
      addressLine2: prev.addressLine2 || String(p.address2 ?? ""),
      city: prev.city || String(p.city ?? ""),
      state: prev.state || normalizeState(p.state),
      postalCode: prev.postalCode || String(p.postalCode ?? ""),
      country: prev.country || String(p.country ?? "US"),
    }));
  }, [open, profileQuery.data, authQuery.data]);

  /* ── Answer state ──────────────────────────────────────────────────────── */
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [questionErrors, setQuestionErrors] = useState<Record<string, string>>({});
  const [identityErrors, setIdentityErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);

  // Reset state when the dialog closes.
  useEffect(() => {
    if (!open) {
      setStep(0);
      setAnswers({});
      setQuestionErrors({});
      setIdentityErrors({});
      setIdentity(EMPTY_IDENTITY);
    }
  }, [open]);

  // Reset to first step whenever a different bundle is opened.
  useEffect(() => {
    if (open) setStep(0);
  }, [open, bundle?.id]);

  /* ── Step navigation ───────────────────────────────────────────────────── */
  const totalSteps = 1 + pages.length + 1; // identity + question pages + review
  const isIdentityStep = step === 0;
  const isReviewStep = step === totalSteps - 1;
  const questionPageIndex = step - 1;
  const currentQuestions: IntakeQuestion[] = isIdentityStep || isReviewStep
    ? []
    : pages[questionPageIndex] ?? [];

  const validateIdentity = (): boolean => {
    const errors: Record<string, string> = {};
    if (!identity.firstName.trim()) errors.firstName = "Required";
    if (!identity.lastName.trim()) errors.lastName = "Required";
    if (!identity.email.trim()) errors.email = "Required";
    if (!identity.dob.trim()) errors.dob = "Required";
    if (!identity.phoneNumber.trim()) errors.phoneNumber = "Required";
    if (!identity.addressLine1.trim()) errors.addressLine1 = "Required";
    if (!identity.city.trim()) errors.city = "Required";
    if (!identity.state.trim()) errors.state = "Required";
    if (!identity.postalCode.trim()) errors.postalCode = "Required";
    setIdentityErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateCurrentQuestions = (): boolean => {
    const errors: Record<string, string> = {};
    for (const q of currentQuestions) {
      const v = answers[q.questionId];
      const res = validateAnswer(q, v);
      if (!res.ok) errors[q.questionId] = res.error ?? "Invalid answer.";
    }
    setQuestionErrors((prev) => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  const goNext = () => {
    if (isIdentityStep) {
      if (!validateIdentity()) return;
    } else if (!isReviewStep) {
      if (!validateCurrentQuestions()) return;
    }
    setStep((s) => Math.min(s + 1, totalSteps - 1));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  /* ── Final submit ──────────────────────────────────────────────────────── */
  const allQuestionsValid = (): boolean => {
    if (!schema) return true;
    const errors: Record<string, string> = {};
    for (const q of schema.questions) {
      const v = answers[q.questionId];
      const res = validateAnswer(q, v);
      if (!res.ok) errors[q.questionId] = res.error ?? "Invalid answer.";
    }
    setQuestionErrors(errors);
    if (Object.keys(errors).length > 0) {
      const firstBadIdx = pages.findIndex((page) =>
        page.some((q) => errors[q.questionId])
      );
      if (firstBadIdx >= 0) setStep(firstBadIdx + 1);
      return false;
    }
    return true;
  };

  const buildBody = (): CreateCaseBody | null => {
    if (!schema) return null;
    const encoded: CreateCaseQuestionAnswer[] = [];
    for (const q of schema.questions) {
      const enc = encodeAnswer(q, answers[q.questionId]);
      if (enc) encoded.push(enc);
    }

    const shippingAddress: CaseShippingAddress = {
      addressLine1: identity.addressLine1.trim(),
      city: identity.city.trim(),
      state: identity.state.trim(),
      country: identity.country.trim() || "US",
      postalCode: identity.postalCode.trim(),
      ...(identity.addressLine2.trim()
        ? { addressLine2: identity.addressLine2.trim() }
        : {}),
    };

    const body: CreateCaseBody = {
      firstName: identity.firstName.trim(),
      lastName: identity.lastName.trim(),
      email: identity.email.trim(),
      dob: identity.dob.trim() || undefined,
      gender: (identity.gender as "MALE" | "FEMALE") || undefined,
      phoneNumber: identity.phoneNumber.trim(),
      questions: encoded,
      shippingAddress,
      ...(schema.id
        ? { formId: schema.id }
        : { formTitle: schema.title || `${detailBundle?.name ?? "Treatment"} intake` }),
      ...(detailBundle?.id ? { productBundleId: detailBundle.id } : {}),
    };
    return body;
  };

  const handleSubmit = async () => {
    if (!validateIdentity()) {
      setStep(0);
      return;
    }
    if (!allQuestionsValid()) return;

    const body = buildBody();
    if (!body) {
      toast({
        title: "This bundle has no intake form yet",
        description: "Please check back shortly.",
        variant: "destructive",
      });
      return;
    }

    try {
      const created = await createCase.mutateAsync(body);
      toast({
        title: "Case opened",
        description: `Reference: ${created.shortId || created.id}`,
      });
      onOpenChange(false);
      if (created.id) navigate(`/MyCases/${created.id}`);
    } catch (err) {
      toast({
        title: "Couldn't open the case",
        description: extractMessage(err),
        variant: "destructive",
      });
    }
  };

  /* ── Render ────────────────────────────────────────────────────────────── */
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="apex-eyebrow mb-1.5">{detailBundle?.name ?? "Intake"}</div>
          <DialogTitle className="font-serif text-2xl font-medium tracking-[-0.02em]">
            {schema?.title || "Start your intake"}
          </DialogTitle>
          {schema?.description && (
            <p className="text-[13px] text-muted-foreground mt-1">
              {schema.description}
            </p>
          )}
        </DialogHeader>

        <Stepper current={step} total={totalSteps} />

        <div className="mt-2 min-h-[260px]">
          {bundleQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-3/4" />
            </div>
          ) : isIdentityStep ? (
            <IdentityStep
              identity={identity}
              setIdentity={setIdentity}
              errors={identityErrors}
            />
          ) : isReviewStep ? (
            <ReviewStep
              identity={identity}
              schema={schema}
              answers={answers}
            />
          ) : !schema ? (
            <NoFormFallback />
          ) : (
            <div className="space-y-5">
              {currentQuestions.map((q) => (
                <IntakeQuestionInput
                  key={q.questionId}
                  question={q}
                  value={answers[q.questionId]}
                  onChange={(v) =>
                    setAnswers((prev) => ({ ...prev, [q.questionId]: v }))
                  }
                  error={questionErrors[q.questionId]}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 pt-4 mt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={goBack}
            disabled={step === 0 || createCase.isPending}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Button>

          {isReviewStep ? (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={createCase.isPending}
            >
              {createCase.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting…
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" /> Submit case
                </>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              variant="dark"
              size="sm"
              onClick={goNext}
              disabled={bundleQuery.isLoading || (!schema && !isIdentityStep)}
            >
              Next <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Sub-views ─────────────────────────────────────────────────────────────── */

function Stepper({ current, total }: { current: number; total: number }) {
  if (total <= 1) return null;
  return (
    <div className="flex items-center gap-2 mt-2">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className="flex-1 h-1 rounded-full transition-colors"
          style={{
            background:
              i < current
                ? "var(--apex-accent)"
                : i === current
                  ? "var(--foreground)"
                  : "var(--secondary)",
          }}
        />
      ))}
    </div>
  );
}

function NoFormFallback() {
  return (
    <div
      className="apex-card p-4 text-[13px]"
      style={{ borderColor: "var(--bord)", background: "var(--bord-soft)" }}
    >
      This treatment doesn't have an intake form yet. Please check back shortly
      or contact your care team to open a case.
    </div>
  );
}

function IdentityStep({ identity, setIdentity, errors }) {
  const upd = (patch: Partial<typeof identity>) =>
    setIdentity((prev) => ({ ...prev, ...patch }));

  return (
    <div className="space-y-4">
      <div className="apex-eyebrow">Your details</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="First name" error={errors.firstName}>
          <Input
            value={identity.firstName}
            onChange={(e) => upd({ firstName: e.target.value })}
            required
          />
        </Field>
        <Field label="Last name" error={errors.lastName}>
          <Input
            value={identity.lastName}
            onChange={(e) => upd({ lastName: e.target.value })}
            required
          />
        </Field>
        <Field label="Email" error={errors.email}>
          <Input
            type="email"
            value={identity.email}
            onChange={(e) => upd({ email: e.target.value })}
            required
          />
        </Field>
        <Field label="Phone" error={errors.phoneNumber}>
          <Input
            value={identity.phoneNumber}
            onChange={(e) => upd({ phoneNumber: e.target.value })}
            placeholder="+15551234567"
            required
          />
        </Field>
        <Field label="Date of birth" error={errors.dob}>
          <Input
            type="date"
            value={identity.dob}
            onChange={(e) => upd({ dob: e.target.value })}
            className="font-mono"
            required
          />
        </Field>
        <Field label="Gender">
          <Select
            value={identity.gender}
            onValueChange={(v) => upd({ gender: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MALE">Male</SelectItem>
              <SelectItem value="FEMALE">Female</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="apex-eyebrow pt-2">Shipping address</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field
          label="Address line 1"
          error={errors.addressLine1}
          className="sm:col-span-2"
        >
          <Input
            value={identity.addressLine1}
            onChange={(e) => upd({ addressLine1: e.target.value })}
          />
        </Field>
        <Field label="Address line 2" className="sm:col-span-2">
          <Input
            value={identity.addressLine2}
            onChange={(e) => upd({ addressLine2: e.target.value })}
          />
        </Field>
        <Field label="City" error={errors.city}>
          <Input
            value={identity.city}
            onChange={(e) => upd({ city: e.target.value })}
          />
        </Field>
        <Field label="State" error={errors.state}>
          <Select
            value={identity.state || undefined}
            onValueChange={(v) => upd({ state: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select state…" />
            </SelectTrigger>
            <SelectContent>
              {US_STATES.map((s) => (
                <SelectItem key={s.code} value={s.code}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="ZIP / postal" error={errors.postalCode}>
          <Input
            value={identity.postalCode}
            onChange={(e) => upd({ postalCode: e.target.value })}
            className="font-mono"
          />
        </Field>
        <Field label="Country">
          <Input
            value={identity.country}
            onChange={(e) =>
              upd({ country: e.target.value.toUpperCase().slice(0, 2) })
            }
            className="font-mono uppercase"
            placeholder="US"
          />
        </Field>
      </div>
    </div>
  );
}

function ReviewStep({
  identity,
  schema,
  answers,
}: {
  identity: typeof EMPTY_IDENTITY;
  schema: IntakeFormSchema | null;
  answers: Record<string, AnswerValue>;
}) {
  return (
    <div className="space-y-5">
      <section>
        <h3 className="apex-eyebrow mb-2">Your details</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[13px]">
          <ReviewRow label="Name" value={`${identity.firstName} ${identity.lastName}`} />
          <ReviewRow label="Email" value={identity.email} />
          <ReviewRow label="Phone" value={identity.phoneNumber} />
          <ReviewRow label="Date of birth" value={identity.dob} />
          <ReviewRow
            label="Address"
            value={[
              identity.addressLine1,
              identity.addressLine2,
              [identity.city, identity.state, identity.postalCode]
                .filter(Boolean)
                .join(", "),
              identity.country,
            ]
              .filter(Boolean)
              .join(" · ")}
          />
        </dl>
      </section>

      {schema && (
        <section>
          <h3 className="apex-eyebrow mb-2">Answers</h3>
          <dl className="space-y-2 text-[13px]">
            {schema.questions
              .filter((q) => q.type !== "STATEMENT")
              .map((q) => (
                <ReviewRow
                  key={q.questionId}
                  label={q.question}
                  value={formatAnswerForReview(q, answers[q.questionId])}
                />
              ))}
          </dl>
        </section>
      )}
    </div>
  );
}

function Field({ label, error, className, children }) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-[12.5px]">{label}</Label>
      {children}
      {error && (
        <p className="text-[11px]" style={{ color: "var(--att)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5 px-3 py-2 rounded-[10px] bg-secondary">
      <span className="apex-eyebrow">{label}</span>
      <span className="text-foreground break-words">
        {value || <span className="text-ink-3">—</span>}
      </span>
    </div>
  );
}

/* ── Helpers ───────────────────────────────────────────────────────────────── */

function formatAnswerForReview(q: IntakeQuestion, v: AnswerValue): string {
  if (v == null) return "";
  switch (q.type) {
    case "BOOLEAN":
      return v ? "Yes" : "No";
    case "DATERANGE": {
      const r = v as { startDate: string; endDate: string | null };
      const end = r.endDate ?? "indefinite";
      return `${r.startDate || "—"} → ${end}`;
    }
    case "MULTISELECT":
      return Array.isArray(v) ? (v as string[]).join(", ") : "";
    case "WIDGET_BMI": {
      const b = v as { height: string; weight: number; bmi: number };
      return `H ${b.height}in · W ${b.weight}lb · BMI ${b.bmi}`;
    }
    case "FILE":
    case "WIDGET_USER_ID_DOCUMENT":
      if (Array.isArray(v)) {
        return v.map((f) => (f as { name: string }).name).join(", ");
      }
      return "";
    default:
      return String(v);
  }
}

function normalizeDob(raw: unknown): string {
  if (typeof raw !== "string" || !raw) return "";
  if (raw.includes("T")) return raw.slice(0, 10);
  return raw.slice(0, 10);
}

function normalizeState(raw: unknown): string {
  if (typeof raw !== "string" || !raw) return "";
  const trimmed = raw.trim();
  if (/^[A-Za-z]{2}$/.test(trimmed)) return trimmed.toUpperCase();
  const hit = US_STATES.find((s) => s.name.toLowerCase() === trimmed.toLowerCase());
  return hit ? hit.code : "";
}

function extractMessage(err: unknown): string {
  if (!err || typeof err !== "object") return "Please try again.";
  const e = err as Record<string, unknown> & {
    response?: { data?: { message?: string; error?: string } };
    message?: string;
  };
  return (
    e.response?.data?.message ??
    e.response?.data?.error ??
    e.message ??
    "Please try again."
  );
}
