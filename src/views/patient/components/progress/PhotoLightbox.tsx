// @ts-nocheck
import { format, parseISO } from "date-fns";
import { AlertCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { usePhotoDetail } from "@/hooks/trainerize/usePhotos";
import {
  PHOTO_POSE_LABELS,
  toDataUrl,
  type Photo,
  type PhotoPose,
} from "@/types/trainerize/photos_types";

/**
 * Full-size photo lightbox. Lazy — only fetches the binary when the dialog
 * is open. Backed by `GET /me/photos/detail?thumbnail=false`.
 */

export interface PhotoLightboxProps {
  photo: Photo | null;
  onClose: () => void;
}

export default function PhotoLightbox({ photo, onClose }: PhotoLightboxProps) {
  const open = photo != null;
  const detail = usePhotoDetail(photo?.id, false, open);

  const pose = (photo?.pose as PhotoPose) ?? "front";
  const poseLabel = PHOTO_POSE_LABELS[pose] ?? String(photo?.pose ?? "");
  const dateLabel = photo?.date ? safeFormat(photo.date) : "";

  const hasUrl = Boolean(photo?.url);
  const src = hasUrl
    ? photo!.url!
    : detail.data
      ? toDataUrl(detail.data)
      : null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>Progress photo</span>
            {photo && (
              <>
                <Badge variant="outline" className="text-muted-foreground">
                  {poseLabel}
                </Badge>
                <span className="text-sm font-normal text-muted-foreground">
                  {dateLabel}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  #{photo.id}
                </span>
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="bg-muted/40 rounded-sm overflow-hidden min-h-[320px] flex items-center justify-center">
          {src ? (
            <img
              src={src}
              alt={photo ? `${poseLabel} on ${photo.date}` : "Photo"}
              className="max-w-full max-h-[82vh] object-contain"
            />
          ) : detail.isError ? (
            <div className="text-center text-muted-foreground p-6">
              <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold mb-1">Couldn't load photo</p>
              <p className="text-xs">
                {(detail.error as { message?: string } | undefined)?.message ??
                  "Please close and try again."}
              </p>
            </div>
          ) : (
            <div className="text-center text-muted-foreground p-6">
              <Loader2 className="w-10 h-10 mx-auto animate-spin" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function safeFormat(date: string): string {
  try {
    return format(parseISO(date), "EEEE, MMM d, yyyy");
  } catch {
    return date;
  }
}
