// @ts-nocheck
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dumbbell, Target, Zap, Info } from "lucide-react";

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

export default function ExerciseDetails({ exercise, onClose }) {
  if (!exercise) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <Badge className={`${categoryColors[exercise.category] || 'bg-black text-white'} border-none font-bold uppercase`}>
            {exercise.category}
          </Badge>
          <Badge variant="outline" className={`${difficultyColors[exercise.difficulty]} border-2 font-bold uppercase`}>
            {exercise.difficulty}
          </Badge>
        </div>
        <h2 className="text-3xl font-bold text-black">{exercise.name}</h2>
      </div>

      {/* Video */}
      {exercise.video_url && (
        <div className="rounded-sm overflow-hidden border-2 border-gray-200">
          <video
            src={exercise.video_url}
            controls
            className="w-full"
            poster={exercise.thumbnail_url}
          />
        </div>
      )}

      {/* Quick Info */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {exercise.muscle_groups?.length > 0 && (
          <div className="p-4 bg-[#F5F5F5] rounded-sm">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-[#E31C25]" />
              <p className="text-xs font-bold text-gray-600 uppercase">Target Muscles</p>
            </div>
            <div className="flex flex-wrap gap-1">
              {exercise.muscle_groups.map((muscle, idx) => (
                <Badge key={idx} variant="outline" className="border-2 border-black text-black font-bold text-xs">
                  {muscle.toUpperCase()}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {exercise.equipment?.length > 0 && (
          <div className="p-4 bg-[#F5F5F5] rounded-sm">
            <div className="flex items-center gap-2 mb-2">
              <Dumbbell className="w-5 h-5 text-black" />
              <p className="text-xs font-bold text-gray-600 uppercase">Equipment</p>
            </div>
            <p className="text-sm font-semibold text-black">
              {exercise.equipment.join(", ")}
            </p>
          </div>
        )}

        <div className="p-4 bg-[#F5F5F5] rounded-sm">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-[#E31C25]" />
            <p className="text-xs font-bold text-gray-600 uppercase">Difficulty</p>
          </div>
          <p className="text-sm font-bold text-black uppercase">
            {exercise.difficulty}
          </p>
        </div>
      </div>

      {/* Instructions */}
      {exercise.instructions && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-black" />
            <h3 className="text-lg font-bold text-black uppercase">Instructions</h3>
          </div>
          <div className="p-4 bg-[#F5F5F5] rounded-sm border-l-4 border-[#E31C25]">
            <p className="text-sm text-gray-700 font-medium whitespace-pre-wrap">
              {exercise.instructions}
            </p>
          </div>
        </div>
      )}

      {/* Tips */}
      {exercise.tips && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#E31C25]" />
            <h3 className="text-lg font-bold text-black uppercase">Form Tips & Cues</h3>
          </div>
          <div className="p-4 bg-[#F5F5F5] rounded-sm border-l-4 border-black">
            <p className="text-sm text-gray-700 font-medium whitespace-pre-wrap">
              {exercise.tips}
            </p>
          </div>
        </div>
      )}

      {/* Close Button */}
      <div className="pt-4 border-t-2 border-gray-100">
        <Button
          onClick={onClose}
          variant="outline"
          className="w-full border-2 border-black text-black hover:bg-black hover:text-white font-bold"
        >
          CLOSE
        </Button>
      </div>
    </div>
  );
}