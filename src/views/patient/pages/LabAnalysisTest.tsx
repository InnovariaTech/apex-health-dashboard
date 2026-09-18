import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Copy, FlaskConical, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCreateLabVisit } from "@/hooks/beluga/useBeluga";
import type { LabResult, LabVisitPayload } from "@/types/beluga/beluga_types";

/**
 * labAnalysis — staging test submission screen.
 *
 * NOT a dynamic form. Two buttons, each firing one fixed, complete payload to
 * `POST /api/beluga/lab-visits` (via `createLabVisit`). Scenario 1 triggers zero
 * conditional questions (8 Q&A pairs); Scenario 2 triggers both conditional
 * chains (11 Q&A pairs). Both send `testToTreat: false`, `pharmacyId: "12345"`,
 * `consentsSigned: true`, and the same mock 6-value results array.
 *
 * Named clinical fields (allergies, selfReportedMeds, medicalConditions, sex)
 * are NOT in this payload — the backend fills them from the patient's stored
 * profile. Ensure the test patient's profile has real (non-blank) values.
 *
 * Payloads verbatim from `Documents/labAnalysis-frontend-implementation-spec.md`
 * §8a / §8b.
 */

// Shared mock results — identical on both scenarios (spec §7).
const RESULTS: LabResult[] = [
  { screeningDate: "01/02/2026", testName: "ALBUMIN", testResult: "3.3", testResultUnits: "g/dL", refRange: "3.2-5.5", statusIndicator: "N", reportDate: "01/02/2026", sampleSource: "BLOOD" },
  { screeningDate: "01/02/2026", testName: "VITAMIN B-12", testResult: "311", testResultUnits: "pg/mL", refRange: "211-911", statusIndicator: "N", reportDate: "01/02/2026", sampleSource: "BLOOD" },
  { screeningDate: "01/02/2026", testName: "VITAMIN D 25 HYDROXY", testResult: "88.20", testResultUnits: "ng/mL", refRange: "N/A", statusIndicator: "H", reportDate: "01/02/2026", sampleSource: "BLOOD" },
  { screeningDate: "01/02/2026", testName: "HEMOGLOBIN A1C", testResult: "5.3", testResultUnits: "%", refRange: "N/A", statusIndicator: "N/A", reportDate: "01/02/2026", sampleSource: "BLOOD" },
  { screeningDate: "01/02/2026", testName: "CHOLESTEROL", testResult: "190", testResultUnits: "mg/dL", refRange: "120-199", statusIndicator: "N", reportDate: "01/02/2026", sampleSource: "BLOOD" },
  { screeningDate: "01/02/2026", testName: "HS-CRP", testResult: "0.4", testResultUnits: "mg/dL", refRange: "0.0-0.5", statusIndicator: "N", reportDate: "01/02/2026", sampleSource: "BLOOD" },
];

const CONSENT_Q =
  "You are requesting laboratory testing as part of a general wellness screening. The purpose of this testing is to provide information about your overall health and identify potential areas for further evaluation or optimization. By proceeding, you acknowledge and understand the following: Purpose of Testing: These tests are intended for general wellness purposes only. They are not designed to diagnose, treat, or monitor any specific medical condition. This encounter is NOT appropriate if you currently are experiencing symptoms. Scope of Encounter: This encounter is not a substitute for in-person medical evaluation, diagnosis, or management by your primary care provider or specialist. Any findings should be reviewed with your regular healthcare provider, especially if you have ongoing symptoms, medical conditions, or concerns. Provider Feedback: You will receive general feedback regarding your lab results. This feedback may include educational insights, lifestyle suggestions, or recommendations to follow up with a healthcare provider for further evaluation. Limitations: The information provided is based solely on the lab results and the information you provide in your questionnaire. It does not include a comprehensive physical exam, detailed medical history review, or diagnostic workup. Follow-Up Responsibility: It is your responsibility to follow up with a licensed healthcare provider for any necessary diagnosis, ongoing care, or treatment of abnormal results or symptoms. By agreeing to proceed, you confirm that you have read and understood the above information, and you consent to have labs ordered and reviewed as part of this general wellness screening. POSSIBLE ANSWERS: I have read and understand the above information, I would like to continue; I have read and understand the above information and I would NOT like to continue";

