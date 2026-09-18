import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft, Check, FlaskConical, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCreateLabAuthorization } from "@/hooks/beluga/useBeluga";
import { describeBelugaError } from "@/utils/belugaErrors";

/**
 * Lab-testing auto-authorization (`labTestingAutoAuthorization`) create flow.
 *
 * Posts `POST /api/beluga/lab-authorizations` with a fixed `testTypes` and
 * `consentsSigned: true`. No pharmacy, no medication, no questions — the
 * lab-authorization payload carries only `testTypes`, optional `questions`
 * (omitted here), and `consentsSigned`. The visit lands at `active`, so there
 * is no photo step; we hand off to the visit detail page on success.
 */

// Fixed for this flow — the payload identifies itself by testTypes (there is no
// `visitType` field on LabAuthorizationPayload).
const TEST_TYPES = ["HRT panel"];

export default function LabAuthorization() {
  const navigate = useNavigate();
  const create = useCreateLabAuthorization();
  const [consent, setConsent] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [retryable, setRetryable] = useState(true);

  const submit = async () => {
    if (!consent) return;
    setSubmitError(null);
    try {
      const result = await create.mutateAsync({
        testTypes: TEST_TYPES,
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
              Lab testing authorization
            </h1>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Test panel</p>
            {TEST_TYPES.map((t) => (
              <div
                key={t}
                className="flex items-center gap-2 rounded-lg border border-slate-900 ring-1 ring-slate-900 p-3"
              >
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 text-white shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </span>
                <span className="text-sm font-medium text-slate-900">{t}</span>
              </div>
            ))}
          </div>

          <label className="flex items-start gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              I consent to lab testing authorization and confirm the information
              above is accurate.
            </span>
          </label>

          {submitError && (
            <div className="flex items-start gap-2 text-sm text-red-600">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{submitError}</span>
            </div>
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
              {create.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit authorization
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
