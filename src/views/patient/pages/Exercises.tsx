// @ts-nocheck

import React, { useState, useEffect, useCallback } from "react";
import { Exercise } from "@/entities/Exercise";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
import { 
  Dumbbell, 
  Plus, 
  Search
} from "lucide-react";

import ExerciseCard from "@/components/exercises/ExerciseCard";
import ExerciseForm from "@/components/exercises/ExerciseForm";
import ExerciseDetails from "@/components/exercises/ExerciseDetails";

export default function Exercises() {
  const [exercises, setExercises] = useState([]);
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [muscleGroupFilter, setMuscleGroupFilter] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const filterExercises = useCallback(() => {
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

    setFilteredExercises(filtered);
  }, [exercises, searchTerm, categoryFilter, difficultyFilter, muscleGroupFilter]);

  useEffect(() => {
    filterExercises();
  }, [filterExercises]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);
      
      const exerciseList = await Exercise.list("-created_date");
      setExercises(exerciseList);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const handleSaveExercise = async (exerciseData) => {
    if (editingExercise) {
      await Exercise.update(editingExercise.id, exerciseData);
    } else {
      await Exercise.create(exerciseData);
    }
    setShowAddDialog(false);
    setEditingExercise(null);
    loadData();
  };

  const handleEditExercise = (exercise) => {
    setEditingExercise(exercise);
    setShowAddDialog(true);
  };

  const handleDeleteExercise = async (exerciseId) => {
    if (confirm("Are you sure you want to delete this exercise?")) {
      await Exercise.delete(exerciseId);
      loadData();
    }
  };

  const isAdmin = currentUser?.role === "admin";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E31C25]"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-white min-h-screen">
      {/* Header */}
      <div className="mb-8 pb-6 border-b-2 border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-black mb-2">
              EXERCISE LIBRARY
            </h1>
            <p className="text-gray-600 font-semibold">
              {filteredExercises.length} exercises available
            </p>
          </div>
          {isAdmin && (
            <Button
              onClick={() => {
                setEditingExercise(null);
                setShowAddDialog(true);
              }}
              className="bg-[#E31C25] hover:bg-black text-white font-bold"
            >
              <Plus className="w-5 h-5 mr-2" />
              ADD EXERCISE
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
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
      </div>

      {/* Exercise Grid */}
      {filteredExercises.length === 0 ? (
        <Card className="border-2 border-gray-100">
          <CardContent className="py-12 text-center">
            <Dumbbell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-black mb-2">No exercises found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || categoryFilter !== "all" || difficultyFilter !== "all" || muscleGroupFilter !== "all"
                ? "Try adjusting your filters"
                : "Start by adding your first exercise"}
            </p>
            {isAdmin && (
              <Button
                onClick={() => {
                  setEditingExercise(null);
                  setShowAddDialog(true);
                }}
                variant="outline"
                className="border-2 border-black text-black hover:bg-black hover:text-white font-bold"
              >
                <Plus className="w-5 h-5 mr-2" />
                ADD FIRST EXERCISE
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              isAdmin={isAdmin}
              onView={() => setSelectedExercise(exercise)}
              onEdit={() => handleEditExercise(exercise)}
              onDelete={() => handleDeleteExercise(exercise.id)}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Exercise Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-black">
              {editingExercise ? "EDIT EXERCISE" : "ADD NEW EXERCISE"}
            </DialogTitle>
          </DialogHeader>
          <ExerciseForm
            exercise={editingExercise}
            onSave={handleSaveExercise}
            onCancel={() => {
              setShowAddDialog(false);
              setEditingExercise(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Exercise Details Dialog */}
      <Dialog open={!!selectedExercise} onOpenChange={() => setSelectedExercise(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <ExerciseDetails
            exercise={selectedExercise}
            onClose={() => setSelectedExercise(null)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