const ATTEST_Q =
  "Please attest to the following confirming that all information you have provided to us is true and complete. I verify that I am the patient and that I have answered the questions asked in this intake form. I confirm that I have reviewed and understood all the questions asked of me. I attest that the answers and information I have provided in this questionnaire is true and complete to the best of my knowledge. I understand that it is critical to my health to share complete health information with my doctor. I will not hold the doctor or affiliated medical practice responsible for any oversights or omissions, whether intentional or not, in the information that I provided. POSSIBLE ANSWERS: I have read the above information and I do consent and wish to move forward; I have read the above information and I do not wish to continue";

const GOALS_Q =
  "What are your main goals for this lab testing? (Select all that apply) POSSIBLE ANSWERS: Complete an overall wellness screening; Check thyroid function; Evaluate hormone levels; Check vitamin or nutrient levels; Assess cardiovascular risk (cholesterol, inflammation); Review liver or kidney function; Check complete blood count; Other";

const LIFESTYLE_Q =
  "How would you describe your current lifestyle? (Select all that apply) POSSIBLE ANSWERS: Sedentary; Moderately active; Very active; High stress; Poor sleep quality; Balanced diet; Vegetarian or vegan; Intermittent fasting or specific diet plan; Trying to conceive or pregnant";

const LAST_LABS_Q =
  "When was your last set of lab tests performed? POSSIBLE ANSWERS: Within the last 3 months; 3–6 months ago; 6–12 months ago; Over a year ago; Unsure or never tested";

// Scenario 1 — zero conditionality, 8 Q&A pairs (spec §8a).
const SCENARIO_1: LabVisitPayload = {
  visitType: "labAnalysis",
  pharmacyId: "12345",
  consentsSigned: true,
  testToTreat: false,
  results: RESULTS,
  questions: {
    Q1: "What is your height in feet and inches?",
    A1: "5 feet 9 inches",
    Q2: "What is your weight in pounds?",
    A2: "180",
    Q3: CONSENT_Q,
    A3: "I have read and understand the above information, I would like to continue",
    Q4: GOALS_Q,
    A4: "Complete an overall wellness screening; Check vitamin or nutrient levels",
    Q5: LIFESTYLE_Q,
    A5: "Moderately active; Balanced diet",
    Q6: LAST_LABS_Q,
    A6: "Unsure or never tested",
    Q7: "What other information or questions do you have for the doctor?",
    A7: "None at this time.",
    Q8: ATTEST_Q,
    A8: "I have read the above information and I do consent and wish to move forward",
  },
};

// Scenario 2 — both conditional chains, 11 Q&A pairs (spec §8b).
const SCENARIO_2: LabVisitPayload = {
  visitType: "labAnalysis",
  pharmacyId: "12345",
  consentsSigned: true,
  testToTreat: false,
  results: RESULTS,
  questions: {
    Q1: "What is your height in feet and inches?",
    A1: "5 feet 4 inches",
    Q2: "What is your weight in pounds?",
    A2: "142",
    Q3: CONSENT_Q,
    A3: "I have read and understand the above information, I would like to continue",
    Q4: GOALS_Q,
    A4: "Check thyroid function; Other",
    Q5: "Please provide more information about your other goal",
    A5: "Interested in a broader panel my last screening didn't cover.",
    Q6: LIFESTYLE_Q,
    A6: "High stress; Poor sleep quality",
    Q7: LAST_LABS_Q,
    A7: "Over a year ago",
    Q8: "Were there any abnormal results in the past? POSSIBLE ANSWERS: Yes; No; Unsure",
    A8: "Yes",
    Q9: "Please describe which results where abnormal",
    A9: "Cholesterol was slightly elevated on the last panel I had done.",
    Q10: "What other information or questions do you have for the doctor?",
    A10: "No further questions at this time.",
    Q11: ATTEST_Q,
    A11: "I have read the above information and I do consent and wish to move forward",
  },
};

type ScenarioKey = "s1" | "s2";

/** Show the error response as-is (envelope body if present, else the message). */
function rawError(err: unknown): string {
  const data = (err as { response?: { data?: unknown } })?.response?.data;
  if (data != null) {
    try {
      return typeof data === "string" ? data : JSON.stringify(data, null, 2);
    } catch {
      /* fall through */
    }
  }
  return (err as { message?: string })?.message ?? "Request failed.";
}

