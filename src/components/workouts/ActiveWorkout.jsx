import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  Circle, 
  Clock,
  Save,
  X
} from "lucide-react";
import { format } from "date-fns";

export default function ActiveWorkout({ session, onSave, onCancel }) {
  const [workoutData, setWorkoutData] = useState(session);
  const [startTime] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const elapsedMinutes = Math.floor((currentTime - startTime) / 60000);

  const updateSet = (exerciseIdx, setIdx, field, value) => {
    const updated = { ...workoutData };
    updated.exercises_completed[exerciseIdx].sets[setIdx][field] = value;
    setWorkoutData(updated);
  };

  const toggleSetComplete = (exerciseIdx, setIdx) => {
    const updated = { ...workoutData };
    const set = updated.exercises_completed[exerciseIdx].sets[setIdx];
    set.completed = !set.completed;
    setWorkoutData(updated);
  };

  const handleFinish = () => {
    onSave({
      ...workoutData,
      duration_minutes: elapsedMinutes
    });
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Timer Header */}
      <div className="sticky top-0 bg-white border-b-2 border-gray-100 p-4 mb-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-[#E31C25]" />
            <div>
              <p className="text-xs text-gray-600 font-bold uppercase">Elapsed Time</p>
              <p className="text-2xl font-bold text-black">
                {Math.floor(elapsedMinutes / 60)}:{(elapsedMinutes % 60).toString().padStart(2, '0')}
              </p>
            </div>
          </div>
          <Badge className="bg-gray-100 text-black border-2 border-black font-bold">
            {format(new Date(), 'MMM d, yyyy')}
          </Badge>
        </div>
      </div>

      {/* Exercises */}
      <div className="space-y-6 p-4">
        {workoutData.exercises_completed.map((exercise, exerciseIdx) => (
          <Card key={exerciseIdx} className="border-2 border-gray-100 bg-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-black rounded-sm flex items-center justify-center">
                  <span className="text-white font-bold">{exerciseIdx + 1}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-black">{exercise.exercise_name}</h3>
                  <p className="text-sm text-gray-600 font-semibold">
                    {exercise.sets.length} sets
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {exercise.sets.map((set, setIdx) => (
                  <div 
                    key={setIdx}
                    className={`p-3 border-2 rounded-sm transition-all ${
                      set.completed 
                        ? 'border-[#E31C25] bg-red-50' 
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        onClick={() => toggleSetComplete(exerciseIdx, setIdx)}
                        className="flex-shrink-0"
                      >
                        {set.completed ? (
                          <CheckCircle className="w-6 h-6 text-[#E31C25]" />
                        ) : (
                          <Circle className="w-6 h-6 text-gray-400" />
                        )}
                      </button>
                      <span className="font-bold text-black">Set {set.set_number}</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 ml-8">
                      <div>
                        <label className="text-xs text-gray-600 font-bold uppercase block mb-1">
                          Reps
                        </label>
                        <Input
                          type="number"
                          value={set.reps || ''}
                          onChange={(e) => updateSet(exerciseIdx, setIdx, 'reps', parseInt(e.target.value) || 0)}
                          className="h-9 border-2 border-gray-200 focus:border-[#E31C25] font-bold"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 font-bold uppercase block mb-1">
                          Weight (lbs)
                        </label>
                        <Input
                          type="number"
                          value={set.weight || ''}
                          onChange={(e) => updateSet(exerciseIdx, setIdx, 'weight', parseInt(e.target.value) || 0)}
                          className="h-9 border-2 border-gray-200 focus:border-[#E31C25] font-bold"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 font-bold uppercase block mb-1">
                          RPE (1-10)
                        </label>
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          value={set.rpe || ''}
                          onChange={(e) => updateSet(exerciseIdx, setIdx, 'rpe', parseInt(e.target.value) || 5)}
                          className="h-9 border-2 border-gray-200 focus:border-[#E31C25] font-bold"
                          placeholder="5"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Notes Section */}
      <div className="p-4">
        <Card className="border-2 border-gray-100 bg-white">
          <CardContent className="p-4">
            <label className="text-sm font-bold text-black uppercase mb-2 block">
              Workout Notes
            </label>
            <Textarea
              value={workoutData.notes || ''}
              onChange={(e) => setWorkoutData({ ...workoutData, notes: e.target.value })}
              placeholder="How did the workout feel? Any modifications or observations..."
              rows={3}
              className="border-2 border-gray-200 focus:border-[#E31C25] font-semibold"
            />
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="sticky bottom-0 bg-white border-t-2 border-gray-100 p-4 flex gap-3">
        <Button
          onClick={onCancel}
          variant="outline"
          className="flex-1 border-2 border-gray-300 text-black hover:bg-gray-100 font-bold py-6"
        >
          <X className="w-5 h-5 mr-2" />
          CANCEL
        </Button>
        <Button
          onClick={handleFinish}
          className="flex-1 bg-[#E31C25] hover:bg-black text-white font-bold py-6"
        >
          <Save className="w-5 h-5 mr-2" />
          FINISH WORKOUT
        </Button>
      </div>
    </div>
  );
}