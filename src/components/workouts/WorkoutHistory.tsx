// @ts-nocheck
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, TrendingUp, CheckCircle } from "lucide-react";
import { format } from "date-fns";

export default function WorkoutHistory({ sessions }) {
  if (sessions.length === 0) {
    return (
      <Card className="border-2 border-gray-100">
        <CardContent className="py-12 text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-black mb-2">No Workout History</h3>
          <p className="text-gray-600">
            Complete your first workout to see your progress here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const moodColors = {
    excellent: "bg-green-100 text-green-800 border-green-300",
    good: "bg-blue-100 text-blue-800 border-blue-300",
    okay: "bg-yellow-100 text-yellow-800 border-yellow-300",
    tired: "bg-orange-100 text-orange-800 border-orange-300",
    struggling: "bg-red-100 text-red-800 border-red-300"
  };

  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <Card key={session.id} className="border-2 border-gray-100 hover:border-[#E31C25] transition-colors bg-white">
          <CardHeader className="border-b border-gray-100 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl font-bold text-black mb-1">
                  {session.workout_name}
                </CardTitle>
                <p className="text-sm text-gray-600 font-semibold">
                  {format(new Date(session.date), 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
              {session.mood && (
                <Badge variant="outline" className={`${moodColors[session.mood]} border-2 font-bold uppercase text-xs`}>
                  {session.mood}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#E31C25]" />
                <div>
                  <p className="text-xs text-gray-600 font-bold uppercase">Duration</p>
                  <p className="text-lg font-bold text-black">{session.duration_minutes}m</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-black" />
                <div>
                  <p className="text-xs text-gray-600 font-bold uppercase">Completion</p>
                  <p className="text-lg font-bold text-black">{session.completion_percentage}%</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#E31C25]" />
                <div>
                  <p className="text-xs text-gray-600 font-bold uppercase">Exercises</p>
                  <p className="text-lg font-bold text-black">{session.exercises_completed?.length || 0}</p>
                </div>
              </div>
            </div>

            {session.notes && (
              <div className="p-3 bg-gray-50 rounded-sm border-l-4 border-[#E31C25]">
                <p className="text-sm text-gray-700 font-medium">{session.notes}</p>
              </div>
            )}

            {session.exercises_completed && session.exercises_completed.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs text-gray-600 font-bold uppercase">Exercise Summary</p>
                {session.exercises_completed.slice(0, 3).map((ex, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-black">{ex.exercise_name}</span>
                    <span className="text-gray-600 font-semibold">
                      {ex.sets?.filter(s => s.completed).length || 0}/{ex.sets?.length || 0} sets
                    </span>
                  </div>
                ))}
                {session.exercises_completed.length > 3 && (
                  <p className="text-xs text-gray-500 font-semibold">
                    + {session.exercises_completed.length - 3} more exercises
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}