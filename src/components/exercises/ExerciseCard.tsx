// @ts-nocheck
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Edit, Trash2, Dumbbell } from "lucide-react";

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

export default function ExerciseCard({ exercise, isAdmin, onView, onEdit, onDelete }) {
  return (
    <Card className="border-2 border-gray-100 hover:border-[#E31C25] transition-all duration-300 hover:shadow-lg bg-white">
      <div className="relative">
        {exercise.video_url ? (
          <div className="relative aspect-video bg-black overflow-hidden">
            <video
              src={exercise.video_url}
              className="w-full h-full object-cover"
              poster={exercise.thumbnail_url}
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer" onClick={onView}>
              <div className="w-16 h-16 bg-[#E31C25] rounded-full flex items-center justify-center">
                <Play className="w-8 h-8 text-white ml-1" />
              </div>
            </div>
          </div>
        ) : (
          <div className="aspect-video bg-[#F5F5F5] flex items-center justify-center">
            <Dumbbell className="w-12 h-12 text-gray-400" />
          </div>
        )}
        <div className="absolute top-3 right-3">
          <Badge className={`${categoryColors[exercise.category] || 'bg-black text-white'} border-none font-bold uppercase text-xs`}>
            {exercise.category}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        <h3 className="font-bold text-lg text-black mb-2 line-clamp-1">
          {exercise.name}
        </h3>
        
        <p className="text-sm text-gray-600 mb-3 line-clamp-2 font-medium">
          {exercise.instructions || "No instructions available"}
        </p>

        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="outline" className={`${difficultyColors[exercise.difficulty]} border-2 font-bold text-xs`}>
            {exercise.difficulty?.toUpperCase()}
          </Badge>
          {exercise.muscle_groups?.slice(0, 2).map((muscle, idx) => (
            <Badge key={idx} variant="outline" className="border-2 border-black text-black font-bold text-xs">
              {muscle.toUpperCase()}
            </Badge>
          ))}
          {exercise.muscle_groups?.length > 2 && (
            <Badge variant="outline" className="border-2 border-gray-300 text-gray-600 font-bold text-xs">
              +{exercise.muscle_groups.length - 2}
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
            onClick={onView}
            variant="outline"
            className="flex-1 border-2 border-black text-black hover:bg-black hover:text-white font-bold text-sm"
          >
            VIEW DETAILS
          </Button>
          {isAdmin && (
            <>
              <Button
                onClick={onEdit}
                variant="outline"
                size="icon"
                className="border-2 border-gray-300 hover:border-[#E31C25] hover:text-[#E31C25]"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                onClick={onDelete}
                variant="outline"
                size="icon"
                className="border-2 border-gray-300 hover:border-red-500 hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}