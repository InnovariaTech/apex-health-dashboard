import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { Activity, Flame, Footprints, Heart } from "lucide-react";
import { useEnvironment } from "@/lib/EnvironmentContext";
import { mockWorkoutStats } from "@/mocks/static/dashboardFallbacks";

export default function WorkoutStatsPanel({ sessions }) {
  const { environment } = useEnvironment();
  const stats = mockWorkoutStats;

  const summaryCards = [
    { label: "Avg Heart Rate", value: stats.avgHeartRate, unit: "bpm", icon: Heart, color: "text-red-500" },
    { label: "Avg Calories", value: stats.avgCalories.toLocaleString(), unit: "kcal/day", icon: Flame, color: "text-orange-500" },
    { label: "Weekly Steps", value: stats.totalSteps.toLocaleString(), unit: "steps", icon: Footprints, color: "text-blue-500" },
    { label: "Active Minutes", value: stats.activeMinutes, unit: "min", icon: Activity, color: "text-green-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map(({ label, value, unit, icon: Icon, color }) => (
          <Card key={label} className="border-2 border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-5 h-5 ${color}`} />
                <p className="text-xs text-muted-foreground font-bold uppercase">{label}</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground font-semibold">{unit}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Steps Chart */}
      <Card className="border-2 border-border">
        <CardHeader className="border-b pb-4">
          <CardTitle className="flex items-center gap-2 font-bold text-foreground text-sm uppercase">
            <Footprints className="w-5 h-5 text-blue-500" />
            Daily Steps — This Week
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats.weeklySteps}>
              <XAxis dataKey="day" tick={{ fill: environment.textColor, fontSize: 12, fontWeight: "bold" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ backgroundColor: environment.surfaceColor, border: `2px solid ${environment.primaryColor}`, borderRadius: 4, fontWeight: "bold", color: environment.textColor }}
                formatter={(v) => [v.toLocaleString(), "Steps"]}
              />
              <Bar dataKey="steps" radius={[3, 3, 0, 0]}>
                {stats.weeklySteps.map((entry, i) => (
                  <Cell key={i} fill={entry.steps >= 10000 ? environment.primaryColor : environment.borderColor} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-muted-foreground text-center mt-2 font-semibold">Goal: 10,000 steps/day</p>
        </CardContent>
      </Card>

      {/* Calories & Heart Rate */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-2 border-border">
          <CardHeader className="border-b pb-4">
            <CardTitle className="flex items-center gap-2 font-bold text-foreground text-sm uppercase">
              <Flame className="w-5 h-5 text-orange-500" />
              Daily Calories Burned
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={stats.weeklySteps}>
                <XAxis dataKey="day" tick={{ fill: environment.textColor, fontSize: 12, fontWeight: "bold" }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ backgroundColor: environment.surfaceColor, border: `2px solid ${environment.primaryColor}`, borderRadius: 4, fontWeight: "bold", color: environment.textColor }}
                  formatter={(v) => [v.toLocaleString(), "kcal"]}
                />
                <Bar dataKey="calories" fill="#f97316" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-2 border-border">
          <CardHeader className="border-b pb-4">
            <CardTitle className="flex items-center gap-2 font-bold text-foreground text-sm uppercase">
              <Heart className="w-5 h-5 text-red-500" />
              Resting Heart Rate (bpm)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={stats.weeklySteps}>
                <XAxis dataKey="day" tick={{ fill: environment.textColor, fontSize: 12, fontWeight: "bold" }} axisLine={false} tickLine={false} />
                <YAxis domain={[60, 90]} hide />
                <Tooltip
                  contentStyle={{ backgroundColor: environment.surfaceColor, border: `2px solid ${environment.primaryColor}`, borderRadius: 4, fontWeight: "bold", color: environment.textColor }}
                  formatter={(v) => [`${v} bpm`, "Heart Rate"]}
                />
                <Line type="monotone" dataKey="heartRate" stroke="#ef4444" strokeWidth={3} dot={{ fill: "#ef4444", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}