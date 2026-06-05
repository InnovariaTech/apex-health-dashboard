// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Loader2, Upload, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { useUploadPhoto } from "@/hooks/trainerize/usePhotos";
import {
  PHOTO_MAX_SIZE_BYTES,
  PHOTO_POSE_LABELS,
  PHOTO_POSE_VALUES,
  type PhotoPose,
} from "@/types/trainerize/photos_types";

/**
 * Upload-photo dialog. Sends multipart/form-data per `docs/trainerize/goals/
 * upload-photo.md`. Validates file size client-side (10 MB) to avoid round-
 * tripping a known-bad upload — backend will still reject if the request body
 * exceeds the gateway limit.
 */

export interface UploadPhotoDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function UploadPhotoDialog({
  open,
  onClose,
}: UploadPhotoDialogProps) {
  const upload = useUploadPhoto();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [date, setDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [pose, setPose] = useState<PhotoPose>("front");

  useEffect(() => {
    if (open) {
      setFile(null);
      setDate(format(new Date(), "yyyy-MM-dd"));
      setPose("front");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [open]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.files?.[0] ?? null;
    if (next && next.size > PHOTO_MAX_SIZE_BYTES) {
      toast({
        title: "File too large",
        description: `Max ${Math.round(PHOTO_MAX_SIZE_BYTES / 1024 / 1024)} MB.`,
      });
      e.target.value = "";
      setFile(null);
      return;
    }
    setFile(next);
  };

  const handleUpload = async () => {
    if (!file) {
      toast({ title: "Pick a photo first" });
      return;
    }
    if (!date) {
      toast({ title: "Choose a date" });
      return;
    }
    try {
      await upload.mutateAsync({ file, date, pose });
      toast({
        title: "Photo uploaded",
        description: `${PHOTO_POSE_LABELS[pose]} • ${date}`,
      });
      onClose();
    } catch (err) {
      toast({
        title: "Couldn't upload photo",
        description:
          (err as { message?: string } | undefined)?.message ??
          "Please try again.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Upload progress photo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="photo-file">Photo</Label>
            <Input
              id="photo-file"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFile}
            />
            {file && (
              <p className="text-xs text-muted-foreground">
                {file.name} — {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="photo-date">Date</Label>
              <Input
                id="photo-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="photo-pose">Pose</Label>
              <Select value={pose} onValueChange={(v) => setPose(v as PhotoPose)}>
                <SelectTrigger id="photo-pose">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PHOTO_POSE_VALUES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PHOTO_POSE_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-start gap-2 text-xs text-muted-foreground border border-border rounded-sm p-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              Photos are stored in Trainerize. They'll appear in the gallery
              shortly after upload — date and pose are reflected from the
              Trainerize record.
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={upload.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() => void handleUpload()}
            disabled={upload.isPending || !file}
            className="gap-2"
          >
            {upload.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
