import { type ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Dumbbell, AlertCircle } from "lucide-react";
import { useTrainerizeLink } from "@/hooks/trainerize/useLinkage";

/**
 * Render-gate for any Trainerize-backed page. Calls `GET /me/link`; if the
 * response data is `null` (user has no linked Trainerize account), shows a
 * contact-admin prompt instead of children. Mirrors the doc flow
 * (CLIENT_DASHBOARD_INTEGRATION.md → "Entry Point — Always Check Linkage").
 *
 * Provisioning is admin-driven via the admin dashboard's AddUser hub. The
 * patient portal does not self-provision (per project memory).
 */
export interface TrainerizeGateProps {
  children: ReactNode;
}

export default function TrainerizeGate({ children }: TrainerizeGateProps) {
  const { data, isLoading, isError, error } = useTrainerizeLink();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (isError) {
    const message =
      (error as { message?: string } | undefined)?.message ??
      "Could not check Trainerize linkage";
    return (
      <div className="p-4 md:p-9 max-w-[720px] mx-auto bg-background text-foreground">
        <Card className="border-2 border-border">
          <CardContent className="p-6 flex items-start gap-3 text-destructive">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold mb-1">Trainerize unavailable</p>
              <p className="text-sm text-muted-foreground">{message}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 md:p-9 max-w-[720px] mx-auto bg-background text-foreground">
        <Card className="border-2 border-border">
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold mb-2">
              Trainerize isn't connected yet
            </h2>
            <p className="text-sm text-muted-foreground">
              Your workouts, programs, and trainer messages are powered by
              Trainerize. Your account hasn't been linked yet — please contact
              your trainer or admin to get set up.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
