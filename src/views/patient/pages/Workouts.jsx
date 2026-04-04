import React, { useState, useEffect } from "react";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Dumbbell, Play, CheckCircle, Calendar, TrendingUp, Clock, Flame, Library, BarChart2 } from "lucide-react";
import { format } from "date-fns";
import WorkoutPlanCard from "@/components/workouts/WorkoutPlanCard";
import ActiveWorkout from "@/components/workouts/ActiveWorkout";
import WorkoutHistory from "@/components/workouts/WorkoutHistory";
import ExerciseLibraryTab from "@/components/workouts/ExerciseLibraryTab";
import WorkoutStatsPanel from "@/components/workouts/WorkoutStatsPanel";

export default function Workouts() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [todayWorkout, setTodayWorkout] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    const user = await api.auth.me();
    setCurrentUser(user);
    const exerciseList = await api.entities.Exercise.list();
    setExercises(exerciseList);
    if (user.current_program_id) {
      const plans = await api.entities.WorkoutPlan.filter({ id: user.current_program_id });
      if (plans[0]) {
        setCurrentPlan(plans[0]);
        const dayOfWeek = format(new Date(), 'EEEE');
        setTodayWorkout(plans[0].workouts?.find(w => w.day === dayOfWeek));
      }
    }
    const { mockWeekSessions } = await import("@/mocks/static/dashboardFallbacks");
    const sessions = await api.entities.WorkoutSession.filter({ user_id: user.email }, '-date', 10);
    setRecentSessions(sessions.length > 0 ? sessions : mockWeekSessions);
    setIsLoading(false);
  };

  const handleStartWorkout = () => {
    if (todayWorkout) {
      setActiveSession({
        user_id: currentUser.email,
        workout_plan_id: currentPlan.id,
        workout_name: todayWorkout.name,
        date: format(new Date(), 'yyyy-MM-dd'),
        exercises_completed: todayWorkout.exercises?.map(ex => ({
          exercise_id: ex.exercise_id,
          exercise_name: ex.exercise_id,
          sets: Array(ex.sets).fill(null).map((_, i) => ({ set_number: i + 1, reps: 0, weight: 0, rpe: 5, completed: false }))
        })) || []
      });
    }
  };

  const handleSaveWorkout = async (sessionData) => {
    const completedExercises = sessionData.exercises_completed.filter(ex => ex.sets.some(s => s.completed)).length;
    const totalExercises = sessionData.exercises_completed.length;
    await api.entities.WorkoutSession.create({
      ...sessionData,
      duration_minutes: sessionData.duration_minutes || 45,
      completion_percentage: Math.round((completedExercises / totalExercises) * 100),
      notes: sessionData.notes || "",
      mood: sessionData.mood || "good"
    });
    setActiveSession(null);
    loadData();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-background min-h-screen">
      <div className="mb-8 pb-6 border-b-2 border-border">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">WORKOUTS</h1>
        <p className="text-muted-foreground font-semibold">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      <Tabs defaultValue="today" className="space-y-6">
        <TabsList className="grid w-full md:w-auto grid-cols-5 bg-muted p-1">
          <TabsTrigger value="today" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold">
            <Calendar className="w-4 h-4 mr-2" />TODAY
          </TabsTrigger>
          <TabsTrigger value="program" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold">
            <Dumbbell className="w-4 h-4 mr-2" />PROGRAM
          </TabsTrigger>
          <TabsTrigger value="exercises" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold">
            <Library className="w-4 h-4 mr-2" />EXERCISES
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold">
            <TrendingUp className="w-4 h-4 mr-2" />HISTORY
          </TabsTrigger>
          <TabsTrigger value="stats" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold">
            <BarChart2 className="w-4 h-4 mr-2" />STATS
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-6">
          {todayWorkout ? (
            <Card className="border-2 border-border shadow-lg bg-card">
              <CardHeader className="border-b-2 border-border bg-muted">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl font-bold text-foreground mb-2">{todayWorkout.name}</CardTitle>
                    <p className="text-muted-foreground font-semibold">{todayWorkout.exercises?.length || 0} exercises • Est. 45-60 min</p>
                  </div>
                  <Badge className="bg-primary text-primary-foreground border-none font-bold">{format(new Date(), 'EEEE')}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {todayWorkout.exercises?.map((exercise, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-card border-2 border-border rounded-sm hover:border-primary transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary rounded-sm flex items-center justify-center">
                          <span className="text-primary-foreground font-bold">{idx + 1}</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-foreground">{exercise.exercise_id}</h4>
                          <p className="text-sm text-muted-foreground font-semibold">{exercise.sets} sets × {exercise.reps} • Rest {exercise.rest_seconds}s</p>
                        </div>
                      </div>
                      <CheckCircle className="w-6 h-6 text-muted-foreground/40" />
                    </div>
                  ))}
                </div>
                <Button onClick={handleStartWorkout} className="w-full mt-6 bg-primary hover:bg-primary/80 text-primary-foreground font-bold py-6 text-lg">
                  <Play className="w-6 h-6 mr-2" />START WORKOUT
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-2 border-border">
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 bg-muted rounded-sm flex items-center justify-center mx-auto mb-4">
                  <Dumbbell className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Rest Day</h3>
                <p className="text-muted-foreground mb-4">No workout scheduled for today. Focus on recovery!</p>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Flame, label: "This Week", value: recentSessions.filter(s => new Date(s.date) >= new Date(Date.now() - 7*86400000)).length, suffix: "workouts", usePrimary: true },
              { icon: Clock, label: "Total Time", value: recentSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0), suffix: "minutes", usePrimary: false },
              { icon: CheckCircle, label: "Completion", value: recentSessions.length > 0 ? Math.round(recentSessions.reduce((sum, s) => sum + (s.completion_percentage || 0), 0) / recentSessions.length) + '%' : '0%', suffix: "average", usePrimary: true },
              { icon: TrendingUp, label: "Streak", value: 3, suffix: "days", usePrimary: false },
            ].map(({ icon: Icon, label, value, suffix, usePrimary }) => (
              <Card key={label} className="border-2 border-border bg-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-5 h-5 ${usePrimary ? 'text-primary' : 'text-foreground'}`} />
                    <p className="text-xs text-muted-foreground font-bold uppercase">{label}</p>
                  </div>
                  <p className={`text-2xl font-bold ${usePrimary ? 'text-primary' : 'text-foreground'}`}>{value}</p>
                  <p className="text-xs text-muted-foreground font-semibold">{suffix}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="program">
          {currentPlan ? <WorkoutPlanCard plan={currentPlan} /> : (
            <Card className="border-2 border-border">
              <CardContent className="py-12 text-center">
                <Dumbbell className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">No Program Assigned</h3>
                <p className="text-muted-foreground">Contact your coach to get a personalized workout program.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="exercises">
          <ExerciseLibraryTab exercises={exercises} onExercisesUpdate={setExercises} />
        </TabsContent>

        <TabsContent value="history">
          <WorkoutHistory sessions={recentSessions} />
        </TabsContent>

        <TabsContent value="stats">
          <WorkoutStatsPanel sessions={recentSessions} />
        </TabsContent>
      </Tabs>

      <Dialog open={!!activeSession} onOpenChange={() => setActiveSession(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-foreground">{activeSession?.workout_name}</DialogTitle>
          </DialogHeader>
          {activeSession && <ActiveWorkout session={activeSession} onSave={handleSaveWorkout} onCancel={() => setActiveSession(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}