import { useMemo, useState } from "react";
import { Calendar, Clock3, PhoneCall, UserRound } from "lucide-react";
import type { CaseDetailsItem } from "@/types/care-validate/case_types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  extractAppointments,
  formatAppointmentRange,
  formatMeetingType,
  type AppointmentStatus,
  type NormalizedAppointment,
} from "@/views/patient/utils/caseAppointmentsUtils";

interface CaseAppointmentsPanelProps {
  caseDetails: CaseDetailsItem;
}

const STATUS_FILTERS = [
  { value: "ALL", label: "All Statuses" },
  { value: "ACCEPTED_BY_PROVIDER", label: "Accepted By Provider" },
  { value: "MISSED_BY_PROVIDER", label: "Missed Appointment By Provider" },
  { value: "MISSED_BY_PATIENT", label: "Missed Appointment By Patient" },
  { value: "NEEDS_RESCHEDULING", label: "No-Show - Needs Rescheduling" },
];

const STATUS_BADGE_STYLES: Record<
  AppointmentStatus,
  { text: string; className: string }
> = {
  SCHEDULED: { text: "Scheduled", className: "bg-blue-100 text-blue-800 border-blue-200" },
  ACCEPTED_BY_PROVIDER: {
    text: "Accepted",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  EXPIRED: {
    text: "Expired - Scheduled",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  COMPLETED: { text: "Completed", className: "bg-muted text-foreground border-border" },
  MISSED_BY_PROVIDER: {
    text: "Missed by Provider",
    className: "bg-red-100 text-red-800 border-red-200",
  },
  MISSED_BY_PATIENT: {
    text: "Missed by Patient",
    className: "bg-red-100 text-red-800 border-red-200",
  },
  NEEDS_RESCHEDULING: {
    text: "Needs Rescheduling",
    className: "bg-orange-100 text-orange-800 border-orange-200",
  },
};

function AppointmentCard({ appointment }: { appointment: NormalizedAppointment }) {
  const badge = STATUS_BADGE_STYLES[appointment.status] ?? STATUS_BADGE_STYLES.SCHEDULED;
  const sourceLabel = appointment.source
    ? appointment.source.charAt(0).toUpperCase() + appointment.source.slice(1)
    : "Source";

  return (
    <Card className="border-2 border-border/80 bg-background/70 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-foreground leading-snug">
              Scheduled via {sourceLabel} - {appointment.title}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {formatAppointmentRange(appointment)}
            </p>
          </div>
          <Badge variant="outline" className={`${badge.className} whitespace-nowrap`}>
            {badge.text}
          </Badge>
        </div>

        <div className="rounded-md border border-border bg-muted/30 p-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 font-semibold">
              <Clock3 className="w-4 h-4" /> {appointment.durationMinutes} minutes
            </span>
            <span className="inline-flex items-center gap-2 rounded-md bg-background border border-border px-2.5 py-1">
              <PhoneCall className="w-4 h-4 text-primary" /> {formatMeetingType(appointment.meetingType)}
            </span>
            <span className="inline-flex items-center gap-2 rounded-md bg-background border border-border px-2.5 py-1">
              <Calendar className="w-4 h-4 text-primary" /> {sourceLabel}
            </span>
            {appointment.providerName && (
              <span className="inline-flex items-center gap-2 rounded-md bg-background border border-border px-2.5 py-1">
                <UserRound className="w-4 h-4 text-primary" /> {appointment.providerName}
              </span>
            )}
          </div>
        </div>

        {appointment.notes && (
          <div className="border border-border rounded-md p-3 bg-background">
            <p className="text-xs font-semibold uppercase text-muted-foreground mb-1.5">
              Meeting Notes
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">{appointment.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function CaseAppointmentsPanel({ caseDetails }: CaseAppointmentsPanelProps) {
  const [filter, setFilter] = useState<string>("ALL");
  const appointments = useMemo(() => extractAppointments(caseDetails), [caseDetails]);

  const filteredAppointments = useMemo(() => {
    if (filter === "ALL") return appointments;
    return appointments.filter((appointment) => appointment.status === filter);
  }, [appointments, filter]);

  return (
    <Card className="border-2 border-border">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-xl font-bold text-foreground">Appointments</CardTitle>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full sm:w-[280px] border-2 border-border bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {filteredAppointments.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-border rounded-md">
            <p className="text-sm text-muted-foreground">
              {appointments.length === 0
                ? "No appointments yet."
                : "No appointments match this filter."}
            </p>
          </div>
        ) : (
          filteredAppointments.map((appointment) => (
            <AppointmentCard key={appointment.id} appointment={appointment} />
          ))
        )}
      </CardContent>
    </Card>
  );
}

