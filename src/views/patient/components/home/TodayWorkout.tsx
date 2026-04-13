// @ts-nocheck
import React, { useState, useEffect } from "react";
import { api } from "@/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Dumbbell, Clock, Play, CheckCircle } from "lucide-react";
import { format } from "date-fns";

export default function TodayWorkout({ userId }) {
  const [currentPlan, setCurrentPlan] = useState(null);
  const [todayWorkout, setTodayWorkout] = useState(null);

  useEffect(() => {
    loadTodayWorkout();
  }, [userId]);

  const loadTodayWorkout = async () => {
    const user = await api.auth.me();
    if (user.current_program_id) {
      const plan = await api.entities.WorkoutPlan.filter({ id: user.current_program_id });
      if (plan[0]) {
        setCurrentPlan(plan[0]);
        const dayOfWeek = format(new Date(), 'EEEE');
        const workout = plan[0].workouts?.find(w => w.day === dayOfWeek);
        setTodayWorkout(workout);
      }
    }
  };

  if (!currentPlan || !todayWorkout) {
    return (
      <Card className="border-2 shadow-md">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2 font-bold text-foreground">
            <Dumbbell className="w-5 h-5 text-primary" />
            TODAY'S WORKOUT
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-muted rounded-sm flex items-center justify-center mx-auto mb-4">
              <Dumbbell className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-bold text-foreground mb-2">Rest & Recovery Day</h3>
            <p className="text-muted-foreground mb-4">
              No workout scheduled. Focus on recovery and preparation.
            </p>
            <Link to={createPageUrl("Workouts")}>
              <Button variant="outline" className="border-2 font-semibold">
                View All Workouts
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 shadow-md">
      <CardHeader className="border-b">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2 mb-2 font-bold text-foreground">
              <Dumbbell className="w-5 h-5 text-primary" />
              TODAY'S WORKOUT
            </CardTitle>
            <h3 className="text-2xl font-bold text-foreground">{todayWorkout.name}</h3>
          </div>
          <Badge className="bg-primary text-primary-foreground border-none font-bold">
            {format(new Date(), 'EEEE')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-muted rounded-sm">
            <Clock className="w-5 h-5 text-foreground" />
            <div>
              <p className="text-sm text-muted-foreground font-semibold">ESTIMATED TIME</p>
              <p className="font-bold text-foreground">45-60 minutes</p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-foreground mb-3 uppercase text-sm">Exercises ({todayWorkout.exercises?.length || 0})</h4>
            {todayWorkout.exercises?.slice(0, 4).map((exercise, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-card border-2 border-border rounded-sm hover:border-primary transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-sm flex items-center justify-center">
                    <span className="text-sm font-bold text-primary-foreground">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{exercise.exercise_id}</p>
                    <p className="text-sm text-muted-foreground font-semibold">
                      {exercise.sets} sets × {exercise.reps}
                    </p>
                  </div>
                </div>
                <CheckCircle className="w-5 h-5 text-muted" />
              </div>
            ))}
            {todayWorkout.exercises?.length > 4 && (
              <p className="text-sm text-muted-foreground font-semibold text-center pt-2">
                +{todayWorkout.exercises.length - 4} more exercises
              </p>
            )}
          </div>

          <Link to={createPageUrl("Workouts")} className="block">
            <Button className="w-full bg-primary hover:opacity-90 text-primary-foreground font-bold py-6 text-lg">
              <Play className="w-5 h-5 mr-2" />
              START WORKOUT
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}