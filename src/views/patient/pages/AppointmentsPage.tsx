import { useEnvironment } from "@/lib/EnvironmentContext";
import CareAppointments from "@/views/patient/pages/CareAppointments";
import TrainerizeAppointments from "@/views/patient/pages/Appointments";

/**
 * `/Appointments`: visits with the Apex MD care team (Healthie) on the Apex MD portal; gym
 * portals keep their Trainerize appointments.
 */
export default function AppointmentsPage() {
  // EnvironmentContext is untyped; it always provides an environment with an `id`.
  const { environment } = useEnvironment() as { environment: { id: string } };
  return environment.id === "apex-md" ? <CareAppointments /> : <TrainerizeAppointments />;
}
