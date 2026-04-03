import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Dumbbell, Info, Edit, Trash2, Plus } from "lucide-react";
import { Exercise } from "@/entities/Exercise";
import { User } from "@/entities/User";
import ExerciseForm from "../exercises/ExerciseForm";

const categoryColors = {
  strength: "bg-[#E31C25] text-white",
  cardio: "bg-black text-white",
  flexibility: "bg-gray-600 text-white",
  mobility: "bg-gray-700 text-white",
  core: "bg-[#E31C25] text-white",
  balance: "bg-black text-white"
};

const difficultyColors = {
  beginner: "bg-green-100 text-green-800 border-green-300",
  intermediate: "bg-yellow-100 text-yellow-800 border-yellow-300",
  advanced: "bg-red-100 text-red-800 border-red-300"
};

export default function ExerciseLibraryTab({ exercises: initialExercises, onExercisesUpdate }) {
  const [exercises, setExercises] = useState(initialExercises);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [muscleGroupFilter, setMuscleGroupFilter] = useState("all");
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [editingExercise, setEditingExercise] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  React.useEffect(() => {
    loadUser();
  }, []);

  React.useEffect(() => {
    setExercises(initialExercises);
  }, [initialExercises]);

  const loadUser = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const isAdmin = currentUser?.role === "admin";

  const filteredExercises = useMemo(() => {
    let filtered = [...exercises];

    if (searchTerm) {
      filtered = filtered.filter(ex =>
        ex.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ex.instructions?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(ex => ex.category === categoryFilter);
    }

    if (difficultyFilter !== "all") {
      filtered = filtered.filter(ex => ex.difficulty === difficultyFilter);
    }

    if (muscleGroupFilter !== "all") {
      filtered = filtered.filter(ex =>
        ex.muscle_groups?.includes(muscleGroupFilter)
      );
    }

    return filtered;
  }, [exercises, searchTerm, categoryFilter, difficultyFilter, muscleGroupFilter]);

  const handleSaveExercise = async (exerciseData) => {
    if (editingExercise) {
      await Exercise.update(editingExercise.id, exerciseData);
    } else {
      await Exercise.create(exerciseData);
    }
    setShowEditDialog(false);
    setEditingExercise(null);
    
    // Refresh exercises
    const updatedExercises = await Exercise.list("-created_date");
    setExercises(updatedExercises);
    if (onExercisesUpdate) {
      onExercisesUpdate(updatedExercises);
    }
  };

  const handleDeleteExercise = async (exerciseId, e) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this exercise?")) {
      await Exercise.delete(exerciseId);
      const updatedExercises = await Exercise.list("-created_date");
      setExercises(updatedExercises);
      if (onExercisesUpdate) {
        onExercisesUpdate(updatedExercises);
      }
    }
  };

  const handleEditExercise = (exercise, e) => {
    e.stopPropagation();
    setEditingExercise(exercise);
    setShowEditDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <Card className="border-2 border-gray-100 bg-gray-50">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-black uppercase">Exercise Statistics</h3>
            {isAdmin && (
              <Button
                onClick={() => {
                  setEditingExercise(null);
                  setShowEditDialog(true);
                }}
                className="bg-[#E31C25] hover:bg-black text-white font-bold"
              >
                <Plus className="w-4 h-4 mr-2" />
                ADD EXERCISE
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-black">{exercises.length}</p>
              <p className="text-sm text-gray-600 font-semibold uppercase">Total Exercises</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-[#E31C25]">
                {exercises.filter(e => e.category === "strength").length}
              </p>
              <p className="text-sm text-gray-600 font-semibold uppercase">Strength</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-black">
                {exercises.filter(e => e.category === "cardio").length}
              </p>
              <p className="text-sm text-gray-600 font-semibold uppercase">Cardio</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-[#E31C25]">
                {exercises.filter(e => e.difficulty === "beginner").length}
              </p>
              <p className="text-sm text-gray-600 font-semibold uppercase">Beginner Friendly</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="border-2 border-gray-100">
        <CardHeader className="border-b-2 border-gray-100">
          <CardTitle className="text-lg font-bold text-black uppercase">
            Filter Exercises
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search exercises..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-2 border-gray-200 focus:border-[#E31C25] font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-bold text-black uppercase mb-2 block">
                Category
              </label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="border-2 border-gray-200 font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="strength">Strength</SelectItem>
                  <SelectItem value="cardio">Cardio</SelectItem>
                  <SelectItem value="flexibility">Flexibility</SelectItem>
                  <SelectItem value="mobility">Mobility</SelectItem>
                  <SelectItem value="core">Core</SelectItem>
                  <SelectItem value="balance">Balance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-bold text-black uppercase mb-2 block">
                Difficulty
              </label>
              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger className="border-2 border-gray-200 font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-bold text-black uppercase mb-2 block">
                Muscle Group
              </label>
              <Select value={muscleGroupFilter} onValueChange={setMuscleGroupFilter}>
                <SelectTrigger className="border-2 border-gray-200 font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Muscles</SelectItem>
                  <SelectItem value="chest">Chest</SelectItem>
                  <SelectItem value="back">Back</SelectItem>
                  <SelectItem value="shoulders">Shoulders</SelectItem>
                  <SelectItem value="arms">Arms</SelectItem>
                  <SelectItem value="legs">Legs</SelectItem>
                  <SelectItem value="core">Core</SelectItem>
                  <SelectItem value="glutes">Glutes</SelectItem>
                  <SelectItem value="full_body">Full Body</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exercise Grid */}
      {filteredExercises.length === 0 ? (
        <Card className="border-2 border-gray-100">
          <CardContent className="py-12 text-center">
            <Dumbbell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-black mb-2">No exercises found</h3>
            <p className="text-gray-600">
              Try adjusting your filters to see more results
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600 font-semibold">
              Showing {filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExercises.map((exercise) => (
              <Card
                key={exercise.id}
                className="border-2 border-gray-100 hover:border-[#E31C25] transition-all duration-300 hover:shadow-lg bg-white cursor-pointer"
                onClick={() => setSelectedExercise(exercise)}
              >
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <Badge className={`${categoryColors[exercise.category] || 'bg-black text-white'} border-none font-bold uppercase text-xs`}>
                      {exercise.category}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`${difficultyColors[exercise.difficulty]} border-2 font-bold text-xs`}>
                        {exercise.difficulty?.toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  <h3 className="font-bold text-lg text-black mb-2 line-clamp-1">
                    {exercise.name}
                  </h3>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-2 font-medium">
                    {exercise.instructions || "No instructions available"}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {exercise.muscle_groups?.slice(0, 3).map((muscle, idx) => (
                      <Badge key={idx} variant="outline" className="border-2 border-black text-black font-bold text-xs">
                        {muscle.toUpperCase()}
                      </Badge>
                    ))}
                    {exercise.muscle_groups?.length > 3 && (
                      <Badge variant="outline" className="border-2 border-gray-300 text-gray-600 font-bold text-xs">
                        +{exercise.muscle_groups.length - 3}
                      </Badge>
                    )}
                  </div>

                  {exercise.equipment?.length > 0 && (
                    <p className="text-xs text-gray-500 mb-3 font-semibold">
                      Equipment: {exercise.equipment.join(", ")}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 border-2 border-black text-black hover:bg-black hover:text-white font-bold text-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedExercise(exercise);
                      }}
                    >
                      <Info className="w-4 h-4 mr-2" />
                      VIEW
                    </Button>
                    {isAdmin && (
                      <>
                        <Button
                          variant="outline"
                          size="icon"
                          className="border-2 border-gray-300 hover:border-[#E31C25] hover:text-[#E31C25]"
                          onClick={(e) => handleEditExercise(exercise, e)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="border-2 border-gray-300 hover:border-red-500 hover:text-red-500"
                          onClick={(e) => handleDeleteExercise(exercise.id, e)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Exercise Details Dialog */}
      <Dialog open={!!selectedExercise} onOpenChange={() => setSelectedExercise(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedExercise && (
            <div className="space-y-6">
              <DialogHeader>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Badge className={`${categoryColors[selectedExercise.category] || 'bg-black text-white'} border-none font-bold uppercase`}>
                      {selectedExercise.category}
                    </Badge>
                    <Badge variant="outline" className={`${difficultyColors[selectedExercise.difficulty]} border-2 font-bold uppercase`}>
                      {selectedExercise.difficulty}
                    </Badge>
                  </div>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingExercise(selectedExercise);
                        setShowEditDialog(true);
                        setSelectedExercise(null);
                      }}
                      className="border-2 border-[#E31C25] text-[#E31C25] hover:bg-[#E31C25] hover:text-white font-bold"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      EDIT
                    </Button>
                  )}
                </div>
                <DialogTitle className="text-3xl font-bold text-black">
                  {selectedExercise.name}
                </DialogTitle>
              </DialogHeader>

              {/* Video */}
              {selectedExercise.video_url && (
                <div className="rounded-sm overflow-hidden border-2 border-gray-200">
                  <video
                    src={selectedExercise.video_url}
                    controls
                    className="w-full"
                    poster={selectedExercise.thumbnail_url}
                  />
                </div>
              )}

              {/* Quick Info */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {selectedExercise.muscle_groups?.length > 0 && (
                  <div className="p-4 bg-gray-50 rounded-sm">
                    <p className="text-xs font-bold text-gray-600 uppercase mb-2">Target Muscles</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedExercise.muscle_groups.map((muscle, idx) => (
                        <Badge key={idx} variant="outline" className="border-2 border-black text-black font-bold text-xs">
                          {muscle.toUpperCase()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedExercise.equipment?.length > 0 && (
                  <div className="p-4 bg-gray-50 rounded-sm">
                    <p className="text-xs font-bold text-gray-600 uppercase mb-2">Equipment</p>
                    <p className="text-sm font-semibold text-black">
                      {selectedExercise.equipment.join(", ")}
                    </p>
                  </div>
                )}

                <div className="p-4 bg-gray-50 rounded-sm">
                  <p className="text-xs font-bold text-gray-600 uppercase mb-2">Difficulty</p>
                  <p className="text-sm font-bold text-black uppercase">
                    {selectedExercise.difficulty}
                  </p>
                </div>
              </div>

              {/* Instructions */}
              {selectedExercise.instructions && (
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-black uppercase">Instructions</h3>
                  <div className="p-4 bg-gray-50 rounded-sm border-l-4 border-[#E31C25]">
                    <p className="text-sm text-gray-700 font-medium whitespace-pre-wrap">
                      {selectedExercise.instructions}
                    </p>
                  </div>
                </div>
              )}

              {/* Tips */}
              {selectedExercise.tips && (
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-black uppercase">Form Tips & Cues</h3>
                  <div className="p-4 bg-gray-50 rounded-sm border-l-4 border-black">
                    <p className="text-sm text-gray-700 font-medium whitespace-pre-wrap">
                      {selectedExercise.tips}
                    </p>
                  </div>
                </div>
              )}

              <Button
                onClick={() => setSelectedExercise(null)}
                variant="outline"
                className="w-full border-2 border-black text-black hover:bg-black hover:text-white font-bold"
              >
                CLOSE
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit/Add Exercise Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-black uppercase">
              {editingExercise ? "EDIT EXERCISE" : "ADD NEW EXERCISE"}
            </DialogTitle>
          </DialogHeader>
          <ExerciseForm
            exercise={editingExercise}
            onSave={handleSaveExercise}
            onCancel={() => {
              setShowEditDialog(false);
              setEditingExercise(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}