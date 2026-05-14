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

type BadgeVariant =
  | "default"
  | "dark"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "warning"
  | "danger"
  | "info";

const STATUS_FILTERS = [
  { value: "ALL", label: "All Statuses" },
  { value: "ACCEPTED_BY_PROVIDER", label: "Accepted By Provider" },
  { value: "MISSED_BY_PROVIDER", label: "Missed Appointment By Provider" },
  { value: "MISSED_BY_PATIENT", label: "Missed Appointment By Patient" },
  { value: "NEEDS_RESCHEDULING", label: "No-Show - Needs Rescheduling" },
];

const STATUS_BADGE: Record<
  AppointmentStatus,
  { text: string; variant: BadgeVariant }
> = {
  SCHEDULED: { text: "Scheduled", variant: "info" },
  ACCEPTED_BY_PROVIDER: { text: "Accepted", variant: "success" },
  EXPIRED: { text: "Expired - Scheduled", variant: "warning" },
  COMPLETED: { text: "Completed", variant: "secondary" },
  MISSED_BY_PROVIDER: { text: "Missed by Provider", variant: "danger" },
  MISSED_BY_PATIENT: { text: "Missed by Patient", variant: "danger" },
  NEEDS_RESCHEDULING: { text: "Needs Rescheduling", variant: "warning" },
};

function AppointmentCard({ appointment }: { appointment: NormalizedAppointment }) {
  const badge = STATUS_BADGE[appointment.status] ?? STATUS_BADGE.SCHEDULED;
  const sourceLabel = appointment.source
    ? appointment.source.charAt(0).toUpperCase() + appointment.source.slice(1)
    : "Source";

  return (
    <div className="rounded-[10px] border border-border bg-surface-2 p-4 space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <p className="text-[14px] font-medium text-foreground leading-snug">
            Scheduled via {sourceLabel} - {appointment.title}
          </p>
          <p className="text-[12px] font-mono text-muted-foreground mt-1">
            {formatAppointmentRange(appointment)}
          </p>
        </div>
        <Badge variant={badge.variant} className="whitespace-nowrap shrink-0">
          {badge.text}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[12px]">
        <span className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-ink-2">
          <Clock3 className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="font-mono">{appointment.durationMinutes}</span> minutes
        </span>
        <span className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-ink-2">
          <PhoneCall className="w-3.5 h-3.5 text-primary" />
          {formatMeetingType(appointment.meetingType)}
        </span>
        <span className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-ink-2">
          <Calendar className="w-3.5 h-3.5 text-primary" />
          {sourceLabel}
        </span>
        {appointment.providerName && (
          <span className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-ink-2">
            <UserRound className="w-3.5 h-3.5 text-primary" />
            {appointment.providerName}
          </span>
        )}
      </div>

      {appointment.notes && (
        <div className="rounded-md border border-border bg-card p-3">
          <p className="apex-eyebrow mb-1.5">Meeting Notes</p>
          <p className="text-[13px] text-ink-2 leading-relaxed">{appointment.notes}</p>
        </div>
      )}
    </div>
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
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-xl">Appointments</CardTitle>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full sm:w-[280px]">
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
          <div className="py-10 text-center border border-dashed border-border rounded-[10px]">
            <p className="text-[13px] text-muted-foreground">
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
