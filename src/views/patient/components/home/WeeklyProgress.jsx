import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp } from "lucide-react";
import { format, startOfWeek, addDays } from "date-fns";
import { useEnvironment } from "@/lib/EnvironmentContext";

export default function WeeklyProgress({ sessions }) {
  const { environment } = useEnvironment();
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const chartData = weekDays.map((day, index) => {
    const date = format(addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), index), 'yyyy-MM-dd');
    const daySession = sessions.find(s => s.date === date);
    return {
      day,
      completion: daySession?.completion_percentage || 0,
      hasWorkout: !!daySession
    };
  });

  const weeklyAverage = sessions.reduce((sum, s) => sum + (s.completion_percentage || 0), 0) / sessions.length || 0;

  return (
    <Card className="border-2 shadow-md">
      <CardHeader className="border-b">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 font-bold text-foreground">
            <TrendingUp className="w-5 h-5 text-primary" />
            THIS WEEK'S PROGRESS
          </CardTitle>
          <div className="text-right">
            <p className="text-xs text-muted-foreground font-bold uppercase">Avg Completion</p>
            <p className="text-3xl font-bold text-foreground">{Math.round(weeklyAverage)}%</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <XAxis
              dataKey="day"
              tick={{ fill: environment.textColor, fontSize: 12, fontWeight: 'bold' }}
              axisLine={false}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                backgroundColor: environment.surfaceColor,
                border: `2px solid ${environment.primaryColor}`,
                borderRadius: '4px',
                fontWeight: 'bold',
                color: environment.textColor,
              }}
              formatter={(value) => [`${value}%`, 'COMPLETION']}
            />
            <Bar dataKey="completion" radius={[2, 2, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.hasWorkout ? environment.primaryColor : environment.borderColor}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center p-4 bg-muted rounded-sm">
            <p className="text-xs text-muted-foreground font-bold uppercase">Workouts</p>
            <p className="text-3xl font-bold text-foreground mt-1">{sessions.length}</p>
          </div>
          <div className="text-center p-4 bg-muted rounded-sm">
            <p className="text-xs text-muted-foreground font-bold uppercase">Streak</p>
            <p className="text-3xl font-bold text-primary mt-1">{sessions.length >= 3 ? '3+' : sessions.length}</p>
          </div>
          <div className="text-center p-4 bg-muted rounded-sm">
            <p className="text-xs text-muted-foreground font-bold uppercase">Total Time</p>
            <p className="text-3xl font-bold text-foreground mt-1">
              {sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)}m
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}