import { useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import IntakeShell from "@/views/intake/components/IntakeShell";
import { useStartPublicIntake } from "@/hooks/intake/useIntake";
import { saveIntakeToken } from "@/lib/intakeToken";

/**
 * The public storefront door: `/intake/public?formKey=…&productId=…`.
 *
 * A stranger fills an identity block, we mint a token (`POST
 * /api/intake/public/start`), persist it, and hand off to the normal walk at
 * `/intake/<token>`. Every refusal is a flat 404 → one "not available" message.
 */

const INPUT =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#e11816]/25 focus:border-[#e11816]";

function readQuery(): { formKey: string; productId: string } {
  if (typeof window === "undefined") return { formKey: "", productId: "" };
  const q = new URLSearchParams(window.location.search);
  return { formKey: q.get("formKey") ?? "", productId: q.get("productId") ?? "" };
}

export default function PublicIntakeStart() {
  const { formKey, productId } = readQuery();
  const start = useStartPublicIntake();

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
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) setNotAvailable(true);
      else
        setError("Something went wrong. Please try again.");
    }
  };

  if (notAvailable) {
    return (
      <IntakeShell>
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <AlertCircle className="w-10 h-10 text-slate-400" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">
            This form is not available
          </h1>
          <p className="text-sm text-slate-500">
            Please check the link, or contact us if you think this is a mistake.
          </p>
        </div>
      </IntakeShell>
    );
  }

  return (
    <IntakeShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Let's get started
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            A few details before your questions. This lets us save your progress
            and follow up if needed.
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-[14px] font-medium text-slate-800">
                First name
              </label>
              <input
                className={INPUT}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[14px] font-medium text-slate-800">
                Last name
              </label>
              <input
                className={INPUT}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[14px] font-medium text-slate-800">
              Date of birth
            </label>
            <input
              type="date"
              className={INPUT}
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[14px] font-medium text-slate-800">
              Email
            </label>
            <input
              type="email"
              className={INPUT}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[14px] font-medium text-slate-800">
              Phone <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="tel"
              className={INPUT}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 512 555 0100"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          onClick={submit}
          disabled={!valid || start.isPending}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#e11816] hover:bg-[#c3140f] text-white py-3 text-[15px] font-medium disabled:opacity-50"
        >
          {start.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Start
        </button>
      </div>
    </IntakeShell>
  );
}
