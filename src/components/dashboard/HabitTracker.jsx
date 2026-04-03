import React, { useState } from "react";
import { api } from "@/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Droplet, Moon, Activity, Heart, Check } from "lucide-react";
import { format } from "date-fns";

export default function HabitTracker({ userId, todayHabits, onUpdate }) {
  const [habits, setHabits] = useState(todayHabits || {
    water_intake: 0,
    sleep_hours: 0,
    steps: 0,
    energy_level: 5
  });
  const [isSaving, setIsSaving] = useState(false);

  const habitItems = [
    { key: 'water_intake', label: 'Water', icon: Droplet, unit: 'oz', target: 64 },
    { key: 'sleep_hours', label: 'Sleep', icon: Moon, unit: 'hrs', target: 8 },
    { key: 'steps', label: 'Steps', icon: Activity, unit: '', target: 10000 },
    { key: 'energy_level', label: 'Energy', icon: Heart, unit: '/10', target: 10 },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    const today = format(new Date(), 'yyyy-MM-dd');
    if (todayHabits?.id) {
      await api.entities.HabitLog.update(todayHabits.id, habits);
    } else {
      await api.entities.HabitLog.create({ user_id: userId, date: today, ...habits });
    }
    onUpdate();
    setIsSaving(false);
  };

  return (
    <Card className="border-2 shadow-md h-full">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 font-bold text-foreground">
          <Heart className="w-5 h-5 text-primary" />
          DAILY HABITS
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {habitItems.map(item => (
          <div key={item.key} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <item.icon className="w-4 h-4 text-foreground" />
                <span className="text-sm font-bold text-foreground uppercase">{item.label}</span>
              </div>
              <Badge variant="outline" className="text-xs font-bold border-2">
                {habits[item.key] || 0}{item.unit}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={habits[item.key] || 0}
                onChange={(e) => setHabits({...habits, [item.key]: parseFloat(e.target.value) || 0})}
                className="h-9 border-2 font-semibold"
                placeholder="0"
              />
              {habits[item.key] >= item.target && (
                <Check className="w-5 h-5 text-primary flex-shrink-0" />
              )}
            </div>
            <div className="h-3 bg-muted rounded-sm overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${Math.min((habits[item.key] / item.target) * 100, 100)}%` }}
              />
            </div>
          </div>
        ))}

        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full mt-4 bg-primary hover:opacity-90 text-primary-foreground font-bold py-6"
        >
          {isSaving ? 'SAVING...' : 'SAVE HABITS'}
        </Button>
      </CardContent>
    </Card>
  );
}