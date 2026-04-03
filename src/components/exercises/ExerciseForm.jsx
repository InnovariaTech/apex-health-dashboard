import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { UploadFile } from "@/integrations/Core";
import { Video, X, Loader2 } from "lucide-react";

export default function ExerciseForm({ exercise, onSave, onCancel }) {
  const [formData, setFormData] = useState(exercise || {
    name: "",
    category: "strength",
    muscle_groups: [],
    equipment: [],
    difficulty: "beginner",
    video_url: "",
    instructions: "",
    tips: ""
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newEquipment, setNewEquipment] = useState("");

  const muscleGroupOptions = [
    "chest", "back", "shoulders", "arms", "legs", "core", "glutes", "full_body"
  ];

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      setFormData({ ...formData, video_url: file_url });
    } catch (error) {
      console.error("Error uploading video:", error);
      alert("Failed to upload video. Please try again.");
    }
    setIsUploading(false);
  };

  const toggleMuscleGroup = (muscle) => {
    const current = formData.muscle_groups || [];
    if (current.includes(muscle)) {
      setFormData({
        ...formData,
        muscle_groups: current.filter(m => m !== muscle)
      });
    } else {
      setFormData({
        ...formData,
        muscle_groups: [...current, muscle]
      });
    }
  };

  const addEquipment = () => {
    if (newEquipment.trim()) {
      setFormData({
        ...formData,
        equipment: [...(formData.equipment || []), newEquipment.trim()]
      });
      setNewEquipment("");
    }
  };

  const removeEquipment = (index) => {
    setFormData({
      ...formData,
      equipment: formData.equipment.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.category) {
      alert("Please fill in all required fields");
      return;
    }
    setIsSaving(true);
    await onSave(formData);
    setIsSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Exercise Name */}
      <div>
        <Label className="text-sm font-bold text-black uppercase mb-2 block">
          Exercise Name *
        </Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Barbell Bench Press"
          required
          className="border-2 border-gray-200 focus:border-[#E31C25] font-semibold"
        />
      </div>

      {/* Video Upload */}
      <div>
        <Label className="text-sm font-bold text-black uppercase mb-2 block">
          Video Demonstration
        </Label>
        {formData.video_url ? (
          <div className="relative">
            <video
              src={formData.video_url}
              controls
              className="w-full rounded-sm border-2 border-gray-200"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setFormData({ ...formData, video_url: "" })}
              className="absolute top-2 right-2 bg-[#E31C25] hover:bg-black"
            >
              <X className="w-4 h-4 mr-1" />
              Remove
            </Button>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-sm p-8 text-center hover:border-[#E31C25] transition-colors">
            <input
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              className="hidden"
              id="video-upload"
              disabled={isUploading}
            />
            <label htmlFor="video-upload" className="cursor-pointer">
              {isUploading ? (
                <>
                  <Loader2 className="w-12 h-12 text-[#E31C25] mx-auto mb-3 animate-spin" />
                  <p className="text-sm text-gray-600 font-semibold">Uploading video...</p>
                </>
              ) : (
                <>
                  <Video className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 font-semibold mb-1">
                    Click to upload video or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">MP4, MOV, or AVI (max 100MB)</p>
                </>
              )}
            </label>
          </div>
        )}
      </div>

      {/* Category and Difficulty */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-bold text-black uppercase mb-2 block">
            Category *
          </Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value })}
          >
            <SelectTrigger className="border-2 border-gray-200 font-semibold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
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
          <Label className="text-sm font-bold text-black uppercase mb-2 block">
            Difficulty *
          </Label>
          <Select
            value={formData.difficulty}
            onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
          >
            <SelectTrigger className="border-2 border-gray-200 font-semibold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Muscle Groups */}
      <div>
        <Label className="text-sm font-bold text-black uppercase mb-2 block">
          Target Muscle Groups
        </Label>
        <div className="flex flex-wrap gap-2">
          {muscleGroupOptions.map((muscle) => (
            <Badge
              key={muscle}
              onClick={() => toggleMuscleGroup(muscle)}
              className={`cursor-pointer border-2 font-bold uppercase text-xs ${
                formData.muscle_groups?.includes(muscle)
                  ? "bg-[#E31C25] text-white border-[#E31C25]"
                  : "bg-white text-black border-black hover:bg-black hover:text-white"
              }`}
            >
              {muscle}
            </Badge>
          ))}
        </div>
      </div>

      {/* Equipment */}
      <div>
        <Label className="text-sm font-bold text-black uppercase mb-2 block">
          Required Equipment
        </Label>
        <div className="flex gap-2 mb-2">
          <Input
            value={newEquipment}
            onChange={(e) => setNewEquipment(e.target.value)}
            placeholder="e.g., Barbell, Dumbbells"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addEquipment())}
            className="border-2 border-gray-200 focus:border-[#E31C25] font-semibold"
          />
          <Button
            type="button"
            onClick={addEquipment}
            variant="outline"
            className="border-2 border-black text-black hover:bg-black hover:text-white font-bold"
          >
            ADD
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.equipment?.map((item, index) => (
            <Badge
              key={index}
              className="bg-black text-white border-2 border-black font-bold text-xs"
            >
              {item}
              <X
                className="w-3 h-3 ml-1 cursor-pointer hover:text-[#E31C25]"
                onClick={() => removeEquipment(index)}
              />
            </Badge>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div>
        <Label className="text-sm font-bold text-black uppercase mb-2 block">
          Instructions
        </Label>
        <Textarea
          value={formData.instructions}
          onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
          placeholder="Step-by-step instructions for performing the exercise..."
          rows={4}
          className="border-2 border-gray-200 focus:border-[#E31C25] font-semibold"
        />
      </div>

      {/* Tips */}
      <div>
        <Label className="text-sm font-bold text-black uppercase mb-2 block">
          Form Tips & Cues
        </Label>
        <Textarea
          value={formData.tips}
          onChange={(e) => setFormData({ ...formData, tips: e.target.value })}
          placeholder="Pro tips and common mistakes to avoid..."
          rows={3}
          className="border-2 border-gray-200 focus:border-[#E31C25] font-semibold"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t-2 border-gray-100">
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
          className="flex-1 border-2 border-gray-300 text-black hover:bg-gray-100 font-bold"
          disabled={isSaving}
        >
          CANCEL
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-[#E31C25] hover:bg-black text-white font-bold"
          disabled={isSaving || isUploading}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              SAVING...
            </>
          ) : (
            exercise ? "UPDATE EXERCISE" : "CREATE EXERCISE"
          )}
        </Button>
      </div>
    </form>
  );
}