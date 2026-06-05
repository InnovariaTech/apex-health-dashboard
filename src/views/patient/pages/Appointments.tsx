// @ts-nocheck
import { useMemo, useState } from "react";
import { addDays, format, parseISO, subDays } from "date-fns";
import {
  CalendarDays,
  CalendarPlus,
  Loader2,
  AlertCircle,
  Video,
  Info,
  Clock,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TrainerizeGate from "@/components/trainerize/TrainerizeGate";
import {
  useAppointments,
  useAppointmentTypes,
} from "@/hooks/trainerize/useAppointments";
import {
  APPOINTMENT_STATUS_LABELS,
  appointmentDurationMinutes,
  type Appointment,
  type AppointmentType,
} from "@/types/trainerize/appointments_types";
import BookAppointmentDialog from "@/views/patient/components/appointments/BookAppointmentDialog";

/**
 * Trainerize appointments page.
 *
 * What ships here today (against the current doc):
 *   - Upcoming + Past list (split by `endDate < now`)
 *   - Appointment types list (read-only)
 *   - Single, non-recurring booking (via BookAppointmentDialog)
 *
 * Held (see `docs/trainerize/appointment_issue.md`):
 *   - Cancel / reschedule (§3) — UI surfaces "use Trainerize app" copy
 *   - Recurring booking (§4)
 *   - Multi-attendee group booking (§7)
 */

const RANGE_PRESETS = {
  "30d": { days: 30, label: "Last 30 / next 30 days" },
  "60d": { days: 60, label: "Last 60 / next 60 days" },
  "90d": { days: 90, label: "Last 90 / next 90 days" },
} as const;

type RangeKey = keyof typeof RANGE_PRESETS;

export default function Appointments() {
  return (
    <TrainerizeGate>
      <AppointmentsInner />
    </TrainerizeGate>
  );
}

function AppointmentsInner() {
  const [rangeKey, setRangeKey] = useState<RangeKey>("30d");
  const [bookOpen, setBookOpen] = useState(false);

  const { startDate, endDate } = useMemo(() => {
    const today = new Date();
    return {
      startDate: format(subDays(today, RANGE_PRESETS[rangeKey].days), "yyyy-MM-dd"),
      endDate: format(addDays(today, RANGE_PRESETS[rangeKey].days), "yyyy-MM-dd"),
    };
  }, [rangeKey]);

  const appointmentsQuery = useAppointments(startDate, endDate);
  const typesQuery = useAppointmentTypes();

  const appointments = appointmentsQuery.data?.appointments ?? [];
  const types = typesQuery.data?.appointmentTypes ?? [];

  const now = Date.now();
  const { upcoming, past } = useMemo(() => {
    const upcomingList: Appointment[] = [];
    const pastList: Appointment[] = [];
    for (const a of appointments) {
      const endTs = a.endDate ? Date.parse(a.endDate) : NaN;
      const startTs = a.startDate ? Date.parse(a.startDate) : NaN;
      const referenceTs = !Number.isNaN(endTs) ? endTs : startTs;
      if (!Number.isNaN(referenceTs) && referenceTs < now) {
        pastList.push(a);
      } else {
        upcomingList.push(a);
      }
    }
    upcomingList.sort((a, b) => tsOf(a) - tsOf(b));
    pastList.sort((a, b) => tsOf(b) - tsOf(a));
    return { upcoming: upcomingList, past: pastList };
  }, [appointments, now]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-background min-h-screen">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1">
            My Appointments
          </h1>
          <p className="text-muted-foreground">
            Sessions with your trainer — powered by Trainerize.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={rangeKey}
            onValueChange={(v) => setRangeKey(v as RangeKey)}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(RANGE_PRESETS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setBookOpen(true)} className="gap-2">
            <CalendarPlus className="w-4 h-4" /> Book appointment
          </Button>
        </div>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-6">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="upcoming" className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4" /> Upcoming
          </TabsTrigger>
          <TabsTrigger value="past" className="flex items-center gap-2">
            <Clock className="w-4 h-4" /> Past
          </TabsTrigger>
          <TabsTrigger value="types" className="flex items-center gap-2">
            <Info className="w-4 h-4" /> Types
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-3">
          <AppointmentList
            list={upcoming}
            empty="No upcoming appointments in this window."
            query={appointmentsQuery}
            onBook={() => setBookOpen(true)}
          />
        </TabsContent>

        <TabsContent value="past" className="space-y-3">
          <AppointmentList
            list={past}
            empty="No past appointments in this window."
            query={appointmentsQuery}
          />
        </TabsContent>

        <TabsContent value="types" className="space-y-3">
          <TypesList
            types={types}
            isLoading={typesQuery.isLoading}
            isError={typesQuery.isError}
            error={typesQuery.error}
          />
        </TabsContent>
      </Tabs>

      <BookAppointmentDialog
        open={bookOpen}
        onClose={() => setBookOpen(false)}
      />
    </div>
  );
}

// ─── Appointment list ─────────────────────────────────────────────────────

function AppointmentList({
  list,
  empty,
  query,
  onBook,
}: {
  list: Appointment[];
  empty: string;
  query: ReturnType<typeof useAppointments>;
  onBook?: () => void;
}) {
  if (query.isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }
  if (query.isError) {
    return (
      <Card>
        <CardContent className="py-8 flex items-start gap-3 text-destructive">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold mb-1">Couldn't load appointments</p>
            <p className="text-sm">
              {(query.error as { message?: string } | undefined)?.message ??
                "Please try again shortly."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  if (list.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CalendarDays className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
          <p className="font-semibold mb-1">{empty}</p>
          {onBook && (
            <Button onClick={onBook} className="gap-2 mt-3">
              <CalendarPlus className="w-4 h-4" /> Book appointment
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }
  return (
    <>
      {list.map((a) => (
        <AppointmentCard key={a.id} appointment={a} />
      ))}
    </>
  );
}

function AppointmentCard({ appointment }: { appointment: Appointment }) {
  const start = appointment.startDate
    ? safeFormat(appointment.startDate, "EEE, MMM d • h:mm a")
    : "—";
  const duration = appointmentDurationMinutes(appointment);
  const status = appointment.status ?? "scheduled";
  const statusLabel = APPOINTMENT_STATUS_LABELS[status] ?? status;
  const isVideo = appointment.actionInfo?.isVideoCall === true;
  const isRecurring = appointment.actionInfo?.isRecurring === true;
  const typeName = appointment.appointmentType?.name;

  return (
    <Card className="border-2">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <p className="font-semibold text-lg">{start}</p>
            {typeName && (
              <p className="text-sm text-muted-foreground">{typeName}</p>
            )}
          </div>
          <Badge
            variant="outline"
            className={statusBadgeClass(status)}
          >
            {statusLabel}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          {duration != null && (
            <Badge variant="outline" className="text-muted-foreground gap-1">
              <Clock className="w-3 h-3" /> {duration} min
            </Badge>
          )}
          {isVideo && (
            <Badge variant="outline" className="text-muted-foreground gap-1">
              <Video className="w-3 h-3" /> Video call
            </Badge>
          )}
          {isRecurring && (
            <Badge variant="outline" className="text-muted-foreground">
              Recurring
            </Badge>
          )}
          {typeof appointment.userId === "number" && (
            <Badge variant="outline" className="text-muted-foreground gap-1">
              <User className="w-3 h-3" /> Trainer #{appointment.userId}
            </Badge>
          )}
        </div>

        {appointment.notes && (
          <p className="mt-3 text-sm border-l-2 border-border pl-3 text-muted-foreground">
            {appointment.notes}
          </p>
        )}

        <p className="mt-3 text-xs text-muted-foreground border-t border-border pt-2">
          To cancel or reschedule, use the Trainerize app.
        </p>
      </CardContent>
    </Card>
  );
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "confirmed":
      return "border-emerald-500 text-emerald-600";
    case "completed":
      return "border-primary text-primary";
    case "cancelled":
    case "no_show":
      return "border-destructive text-destructive";
    case "pending":
    default:
      return "border-amber-500 text-amber-600";
  }
}

// ─── Types list ───────────────────────────────────────────────────────────

function TypesList({
  types,
  isLoading,
  isError,
  error,
}: {
  types: AppointmentType[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }
  if (isError) {
    return (
      <Card>
        <CardContent className="py-8 flex items-start gap-3 text-destructive">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold mb-1">Couldn't load types</p>
            <p className="text-sm">
              {(error as { message?: string } | undefined)?.message ??
                "Please try again shortly."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  if (types.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Info className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
          <p className="font-semibold mb-1">No appointment types available</p>
          <p className="text-sm text-muted-foreground">
            Your trainer hasn't published any bookable types yet.
          </p>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {types.map((t) => (
        <Card key={t.id} className="border-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              {t.name || `Type #${t.id}`}
              {typeof t.duration === "number" && (
                <Badge variant="outline" className="text-muted-foreground gap-1">
                  <Clock className="w-3 h-3" /> {t.duration} min
                </Badge>
              )}
            </CardTitle>
            {t.description && (
              <CardDescription>{t.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2 text-xs">
              {typeof t.trainerID === "number" && (
                <Badge variant="outline" className="text-muted-foreground gap-1">
                  <User className="w-3 h-3" /> Trainer #{t.trainerID}
                </Badge>
              )}
              {t.isBookable === false && (
                <Badge variant="outline" className="text-muted-foreground">
                  Not bookable
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function tsOf(a: Appointment): number {
  const t = a.startDate ? Date.parse(a.startDate) : NaN;
  return Number.isNaN(t) ? 0 : t;
}

function safeFormat(date: string, pattern: string): string {
  try {
    return format(parseISO(date), pattern);
  } catch {
    return date;
  }
}
