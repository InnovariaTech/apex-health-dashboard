import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import {
  AlertCircle,
  ArrowLeft,
  Ban,
  CalendarClock,
  Loader2,
  Pill,
  RefreshCw,
  Send,
  Upload,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PharmacyPicker } from "@/views/patient/components/beluga/PharmacyPicker";
import {
  useCancelVisit,
  useRefreshVisit,
  useSendVisitChat,
  useUpdatePrescription,
  useUploadVisitPhoto,
  useVisit,
  useVisitChat,
} from "@/hooks/beluga/useBeluga";
import type {
  ChatMessage,
  Pharmacy,
  PrescriptionPayload,
  PrescriptionResult,
  Visit,
} from "@/types/beluga/beluga_types";
import { PRESCRIPTION_FAULTS } from "@/types/beluga/beluga_types";
import { findVisitType } from "@/data/beluga/belugaCatalog";
import {
  canCancel,
  canPrescribe,
  needsPhoto,
  statusMeta,
} from "@/views/patient/utils/belugaStatus";
import {
  BELUGA_ACCEPT,
  ImageDecodeError,
  ImageTooLargeError,
  resizeForBeluga,
} from "@/lib/belugaImage";
import { describeBelugaError } from "@/utils/belugaErrors";

/**
 * Telehealth visit detail. Shows status, booking info, the photo step when the
 * visit is awaiting an ID photo, and the doctor chat thread.
 */
export default function VisitDetails() {
  const { masterId = "" } = useParams();
  const navigate = useNavigate();

  const { data: visit, isLoading, isError, refetch } = useVisit(masterId);
  const refresh = useRefreshVisit(masterId);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <button
        type="button"
        onClick={() => navigate("/Visits")}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="w-4 h-4" /> Back to visits
      </button>

      {isLoading ? (
        <div className="flex flex-col items-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="mt-3 text-sm">Loading visit…</p>
        </div>
      ) : isError || !visit ? (
        <div className="flex flex-col items-center py-20 text-center">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <p className="mt-3 font-medium text-slate-700">
            We couldn't load this visit
          </p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      ) : (
        <>
          <VisitHeader
            visit={visit}
            onRefresh={() => refresh.mutate()}
            refreshing={refresh.isPending}
          />

          {needsPhoto(visit.status) && (
            <PhotoStep masterId={masterId} />
          )}

          <BookingBlock visit={visit} />

          <ManageSection visit={visit} masterId={masterId} />

          <ChatThread masterId={masterId} />
        </>
      )}
    </div>
  );
}