export default function LabAnalysisTest() {
  const navigate = useNavigate();
  const create = useCreateLabVisit();
  const [consent, setConsent] = useState(false);
  const [running, setRunning] = useState<ScenarioKey | null>(null);
  const [results, setResults] = useState<
    Record<ScenarioKey, { masterId: string } | { error: string } | undefined>
  >({ s1: undefined, s2: undefined });
  const [copied, setCopied] = useState<ScenarioKey | null>(null);

  const run = async (key: ScenarioKey, payload: LabVisitPayload) => {
    if (!consent) return;
    setRunning(key);
    setResults((r) => ({ ...r, [key]: undefined }));
    try {
      const res = await create.mutateAsync(payload);
      setResults((r) => ({ ...r, [key]: { masterId: res.masterId } }));
    } catch (err) {
      setResults((r) => ({ ...r, [key]: { error: rawError(err) } }));
    } finally {
      setRunning(null);
    }
  };

  const copy = async (key: ScenarioKey, masterId: string) => {
    try {
      await navigator.clipboard.writeText(masterId);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* selectable field is the fallback */
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <button
        type="button"
        onClick={() => navigate("/Visits")}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to visits
      </button>

      <Card>
        <CardContent className="p-5 space-y-5">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-slate-600" />
            <h1 className="text-lg font-semibold text-slate-900">
              labAnalysis — staging test submission
            </h1>
          </div>

          <p className="text-sm text-slate-500">
            Fires one of two fixed payloads to{" "}
            <span className="font-mono text-[12px]">POST /api/beluga/lab-visits</span>.
            Allergies, medications, conditions, and sex are pulled from the test
            patient's stored profile — make sure those are set to real (non-blank)
            values before submitting.
          </p>

          <label className="flex items-start gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              I consent to lab testing authorization (sends{" "}
              <span className="font-mono text-[12px]">consentsSigned: true</span>).
            </span>
          </label>

          <div className="grid sm:grid-cols-2 gap-3">
            <ScenarioButton
              label="Submit Scenario 1"
              sub="Zero conditionality · 8 Q&A"
              disabled={!consent || running !== null}
              pending={running === "s1"}
              onClick={() => run("s1", SCENARIO_1)}
            />
            <ScenarioButton
              label="Submit Scenario 2"
              sub="All conditionality · 11 Q&A"
              disabled={!consent || running !== null}
              pending={running === "s2"}
              onClick={() => run("s2", SCENARIO_2)}
            />
          </div>

          <ResultLine
            title="Scenario 1"
            result={results.s1}
            copied={copied === "s1"}
            onCopy={(id) => copy("s1", id)}
          />
          <ResultLine
            title="Scenario 2"
            result={results.s2}
            copied={copied === "s2"}
            onCopy={(id) => copy("s2", id)}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function ScenarioButton({
  label,
  sub,
  disabled,
  pending,
  onClick,
}: {
  label: string;
  sub: string;
  disabled: boolean;
  pending: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className="h-auto py-3 flex flex-col items-start gap-0.5"
    >
      <span className="flex items-center gap-2 font-medium">
        {pending && <Loader2 className="w-4 h-4 animate-spin" />}
        {label}
      </span>
      <span className="text-[11px] font-normal opacity-80">{sub}</span>
    </Button>
  );
}

function ResultLine({
  title,
  result,
  copied,
  onCopy,
}: {
  title: string;
  result: { masterId: string } | { error: string } | undefined;
  copied: boolean;
  onCopy: (masterId: string) => void;
}) {
  if (!result) return null;
  if ("masterId" in result) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 space-y-1">
        <p className="text-[12px] font-semibold text-emerald-700 flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5" /> {title} submitted
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-slate-500">masterId</span>
          <input
            readOnly
            value={result.masterId}
            onFocus={(e) => e.currentTarget.select()}
            className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-[12px] font-mono bg-white"
          />
          <button
            type="button"
            onClick={() => onCopy(result.masterId)}
            className="rounded-md border border-slate-300 px-2 py-1"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-500" />
            )}
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-1">
      <p className="text-[12px] font-semibold text-red-700">{title} failed</p>
      <pre className="text-[11px] text-red-800 whitespace-pre-wrap break-words font-mono">
        {result.error}
      </pre>
    </div>
  );
}
