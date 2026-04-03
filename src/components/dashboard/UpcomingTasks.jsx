import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Calendar, FlaskConical, FileText, Dumbbell, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useEnvironment } from "@/lib/EnvironmentContext";
import { format, addDays } from "date-fns";

const today = new Date();

const mockTasks = [
  { label: "Lab work due — Quarterly panel", icon: FlaskConical, due: format(addDays(today, 3), "MMM d"), priority: "high", page: "Biomarkers" },
  { label: "Weekly check-in form", icon: FileText, due: format(addDays(today, 1), "MMM d"), priority: "medium", page: "Progress" },
  { label: "Injection day — Testosterone", icon: CheckSquare, due: "Today", priority: "high", page: "MyTreatments" },
  { label: "Workout scheduled — Leg Day", icon: Dumbbell, due: "Today", priority: "low", page: "Workouts" },
  { label: "Provider follow-up appointment", icon: Calendar, due: format(addDays(today, 7), "MMM d"), priority: "medium", page: "Schedule" },
];

const priorityStyles = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-green-100 text-green-700",
};

export default function UpcomingTasks() {
  const { environment } = useEnvironment();

  return (
    <Card className="border-2 shadow-md">
      <CardHeader className="border-b pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase text-foreground">
          <CheckSquare className="w-4 h-4" style={{ color: environment.primaryColor }} />
          Upcoming Tasks & Reminders
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-2">
          {mockTasks.map((task, i) => (
            <Link key={i} to={createPageUrl(task.page)} className="block">
              <div className="flex items-center justify-between p-3 rounded-lg border hover:border-primary transition-colors cursor-pointer group" style={{ borderColor: "#e5e7eb" }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: environment.primaryColor + "15" }}>
                    <task.icon className="w-4 h-4" style={{ color: environment.primaryColor }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{task.label}</p>
                    <p className="text-xs text-muted-foreground font-medium">Due: {task.due}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`text-[10px] font-bold border-none ${priorityStyles[task.priority]}`}>
                    {task.priority}
                  </Badge>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}