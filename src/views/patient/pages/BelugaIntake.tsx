import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Pill,
  Stethoscope,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PharmacyPicker } from "@/views/patient/components/beluga/PharmacyPicker";
import {
  useCreateVisit,
  useIntakeRequirements,
} from "@/hooks/beluga/useBeluga";
import {
  BELUGA_VISIT_TYPES,
  findVisitType,
} from "@/data/beluga/belugaCatalog";
import type {
  IntakeGap,
  Pharmacy,
  VisitQuestions,
} from "@/types/beluga/beluga_types";
import { describeBelugaError } from "@/utils/belugaErrors";

/**
 * Patient intake / create flow: readiness gate → choose treatment → pharmacy →
 * medication + questions → review & consent → `POST /visits`. On success we
 * hand off to the visit detail page, where the photo step takes over
 * (the visit lands at `awaiting_photos`).
 */

const STEPS = ["Eligibility", "Treatment", "Pharmacy", "Details", "Review"];

export default function BelugaIntake() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  // Selections carried across steps.
  const [visitType, setVisitType] = useState("");
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [medicationId, setMedicationId] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [consent, setConsent] = useState(false);

  const selectedType = findVisitType(visitType);
  // Company-designated / staging pharmacy for this visit type. When present the
  // pharmacy-search step is skipped and this id is sent as-is.
  const fixedPharmacyId = selectedType?.pharmacyId;

  const goBack = () => (step === 0 ? navigate("/Visits") : setStep((s) => s - 1));
  const goNext = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <button
        type="button"
        onClick={goBack}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="w-4 h-4" />
        {step === 0 ? "Back to visits" : "Back"}
      </button>

      <Stepper step={step} />

      {step === 0 && <GateStep onReady={goNext} />}

      {step === 1 && (
        <TreatmentStep
          visitType={visitType}
          onSelect={(v) => {
            setVisitType(v);
            // Reset downstream selections tied to the treatment.
            setMedicationId("");
            setAnswers({});
          }}
          onNext={goNext}
        />
      )}

      {step === 2 &&
        (fixedPharmacyId ? (
          <FixedPharmacyStep pharmacyId={fixedPharmacyId} onNext={goNext} />
        ) : (
          <PharmacyStep
            selected={pharmacy}
            onSelect={setPharmacy}
            onNext={goNext}
          />
        ))}

      {step === 3 && selectedType && (
        <DetailsStep
          visitType={visitType}
          medicationId={medicationId}
          onMedication={setMedicationId}
          answers={answers}
          onAnswer={(id, value) =>
            setAnswers((a) => ({ ...a, [id]: value }))
          }
          onNext={goNext}
        />
      )}

      {step === 4 && selectedType && (pharmacy || fixedPharmacyId) && (
        <ReviewStep
          visitType={visitType}
          pharmacy={pharmacy}
          fixedPharmacyId={fixedPharmacyId}
          medicationId={medicationId}
          answers={answers}
          consent={consent}
          onConsent={setConsent}
        />
      )}
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <ol className="flex items-center gap-2 text-xs">
      {STEPS.map((label, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={`flex items-center justify-center w-6 h-6 rounded-full border text-[11px] font-medium ${
                done
                  ? "bg-slate-900 border-slate-900 text-white"
                  : active
                    ? "border-slate-900 text-slate-900"
                    : "border-slate-200 text-slate-400"
              }`}
            >
              {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </span>
            <span
              className={`hidden sm:inline ${
                active ? "text-slate-900 font-medium" : "text-slate-400"
              }`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <span className="w-4 sm:w-6 h-px bg-slate-200" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

// --- Step 0: eligibility gate ----------------------------------------------

function GateStep({ onReady }: { onReady: () => void }) {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch, isFetching } =
    useIntakeRequirements();

  if (isLoading) {
    return <CenteredLoader label="Checking your eligibility…" />;
  }

  if (isError || !data) {
    return (
      <StepCard title="Eligibility">
        <ErrorLine message="We couldn't check your eligibility." />
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
          {isFetching && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Try again
        </Button>
      </StepCard>
    );
  }

  if (data.ready) {
    return (
      <StepCard title="You're ready to start">
        <p className="text-sm text-slate-600">
          Your profile has everything we need. Let's begin your visit.
        </p>
        <div className="flex justify-end">
          <Button onClick={onReady}>
            Continue <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </StepCard>
    );
  }

  return (
    <StepCard title="Finish your profile first">
      <p className="text-sm text-slate-600">
        Before starting a visit, please complete the following in your profile:
      </p>
      <ul className="space-y-2">
        {data.gaps.map((gap) => (
          <li
            key={gap.field}
            className="flex items-start gap-2 text-sm text-slate-700"
          >
            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <span>
              <span className="font-medium">{gapLabel(gap)}</span>
              {gap.detail && (
                <span className="text-slate-500"> — {gap.detail}</span>
              )}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2 justify-end">
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
          {isFetching && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Re-check
        </Button>
        <Button onClick={() => navigate("/Profile")}>Update profile</Button>
      </div>
    </StepCard>
  );
}

/** Friendly labels for the gap `field` (our column names). */
function gapLabel(gap: IntakeGap): string {
  const map: Record<string, string> = {
    firstName: "First name",
    lastName: "Last name",
    dob: "Date of birth",
    phoneNumber: "Mobile phone number",
    address: "Street address",
    city: "City",
    state: "State",
    postalCode: "ZIP code",
    assignedSex: "Sex assigned at birth",
  };
  return map[gap.field] ?? gap.field;
}

// --- Step 1: choose treatment ----------------------------------------------

function TreatmentStep({
  visitType,
  onSelect,
  onNext,
}: {
  visitType: string;
  onSelect: (v: string) => void;
  onNext: () => void;
}) {
  return (
    <StepCard title="Choose a treatment">
      <div className="space-y-2">
        {BELUGA_VISIT_TYPES.map((t) => {
          const active = t.visitType === visitType;
          return (
            <button
              key={t.visitType}
              type="button"
              onClick={() => onSelect(t.visitType)}
              className={`w-full text-left rounded-lg border p-4 transition-colors ${
                active
                  ? "border-slate-900 ring-1 ring-slate-900"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-slate-500" />
                <span className="font-medium text-slate-900">{t.label}</span>
              </div>
              <p className="text-sm text-slate-500 mt-1">{t.description}</p>
            </button>
          );
        })}
      </div>
      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!visitType}>
          Continue <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </StepCard>
  );
}

// --- Step 2: pharmacy -------------------------------------------------------

function FixedPharmacyStep({
  pharmacyId,
  onNext,
}: {
  pharmacyId: string;
  onNext: () => void;
}) {
  return (
    <StepCard title="Your pharmacy">
      <p className="text-sm text-slate-600">
        A pharmacy is already assigned for this visit
        <span className="text-slate-400"> (#{pharmacyId})</span>. Your
        prescription, if issued, will be sent there.
      </p>
      <div className="flex justify-end">
        <Button onClick={onNext}>
          Continue <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </StepCard>
  );
}

function PharmacyStep({
  selected,
  onSelect,
  onNext,
}: {
  selected: Pharmacy | null;
  onSelect: (p: Pharmacy) => void;
  onNext: () => void;
}) {
  return (
    <StepCard title="Choose your pharmacy">
      <PharmacyPicker selected={selected} onSelect={onSelect} />
      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!selected}>
          Continue <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </StepCard>
  );
}

// --- Step 3: medication + questions ----------------------------------------

function DetailsStep({
  visitType,
  medicationId,
  onMedication,
  answers,
  onAnswer,
  onNext,
}: {
  visitType: string;
  medicationId: string;
  onMedication: (id: string) => void;
  answers: Record<string, string>;
  onAnswer: (id: string, value: string) => void;
  onNext: () => void;
}) {
  const type = findVisitType(visitType);
  if (!type) return null;

  const requiredUnanswered = type.questions
    .filter((q) => q.required)
    .some((q) => !(answers[q.id] ?? "").trim());
  const canContinue = Boolean(medicationId) && !requiredUnanswered;

  return (
    <StepCard title="Visit details">
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">Medication</p>
        {type.medications.map((m) => {
          const active = m.id === medicationId;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onMedication(m.id)}
              className={`w-full text-left rounded-lg border p-3 transition-colors ${
                active
                  ? "border-slate-900 ring-1 ring-slate-900"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <Pill className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-900">
                  {m.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {type.questions.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-700">A few questions</p>
          {type.questions.map((q) => (
            <div key={q.id} className="space-y-1">
              <label className="text-sm text-slate-600">
                {q.prompt}
                {q.required && <span className="text-red-500"> *</span>}
              </label>
              {q.kind === "boolean" ? (
                <div className="flex gap-2">
                  {["Yes", "No"].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => onAnswer(q.id, opt)}
                      className={`px-4 py-1.5 rounded-md border text-sm ${
                        answers[q.id] === opt
                          ? "bg-slate-900 text-white border-slate-900"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <Input
                  value={answers[q.id] ?? ""}
                  onChange={(e) => onAnswer(q.id, e.target.value)}
                  placeholder="Your answer"
                />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!canContinue}>
          Continue <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </StepCard>
  );
}

// --- Step 4: review + consent + submit -------------------------------------

function ReviewStep({
  visitType,
  pharmacy,
  fixedPharmacyId,
  medicationId,
  answers,
  consent,
  onConsent,
}: {
  visitType: string;
  pharmacy: Pharmacy | null;
  fixedPharmacyId: string | undefined;
  medicationId: string;
  answers: Record<string, string>;
  consent: boolean;
  onConsent: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  const create = useCreateVisit();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [retryable, setRetryable] = useState(true);

  const type = findVisitType(visitType);
  const medication = type?.medications.find((m) => m.id === medicationId);

  const questions: VisitQuestions = useMemo(() => {
    if (!type) return {};
    const out: VisitQuestions = {};
    for (const q of type.questions) {
      const answer = (answers[q.id] ?? "").trim();
      if (!answer) continue;
      out[q.id] = q.prompt; // Q{n}
      out[q.id.replace(/^Q/, "A")] = answer; // A{n}
    }
    return out;
  }, [type, answers]);

  const pharmacyId = fixedPharmacyId ?? (pharmacy ? String(pharmacy.PharmacyId) : "");

  const submit = async () => {
    if (!type || !medication || !pharmacyId) return;
    setSubmitError(null);
    try {
      const result = await create.mutateAsync({
        visitType,
        pharmacyId,
        patientPreference: [medication.preference],
        ...(Object.keys(questions).length ? { questions } : {}),
        consentsSigned: true,
      });
      navigate(`/Visits/${result.masterId}`);
    } catch (err) {
      const info = describeBelugaError(err);
      setSubmitError(info.message);
      setRetryable(info.retryable);
    }
  };

  return (
    <StepCard title="Review & submit">
      <dl className="text-sm divide-y divide-slate-100">
        <Row label="Treatment" value={type?.label ?? visitType} />
        <Row label="Medication" value={medication?.label ?? "—"} />
        <Row
          label="Pharmacy"
          value={
            pharmacy
              ? `${pharmacy.StoreName} — ${[pharmacy.City, pharmacy.State]
                  .filter(Boolean)
                  .join(", ")}`
              : `Assigned pharmacy (#${pharmacyId})`
          }
        />
      </dl>

      <label className="flex items-start gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => onConsent(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          I consent to a telehealth visit and confirm the information above is
          accurate.
        </span>
      </label>

      {submitError && (
        <ErrorLine message={submitError} />
      )}
      {submitError && !retryable && (
        <p className="text-xs text-slate-500">
          This can't be resubmitted as-is. Please review the message above.
        </p>
      )}

      <div className="flex justify-end">
        <Button
          onClick={submit}
          disabled={!consent || create.isPending || (!!submitError && !retryable)}
        >
          {create.isPending && (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          )}
          Submit visit
        </Button>
      </div>

      <p className="text-xs text-slate-400">
        After submitting, you'll be asked to upload a photo of your ID to
        complete your visit.
      </p>
    </StepCard>
  );
}

// --- Shared bits ------------------------------------------------------------

function StepCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {children}
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-2">
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-slate-800 text-right">{value}</dd>
    </div>
  );
}

function CenteredLoader({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center py-16 text-slate-400">
      <Loader2 className="w-8 h-8 animate-spin" />
      <p className="mt-3 text-sm">{label}</p>
    </div>
  );
}

function ErrorLine({ message }: { message: string }) {
  return (
    <p className="text-sm text-red-600 flex items-start gap-2">
      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
      {message}
    </p>
  );
}