function VisitHeader({
  visit,
  onRefresh,
  refreshing,
}: {
  visit: Visit;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const meta = statusMeta(visit.status);
  const created = safeDate(visit.createdAt);
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            {visit.visitType || "Telehealth Visit"}
          </h1>
          {created && (
            <p className="text-sm text-slate-400 mt-0.5">
              Started {format(created, "MMMM d, yyyy")}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={refreshing}
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant={meta.variant} className="shrink-0">
          {meta.label}
        </Badge>
        <span className="text-sm text-slate-500">{meta.hint}</span>
      </div>
      {visit.lastError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {visit.lastError}
        </p>
      )}
    </div>
  );
}

function BookingBlock({ visit }: { visit: Visit }) {
  if (!visit.bookingStatus && !visit.bookingScheduledAt) return null;
  const when = safeDate(visit.bookingScheduledAt);
  const label =
    visit.bookingStatus === "scheduled"
      ? "Scheduled"
      : visit.bookingStatus === "canceled"
        ? "Canceled"
        : visit.bookingStatus === "no_show"
          ? "Missed"
          : "Appointment";
  return (
    <Card>
      <CardContent className="p-4 flex items-start gap-3">
        <CalendarClock className="w-5 h-5 text-slate-500 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-slate-800">{label}</p>
          {when && (
            <p className="text-slate-600">
              {format(when, "EEEE, MMMM d 'at' h:mm a")}
            </p>
          )}
          {visit.bookingDocName && (
            <p className="text-slate-500">with {visit.bookingDocName}</p>
          )}
          {visit.bookingLocation && (
            <p className="text-slate-500">{visit.bookingLocation}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// --- Manage: prescription + cancel -----------------------------------------

function ManageSection({
  visit,
  masterId,
}: {
  visit: Visit;
  masterId: string;
}) {
  const showRx = canPrescribe(visit.status);
  const showCancel = canCancel(visit.status);
  if (!showRx && !showCancel) return null;

  return (
    <div className="space-y-3">
      <Separator />
      <h2 className="font-medium text-slate-800">Manage this visit</h2>
      {showRx && <PrescriptionAction visit={visit} masterId={masterId} />}
      {showCancel && <CancelAction masterId={masterId} />}
    </div>
  );
}

function PrescriptionAction({
  visit,
  masterId,
}: {
  visit: Visit;
  masterId: string;
}) {
  const catalog = findVisitType(visit.visitType);
  const update = useUpdatePrescription(masterId);

  const [open, setOpen] = useState(false);
  const [medicationId, setMedicationId] = useState("");
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [result, setResult] = useState<PrescriptionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setResult(null);
    const med = catalog?.medications.find((m) => m.id === medicationId);
    const pref = med?.preference;
    if (!pref || !pharmacy) return;
    // `daysSupply` is REQUIRED on the prescription endpoint (unlike creates).
    if (!pref.daysSupply) {
      setError("This medication has no days-supply configured.");
      return;
    }
    const payload: PrescriptionPayload = {
      pharmacyId: String(pharmacy.PharmacyId),
      patientPreference: [
        {
          name: pref.name,
          medId: pref.medId,
          strength: pref.strength,
          quantity: pref.quantity,
          refills: pref.refills,
          daysSupply: pref.daysSupply,
        },
      ],
    };
    try {
      const res = await update.mutateAsync(payload);
      setResult(res);
    } catch (err) {
      setError(describeBelugaError(err).message);
    }
  };

  const isFault = result ? PRESCRIPTION_FAULTS.includes(result.status) : false;

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 text-sm font-medium text-slate-800"
        >
          <Pill className="w-4 h-4 text-slate-500" />
          Resend or update prescription
        </button>

        {open && (
          <div className="space-y-3 pt-1">
            {!catalog ? (
              <p className="text-sm text-slate-500">
                Prescription changes aren't available for this visit here.
                Please message your provider.
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Medication
                  </p>
                  {catalog.medications.map((m) => {
                    const active = m.id === medicationId;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMedicationId(m.id)}
                        className={`w-full text-left rounded-lg border p-3 text-sm transition-colors ${
                          active
                            ? "border-slate-900 ring-1 ring-slate-900"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Pharmacy
                  </p>
                  <PharmacyPicker selected={pharmacy} onSelect={setPharmacy} />
                </div>

                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={submit}
                    disabled={!medicationId || !pharmacy || update.isPending}
                  >
                    {update.isPending && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Send to pharmacy
                  </Button>
                </div>
              </>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            {result && (
              <p
                className={`text-sm rounded-md px-3 py-2 border ${
                  isFault
                    ? "text-red-700 bg-red-50 border-red-100"
                    : "text-slate-700 bg-slate-50 border-slate-100"
                }`}
              >
                {result.info || result.status}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CancelAction({ masterId }: { masterId: string }) {
  const cancel = useCancelVisit(masterId);
  const [confirming, setConfirming] = useState(false);
  const [outcome, setOutcome] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const doCancel = async () => {
    setError(null);
    try {
      const res = await cancel.mutateAsync();
      // Beluga decides — a doctor may have resolved it first.
      if (res.outcome === "resolved") {
        setOutcome(
          "This visit was already resolved by a provider, so it can't be canceled.",
        );
      } else if (res.alreadyProcessed) {
        setOutcome("This visit was already closed.");
      } else {
        setOutcome("Your visit has been canceled.");
      }
      setConfirming(false);
    } catch (err) {
      setError(describeBelugaError(err).message);
    }
  };

  if (outcome) {
    return (
      <p className="text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-md px-3 py-2">
        {outcome}
      </p>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        {!confirming ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="flex items-center gap-2 text-sm font-medium text-red-600"
          >
            <Ban className="w-4 h-4" />
            Cancel this visit
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-700">
              Are you sure you want to cancel this visit? This can't be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirming(false)}
                disabled={cancel.isPending}
              >
                Keep visit
              </Button>
              <Button
                size="sm"
                onClick={doCancel}
                disabled={cancel.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {cancel.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Yes, cancel
              </Button>
            </div>
          </div>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </CardContent>
    </Card>
  );
}

// --- Photo step -------------------------------------------------------------

function PhotoStep({ masterId }: { masterId: string }) {
  const upload = useUploadVisitPhoto(masterId);
  const inputRef = useRef<HTMLInputElement>(null);
  const [prepError, setPrepError] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);

  async function onFile(file: File) {
    setPrepError(null);
    setPreparing(true);
    try {
      const prepared = await resizeForBeluga(file);
      await upload.mutateAsync(prepared);
    } catch (err) {
      if (err instanceof ImageTooLargeError || err instanceof ImageDecodeError) {
        setPrepError(err.message);
      } else {
        setPrepError(describeBelugaError(err).message);
      }
    } finally {
      setPreparing(false);
    }
  }

  const busy = preparing || upload.isPending;

  return (
    <Card className="border-amber-200 bg-amber-50/40">
      <CardContent className="p-4 space-y-3">
        <div>
          <p className="font-medium text-slate-800">Upload a photo of your ID</p>
          <p className="text-sm text-slate-500 mt-0.5">
            Your visit isn't complete until we receive a clear photo of your ID.
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={BELUGA_ACCEPT}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
            e.target.value = "";
          }}
        />

        <Button onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Upload className="w-4 h-4 mr-2" />
          )}
          {preparing
            ? "Preparing…"
            : upload.isPending
              ? "Uploading…"
              : "Choose photo"}
        </Button>

        {prepError && <p className="text-sm text-red-600">{prepError}</p>}
      </CardContent>
    </Card>
  );
}

// --- Chat -------------------------------------------------------------------

function ChatThread({ masterId }: { masterId: string }) {
  const { data: messages = [], isLoading } = useVisitChat(masterId);
  const send = useSendVisitChat(masterId);
  const [draft, setDraft] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);

  async function onSend() {
    const content = draft.trim();
    if (!content) return;
    setSendError(null);
    try {
      await send.mutateAsync(content);
      setDraft("");
    } catch (err) {
      setSendError(describeBelugaError(err).message);
    }
  }

  return (
    <div className="space-y-3">
      <Separator />
      <h2 className="font-medium text-slate-800">Messages</h2>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-slate-400 py-6">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading messages…
        </div>
      ) : messages.length === 0 ? (
        <p className="text-sm text-slate-500 py-4">
          No messages yet. Send a message to your care team below.
        </p>
      ) : (
        <div className="space-y-2">
          {messages.map((m) => (
            <ChatBubble key={m.id} message={m} />
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a message to your provider…"
          maxLength={5000}
          rows={2}
          className="flex-1 min-h-[60px] resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
        />
        <Button
          onClick={onSend}
          disabled={send.isPending || !draft.trim()}
          size="icon"
        >
          {send.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
      {sendError && <p className="text-sm text-red-600">{sendError}</p>}
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const outbound = message.direction === "outbound";
  const when = safeDate(message.createdAt);
  return (
    <div
      className={`flex flex-col max-w-[80%] ${
        outbound ? "ml-auto items-end" : "items-start"
      }`}
    >
      <div
        className={`rounded-2xl px-4 py-2 text-sm ${
          outbound
            ? "bg-slate-900 text-white rounded-br-sm"
            : "bg-slate-100 text-slate-800 rounded-bl-sm"
        }`}
      >
        {message.content}
      </div>
      {when && (
        <span className="text-[11px] text-slate-400 mt-0.5">
          {format(when, "MMM d, h:mm a")}
        </span>
      )}
    </div>
  );
}

function safeDate(value?: string | null): Date | null {
  if (!value) return null;
  const t = Date.parse(value);
  return Number.isNaN(t) ? null : new Date(t);
}
