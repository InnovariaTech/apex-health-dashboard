import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dumbbell, Calendar, Target, Users, Search, Library, ListChecks, CheckCircle } from "lucide-react";
import ExerciseLibraryTab from "../components/workouts/ExerciseLibraryTab";

export default function Programs() {
  const [programs, setPrograms] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [filteredPrograms, setFilteredPrograms] = useState([]);
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => { loadData(); }, []);

  const filterPrograms = useCallback(() => {
    if (!searchTerm) { setFilteredPrograms(programs); return; }
    setFilteredPrograms(programs.filter(p =>
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase())
    ));
  }, [programs, searchTerm]);

  useEffect(() => { filterPrograms(); }, [filterPrograms]);

  const loadData = async () => {
    setIsLoading(true);
    const user = await api.auth.me();
    setCurrentUser(user);
    const [programList, exerciseList] = await Promise.all([
      api.entities.WorkoutPlan.list("-created_date"),
      api.entities.Exercise.list("-created_date")
    ]);
    setPrograms(programList);
    setExercises(exerciseList);
    if (user.role === "admin") {
      const allUsers = await api.entities.User.list();
      setClients(allUsers.filter(u => u.role !== "admin"));
    }
    setIsLoading(false);
  };

  const handleAssignProgram = async () => {
    if (!selectedProgram || !selectedClient) return;
    await api.entities.User.update(selectedClient.email, { current_program_id: selectedProgram.id });
    alert(`Program "${selectedProgram.name}" assigned to ${selectedClient.full_name}!`);
    setShowAssignDialog(false);
    setSelectedClient(null);
    setSelectedProgram(null);
  };

  const isAdmin = currentUser?.role === "admin";

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
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">PROGRAM MANAGEMENT</h1>
        <p className="text-muted-foreground font-semibold">Manage programs, workouts, and exercises</p>
      </div>

      <Tabs defaultValue="programs" className="space-y-6">
        <TabsList className="grid w-full md:w-auto grid-cols-3 bg-muted p-1">
          <TabsTrigger value="programs" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold">
            <ListChecks className="w-4 h-4 mr-2" />PROGRAMS
          </TabsTrigger>
          <TabsTrigger value="workouts" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold">
            <Dumbbell className="w-4 h-4 mr-2" />WORKOUTS
          </TabsTrigger>
          <TabsTrigger value="exercises" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold">
            <Library className="w-4 h-4 mr-2" />EXERCISES
          </TabsTrigger>
        </TabsList>

        <TabsContent value="programs" className="space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input placeholder="Search programs..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 border-2 border-border focus:border-primary font-semibold" />
          </div>

          {filteredPrograms.length === 0 ? (
            <Card className="border-2 border-border">
              <CardContent className="py-12 text-center">
                <Dumbbell className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">No programs found</h3>
                <p className="text-muted-foreground">{searchTerm ? "Try adjusting your search" : "No training programs available yet"}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredPrograms.map((program) => (
                <Card key={program.id} className="border-2 border-border hover:border-primary transition-all duration-300 hover:shadow-xl bg-card cursor-pointer" onClick={() => setSelectedProgram(program)}>
                  <CardHeader className="border-b-2 border-border bg-muted">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-primary text-primary-foreground border-none font-bold uppercase text-xs">{program.goal?.replace('_', ' ')}</Badge>
                      <Badge variant="outline" className="border-2 border-border font-bold uppercase text-xs">{program.difficulty}</Badge>
                    </div>
                    <CardTitle className="text-2xl font-bold text-foreground mb-1">{program.name}</CardTitle>
                    <p className="text-sm text-muted-foreground font-medium line-clamp-2">{program.description}</p>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 bg-muted rounded-sm">
                        <Calendar className="w-5 h-5 text-primary mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground font-bold uppercase">Duration</p>
                        <p className="text-lg font-bold text-foreground">{program.duration_weeks}w</p>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-sm">
                        <Dumbbell className="w-5 h-5 text-foreground mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground font-bold uppercase">Workouts</p>
                        <p className="text-lg font-bold text-foreground">{program.workouts?.length || 0}/wk</p>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-sm">
                        <Target className="w-5 h-5 text-primary mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground font-bold uppercase">Time</p>
                        <p className="text-lg font-bold text-foreground">45-60m</p>
                      </div>
                    </div>
                    {program.workouts?.length > 0 && (
                      <div className="space-y-2 mb-4">
                        <p className="text-xs font-bold text-foreground uppercase">Weekly Schedule</p>
                        {program.workouts.slice(0, 3).map((workout, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-card border-2 border-border rounded-sm">
                            <span className="text-sm font-semibold text-foreground">{workout.day}: {workout.name}</span>
                            <Badge variant="outline" className="border-2 border-border font-bold text-xs">{workout.exercises?.length || 0} ex</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                    {isAdmin && (
                      <Button onClick={(e) => { e.stopPropagation(); setSelectedProgram(program); setShowAssignDialog(true); }} className="w-full bg-primary hover:bg-primary/80 text-primary-foreground font-bold">
                        <Users className="w-4 h-4 mr-2" />ASSIGN TO CLIENT
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="workouts">
          <Card className="border-2 border-border">
            <CardHeader className="border-b-2 border-border bg-muted">
              <CardTitle className="text-xl font-bold text-foreground uppercase">Workout Templates Management</CardTitle>
            </CardHeader>
            <CardContent className="p-6 text-center py-12">
              <Dumbbell className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">Workout Builder</h3>
              <p className="text-muted-foreground mb-2">Workouts are created within Programs. Use the Programs tab to create complete workout programs with weekly schedules.</p>
              <p className="text-sm text-muted-foreground">Tip: Each program can contain multiple workout days with customized exercise routines.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exercises">
          <ExerciseLibraryTab exercises={exercises} onExercisesUpdate={setExercises} />
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedProgram && !showAssignDialog} onOpenChange={() => setSelectedProgram(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedProgram && (
            <div className="space-y-6">
              <DialogHeader>
                <div className="flex items-center gap-2 mb-3">
                  <Badge className="bg-primary text-primary-foreground border-none font-bold uppercase">{selectedProgram.goal?.replace('_', ' ')}</Badge>
                  <Badge variant="outline" className="border-2 border-border font-bold uppercase">{selectedProgram.difficulty}</Badge>
                </div>
                <DialogTitle className="text-3xl font-bold text-foreground">{selectedProgram.name}</DialogTitle>
                <p className="text-muted-foreground font-medium mt-2">{selectedProgram.description}</p>
              </DialogHeader>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: Calendar, label: "Duration", value: `${selectedProgram.duration_weeks} weeks`, primary: true },
                  { icon: Dumbbell, label: "Frequency", value: `${selectedProgram.workouts?.length || 0}x/week`, primary: false },
                  { icon: Target, label: "Session Time", value: "45-60min", primary: true },
                ].map(({ icon: Icon, label, value, primary }) => (
                  <div key={label} className="p-4 bg-muted rounded-sm text-center">
                    <Icon className={`w-6 h-6 ${primary ? 'text-primary' : 'text-foreground'} mx-auto mb-2`} />
                    <p className="text-xs text-muted-foreground font-bold uppercase">{label}</p>
                    <p className="text-2xl font-bold text-foreground">{value}</p>
                  </div>
                ))}
              </div>
              {selectedProgram.workouts?.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-foreground uppercase">Weekly Workout Schedule</h3>
                  {selectedProgram.workouts.map((workout, idx) => (
                    <Card key={idx} className="border-2 border-border">
                      <CardHeader className="bg-muted border-b-2 border-border">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-bold text-muted-foreground uppercase">{workout.day}</p>
                            <h4 className="text-lg font-bold text-foreground">{workout.name}</h4>
                          </div>
                          <Badge variant="outline" className="border-2 border-border font-bold">{workout.exercises?.length || 0} exercises</Badge>
                        </div>
                      </CardHeader>
                      {workout.exercises?.length > 0 && (
                        <CardContent className="p-4 space-y-2">
                          {workout.exercises.map((ex, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-card border-2 border-border rounded-sm">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-foreground rounded-sm flex items-center justify-center">
                                  <span className="text-background font-bold text-sm">{i + 1}</span>
                                </div>
                                <div>
                                  <p className="font-bold text-foreground">{ex.exercise_id}</p>
                                  <p className="text-sm text-muted-foreground font-semibold">{ex.sets} sets × {ex.reps} reps</p>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground font-semibold">Rest: {ex.rest_seconds}s</p>
                            </div>
                          ))}
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              )}
              <div className="flex gap-3">
                <Button onClick={() => setSelectedProgram(null)} variant="outline" className="flex-1 border-2 border-border font-bold">CLOSE</Button>
                {isAdmin && (
                  <Button onClick={() => setShowAssignDialog(true)} className="flex-1 bg-primary hover:bg-primary/80 text-primary-foreground font-bold">
                    <Users className="w-4 h-4 mr-2" />ASSIGN TO CLIENT
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-foreground">ASSIGN PROGRAM</DialogTitle>
            <p className="text-muted-foreground font-medium mt-2">Assign "{selectedProgram?.name}" to a client</p>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold text-foreground uppercase mb-2 block">Select Client</label>
              <Select value={selectedClient?.email} onValueChange={(email) => setSelectedClient(clients.find(c => c.email === email))}>
                <SelectTrigger className="border-2 border-border font-semibold"><SelectValue placeholder="Choose a client..." /></SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.email} value={client.email}>{client.full_name} ({client.email})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => { setShowAssignDialog(false); setSelectedClient(null); }} variant="outline" className="flex-1 border-2 border-border font-bold">CANCEL</Button>
              <Button onClick={handleAssignProgram} disabled={!selectedClient} className="flex-1 bg-primary hover:bg-primary/80 text-primary-foreground font-bold disabled:opacity-50">
                <CheckCircle className="w-4 h-4 mr-2" />ASSIGN
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}