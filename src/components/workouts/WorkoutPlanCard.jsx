import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Target, Dumbbell } from "lucide-react";

export default function WorkoutPlanCard({ plan }) {
  const goalColors = {
    weight_loss: "bg-[#E31C25] text-white",
    muscle_gain: "bg-black text-white",
    athletic_performance: "bg-gray-700 text-white",
    general_health: "bg-gray-600 text-white",
    injury_recovery: "bg-gray-800 text-white"
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-gray-100 shadow-lg bg-white">
        <CardHeader className="border-b-2 border-gray-100 bg-gray-50">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold text-black mb-2">
                {plan.name}
              </CardTitle>
              <p className="text-gray-600 font-semibold">{plan.description}</p>
            </div>
            <Badge className={`${goalColors[plan.goal] || 'bg-black text-white'} border-none font-bold`}>
              {plan.goal?.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-sm">
              <Calendar className="w-5 h-5 text-[#E31C25]" />
              <div>
                <p className="text-xs text-gray-600 font-bold uppercase">Duration</p>
                <p className="text-lg font-bold text-black">{plan.duration_weeks} weeks</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-sm">
              <Dumbbell className="w-5 h-5 text-black" />
              <div>
                <p className="text-xs text-gray-600 font-bold uppercase">Workouts</p>
                <p className="text-lg font-bold text-black">{plan.workouts?.length || 0} days/week</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-sm">
              <Target className="w-5 h-5 text-[#E31C25]" />
              <div>
                <p className="text-xs text-gray-600 font-bold uppercase">Difficulty</p>
                <p className="text-lg font-bold text-black capitalize">{plan.difficulty}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-black uppercase">Weekly Schedule</h3>
            {plan.workouts?.map((workout, idx) => (
              <div 
                key={idx}
                className="p-4 bg-white border-2 border-gray-100 rounded-sm hover:border-[#E31C25] transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-black">{workout.day}</h4>
                    <p className="text-sm text-gray-600 font-semibold">{workout.name}</p>
                  </div>
                  <Badge variant="outline" className="border-2 border-black text-black font-bold">
                    {workout.exercises?.length || 0} exercises
                  </Badge>
                </div>
                {workout.exercises && workout.exercises.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {workout.exercises.slice(0, 3).map((ex, i) => (
                      <p key={i} className="text-sm text-gray-600 font-semibold">
                        • {ex.exercise_id} - {ex.sets} × {ex.reps}
                      </p>
                    ))}
                    {workout.exercises.length > 3 && (
                      <p className="text-sm text-gray-500 font-semibold">
                        + {workout.exercises.length - 3} more exercises
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}