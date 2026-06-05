// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  CalendarPlus,
  Loader2,
  AlertCircle,
  Video,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import {
  useAppointmentTypes,
  useBookAppointment,
} from "@/hooks/trainerize/useAppointments";
import {
  useTrainerizeLink,
  useTrainerizeSettings,
} from "@/hooks/trainerize/useLinkage";
import {
  localDateTimeInputToUtc,
  type AppointmentType,
  type BookAppointmentPayload,
} from "@/types/trainerize/appointments_types";

/**
 * Book Appointment dialog — single, non-recurring.
 *
 * Pre-fills from existing /me state:
 *   - top-level `userId` ← settings.trainerID  (the *trainer*, per §1)
 *   - `attendents[].userId` ← link.trainerizeUserId  (the *client*, per §1)
 *
 * Held in this UI (see `docs/trainerize/appointment_issue.md`):
 *   §4 recurring        — not exposed
 *   §7 multi-attendee   — locked to self only
 *   §11 unassigned      — book button disabled with explanation if no trainer
 */

export interface BookAppointmentDialogProps {
  open: boolean;
  onClose: () => void;
}

const HOUR_IN_MS = 60 * 60 * 1000;

export default function BookAppointmentDialog({
  open,
  onClose,
}: BookAppointmentDialogProps) {
  const settingsQuery = useTrainerizeSettings();
  const linkQuery = useTrainerizeLink();
  const typesQuery = useAppointmentTypes();
  const book = useBookAppointment();

  const trainerId = settingsQuery.data?.trainerID;
  const clientId = linkQuery.data?.trainerizeUserId;
  const types = typesQuery.data?.appointmentTypes ?? [];

  const [appointmentTypeId, setAppointmentTypeId] = useState<string>("");
  const [startLocal, setStartLocal] = useState<string>(defaultStartLocal());
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [notes, setNotes] = useState("");
  const [isVideoCall, setIsVideoCall] = useState(false);

  // Reset to a clean state every time the dialog reopens.
  useEffect(() => {
    if (open) {
      setAppointmentTypeId("");
      setStartLocal(defaultStartLocal());
      setDurationMinutes(60);
      setNotes("");
      setIsVideoCall(false);
    }
  }, [open]);

  // When the user picks a type, default the duration to that type's duration.
  useEffect(() => {
    if (!appointmentTypeId) return;
    const t = types.find((x) => String(x.id) === appointmentTypeId);
    if (typeof t?.duration === "number" && t.duration > 0) {
      setDurationMinutes(t.duration);
    }
  }, [appointmentTypeId, types]);

  const canBook =
    typeof trainerId === "number" &&
    trainerId > 0 &&
    typeof clientId === "number" &&
    clientId > 0;

  const endLocal = useMemo(() => {
    if (!startLocal) return "";
    const ms = Date.parse(startLocal);
    if (Number.isNaN(ms)) return "";
    const end = new Date(ms + durationMinutes * 60 * 1000);
    return format(end, "yyyy-MM-dd'T'HH:mm");
  }, [startLocal, durationMinutes]);

  const handleBook = async () => {
    if (!canBook) {
      toast({
        title: "Can't book yet",
        description:
          "No trainer or Trainerize link found on your account. Contact your trainer to get set up.",
      });
      return;
    }
    if (!appointmentTypeId) {
      toast({ title: "Pick an appointment type" });
      return;
    }
    if (!startLocal) {
      toast({ title: "Pick a start time" });
      return;
    }
    if (!endLocal) {
      toast({ title: "Invalid start time" });
      return;
    }

    const payload: BookAppointmentPayload = {
      userId: trainerId as number,
      startDate: localDateTimeInputToUtc(startLocal),
      endDate: localDateTimeInputToUtc(endLocal),
      appointmentTypeId: Number(appointmentTypeId),
      attendents: [{ userId: clientId as number }],
      ...(notes.trim() ? { notes: notes.trim() } : {}),
      ...(isVideoCall ? { actionInfo: { isVideoCall: true } } : {}),
    };

    try {
      await book.mutateAsync(payload);
      toast({
        title: "Appointment booked",
        description: `${describeType(types, appointmentTypeId)} • ${format(
          Date.parse(startLocal),
          "MMM d, h:mm a",
        )}`,
      });
      onClose();
    } catch (err) {
      toast({
        title: "Couldn't book appointment",
        description:
          (err as { message?: string } | undefined)?.message ??
          "Please try a different time slot.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="w-5 h-5 text-primary" />
            Book appointment
          </DialogTitle>
        </DialogHeader>

        {!canBook && !settingsQuery.isLoading && !linkQuery.isLoading && (
          <div className="flex items-start gap-2 text-sm text-amber-700 border border-amber-300 bg-amber-50 rounded-sm p-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-0.5">No trainer assigned</p>
              <p className="text-xs">
                Booking needs a trainer on your Trainerize account. Contact
                your trainer to get assigned, then come back here.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="appointment-type">Appointment type</Label>
            {typesQuery.isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading types…
              </div>
            ) : types.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No appointment types available.
              </p>
            ) : (
              <Select
                value={appointmentTypeId}
                onValueChange={setAppointmentTypeId}
              >
                <SelectTrigger id="appointment-type">
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {types.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {describeTypeRow(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="start-local">Start (your time)</Label>
              <Input
                id="start-local"
                type="datetime-local"
                value={startLocal}
                onChange={(e) => setStartLocal(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min={5}
                step={5}
                value={durationMinutes}
                onChange={(e) =>
                  setDurationMinutes(Math.max(5, Number(e.target.value) || 0))
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-sm border border-border p-3">
            <div>
              <Label
                htmlFor="video-call"
                className="font-semibold flex items-center gap-2"
              >
                <Video className="w-4 h-4 text-muted-foreground" />
                Video call
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Trainerize creates a meeting link if your trainer supports it.
              </p>
            </div>
            <Switch
              id="video-call"
              checked={isVideoCall}
              onCheckedChange={setIsVideoCall}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything your trainer should know before the session."
            />
          </div>

          <div className="flex items-start gap-2 text-xs text-muted-foreground border border-border rounded-sm p-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              Cancel or reschedule from the Trainerize app — those actions
              aren't available here yet. Recurring bookings are coming soon.
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={book.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() => void handleBook()}
            disabled={book.isPending || !canBook}
            className="gap-2"
          >
            {book.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CalendarPlus className="w-4 h-4" />
            )}
            Book appointment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function defaultStartLocal(): string {
  // Default to next top-of-hour, an hour out.
  const now = new Date(Date.now() + HOUR_IN_MS);
  now.setMinutes(0, 0, 0);
  return format(now, "yyyy-MM-dd'T'HH:mm");
}

function describeType(types: AppointmentType[], id: string): string {
  const t = types.find((x) => String(x.id) === id);
  return t?.name || `Type #${id}`;
}

function describeTypeRow(t: AppointmentType): string {
  if (t.name && typeof t.duration === "number") {
    return `${t.name} (${t.duration} min)`;
  }
  return t.name || `Type #${t.id}`;
}
