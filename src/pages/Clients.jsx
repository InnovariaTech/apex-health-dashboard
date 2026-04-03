import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Search, Activity, Calendar, Dumbbell, TrendingUp, Mail, Phone, Edit, UserPlus, MessageSquare } from "lucide-react";
import { format } from "date-fns";

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientStats, setClientStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const filterClients = useCallback(() => {
    if (!searchTerm) { setFilteredClients(clients); return; }
    setFilteredClients(clients.filter(c =>
      c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    ));
  }, [clients, searchTerm]);

  useEffect(() => { filterClients(); }, [filterClients]);

  const loadData = async () => {
    setIsLoading(true);
    const allUsers = await api.entities.User.list();
    const clientList = allUsers.filter(u => u.role !== "admin");
    setClients(clientList);
    setFilteredClients(clientList);
    const programList = await api.entities.WorkoutPlan.list();
    setPrograms(programList);
    setIsLoading(false);
  };

  const handleViewClient = async (client) => {
    setSelectedClient(client);
    const [sessions, checkIns] = await Promise.all([
      api.entities.WorkoutSession.filter({ user_id: client.email }, '-date', 30),
      api.entities.CheckIn.filter({ user_id: client.email }, '-check_in_date', 5)
    ]);
    const sorted = [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date));
    let streak = 0;
    for (let i = 0; i < sorted.length; i++) {
      if (i === 0 || Math.abs(new Date(sorted[i].date) - new Date(sorted[i-1].date)) <= 86400000) streak++;
      else break;
    }
    setClientStats({
      totalWorkouts: sessions.length,
      recentCheckIn: checkIns[0],
      workoutStreak: streak,
      avgCompletion: sessions.length > 0 ? Math.round(sessions.reduce((sum, s) => sum + (s.completion_percentage || 0), 0) / sessions.length) : 0
    });
  };

  const getClientProgram = (client) => programs.find(p => p.id === client.current_program_id);

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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">CLIENT MANAGEMENT</h1>
            <p className="text-muted-foreground font-semibold">{filteredClients.length} clients total</p>
          </div>
          <Button className="bg-primary hover:bg-primary/80 text-primary-foreground font-bold">
            <UserPlus className="w-5 h-5 mr-2" />INVITE CLIENT
          </Button>
        </div>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input placeholder="Search clients by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 border-2 border-border focus:border-primary font-semibold" />
      </div>

      {filteredClients.length === 0 ? (
        <Card className="border-2 border-border">
          <CardContent className="py-12 text-center">
            <Users className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">No clients found</h3>
            <p className="text-muted-foreground">{searchTerm ? "Try adjusting your search" : "Start by inviting your first client"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => {
            const program = getClientProgram(client);
            return (
              <Card key={client.email} className="border-2 border-border hover:border-primary transition-all duration-300 hover:shadow-lg bg-card cursor-pointer" onClick={() => handleViewClient(client)}>
                <CardHeader className="border-b-2 border-border bg-muted">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-primary rounded-sm flex items-center justify-center">
                      <span className="text-primary-foreground font-bold text-2xl">{client.full_name?.[0]?.toUpperCase() || 'U'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-foreground truncate">{client.full_name}</h3>
                      <p className="text-sm text-muted-foreground truncate font-semibold">{client.email}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  {client.health_score && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-muted-foreground uppercase">Health Score</span>
                        <span className="text-lg font-bold text-foreground">{Math.round(client.health_score)}/100</span>
                      </div>
                      <div className="h-3 bg-border rounded-sm overflow-hidden">
                        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${client.health_score}%` }} />
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-sm">
                    <Dumbbell className="w-5 h-5 text-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground font-bold uppercase">Program</p>
                      <p className="text-sm font-bold text-foreground truncate">{program ? program.name : 'No program assigned'}</p>
                    </div>
                  </div>
                  {client.fitness_goal && (
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-sm">
                      <Activity className="w-5 h-5 text-primary flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground font-bold uppercase">Goal</p>
                        <p className="text-sm font-bold text-foreground capitalize">{client.fitness_goal.replace('_', ' ')}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button onClick={(e) => { e.stopPropagation(); handleViewClient(client); }} variant="outline" className="flex-1 border-2 border-border font-bold hover:bg-primary hover:text-primary-foreground hover:border-primary">
                      VIEW DETAILS
                    </Button>
                    <Button onClick={(e) => e.stopPropagation()} className="bg-primary hover:bg-primary/80 text-primary-foreground font-bold px-4">
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!selectedClient} onOpenChange={() => { setSelectedClient(null); setClientStats(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedClient && (
            <div className="space-y-6">
              <DialogHeader>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-20 h-20 bg-primary rounded-sm flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-3xl">{selectedClient.full_name?.[0]?.toUpperCase() || 'U'}</span>
                  </div>
                  <div>
                    <DialogTitle className="text-3xl font-bold text-foreground">{selectedClient.full_name}</DialogTitle>
                    <p className="text-muted-foreground font-medium mt-1">{selectedClient.email}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge className="bg-foreground text-background font-bold">CLIENT</Badge>
                      {selectedClient.fitness_goal && (
                        <Badge variant="outline" className="border-2 border-primary text-primary font-bold capitalize">{selectedClient.fitness_goal.replace('_', ' ')}</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </DialogHeader>

              {clientStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { icon: Activity, label: "Health Score", value: selectedClient.health_score ? Math.round(selectedClient.health_score) : '--', primary: true },
                    { icon: Dumbbell, label: "Total Workouts", value: clientStats.totalWorkouts, primary: false },
                    { icon: TrendingUp, label: "Avg Completion", value: `${clientStats.avgCompletion}%`, primary: true },
                    { icon: Calendar, label: "Streak", value: `${clientStats.workoutStreak} days`, primary: false },
                  ].map(({ icon: Icon, label, value, primary }) => (
                    <Card key={label} className="border-2 border-border bg-card">
                      <CardContent className="p-4 text-center">
                        <Icon className={`w-8 h-8 ${primary ? 'text-primary' : 'text-foreground'} mx-auto mb-2`} />
                        <p className="text-xs text-muted-foreground font-bold uppercase">{label}</p>
                        <p className="text-2xl font-bold text-foreground">{value}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-2 border-border bg-card">
                  <CardHeader className="border-b-2 border-border bg-muted">
                    <CardTitle className="text-lg font-bold text-foreground uppercase">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground font-bold uppercase">Email</p>
                        <p className="text-sm font-semibold text-foreground">{selectedClient.email}</p>
                      </div>
                    </div>
                    {selectedClient.emergency_contact && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground font-bold uppercase">Emergency Contact</p>
                          <p className="text-sm font-semibold text-foreground">{selectedClient.emergency_contact}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card className="border-2 border-border bg-card">
                  <CardHeader className="border-b-2 border-border bg-muted">
                    <CardTitle className="text-lg font-bold text-foreground uppercase">Training Details</CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground font-bold uppercase mb-1">Current Program</p>
                      <p className="text-sm font-semibold text-foreground">{getClientProgram(selectedClient)?.name || 'No program assigned'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-bold uppercase mb-1">Fitness Goal</p>
                      <p className="text-sm font-semibold text-foreground capitalize">{selectedClient.fitness_goal?.replace('_', ' ') || 'Not set'}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {clientStats?.recentCheckIn && (
                <Card className="border-2 border-border bg-card">
                  <CardHeader className="border-b-2 border-border bg-muted">
                    <CardTitle className="text-lg font-bold text-foreground uppercase">Latest Check-In</CardTitle>
                  </CardHeader>
                  <CardContent className="p-5">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground font-bold uppercase mb-1">Date</p>
                        <p className="text-sm font-semibold text-foreground">{format(new Date(clientStats.recentCheckIn.check_in_date), 'MMM d, yyyy')}</p>
                      </div>
                      {clientStats.recentCheckIn.weight && (
                        <div>
                          <p className="text-xs text-muted-foreground font-bold uppercase mb-1">Weight</p>
                          <p className="text-sm font-semibold text-foreground">{clientStats.recentCheckIn.weight} lbs</p>
                        </div>
                      )}
                      {clientStats.recentCheckIn.overall_feeling && (
                        <div>
                          <p className="text-xs text-muted-foreground font-bold uppercase mb-1">Overall Feeling</p>
                          <p className="text-sm font-semibold text-foreground capitalize">{clientStats.recentCheckIn.overall_feeling}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 border-2 border-border font-bold" onClick={() => setSelectedClient(null)}>CLOSE</Button>
                <Button className="flex-1 bg-primary hover:bg-primary/80 text-primary-foreground font-bold"><MessageSquare className="w-4 h-4 mr-2" />MESSAGE CLIENT</Button>
                <Button className="flex-1 bg-foreground hover:bg-foreground/80 text-background font-bold"><Edit className="w-4 h-4 mr-2" />EDIT DETAILS</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}