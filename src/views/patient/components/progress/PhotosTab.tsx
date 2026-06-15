// @ts-nocheck
import { useMemo, useState } from "react";
import { format, parseISO, subDays } from "date-fns";
import {
  Camera,
  Upload,
  Loader2,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePhotoDetail, usePhotos } from "@/hooks/trainerize/usePhotos";
import {
  PHOTO_POSE_LABELS,
  toDataUrl,
  type Photo,
  type PhotoPose,
} from "@/types/trainerize/photos_types";
import UploadPhotoDialog from "./UploadPhotoDialog";
import PhotoLightbox from "./PhotoLightbox";

/**
 * Photos tab — Trainerize progress photos.
 * See `docs/trainerize/goals/list-photos.md`, `upload-photo.md`.
 *
 * Limitation flagged in `docs/trainerize/goals/README.md`:
 *   "photos/getByID is not exposed — no binary download proxy yet."
 *
 * So we render id / date / pose metadata only. If the backend later adds a
 * `url` field to the list response, the card automatically renders the
 * thumbnail (the type already includes the optional field).
 */

const RANGE_PRESETS = {
  "90d": { days: 90, label: "Last 90 days" },
  "180d": { days: 180, label: "Last 180 days" },
  "365d": { days: 365, label: "Last year" },
  all: { days: 365 * 5, label: "All time (5y)" },
} as const;

type RangeKey = keyof typeof RANGE_PRESETS;

export default function PhotosTab() {
  const [rangeKey, setRangeKey] = useState<RangeKey>("365d");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [opened, setOpened] = useState<Photo | null>(null);

  const { startDate, endDate } = useMemo(() => {
    const today = new Date();
    return {
      startDate: format(subDays(today, RANGE_PRESETS[rangeKey].days), "yyyy-MM-dd"),
      endDate: format(today, "yyyy-MM-dd"),
    };
  }, [rangeKey]);

  const { data, isLoading, isError, error } = usePhotos(startDate, endDate);
  const total = data?.total ?? 0;
  const photos = data?.photos ?? [];

  // Group by date so chronological cards are easier to scan.
  const grouped = useMemo(() => {
    const map = new Map<string, Photo[]>();
    for (const p of photos) {
      const key = p.date ?? "unknown";
      const arr = map.get(key) ?? [];
      arr.push(p);
      map.set(key, arr);
    }
    return Array.from(map.entries()).sort((a, b) =>
      a[0] < b[0] ? 1 : a[0] > b[0] ? -1 : 0,
    );
  }, [photos]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            Progress photos
          </h2>
          <p className="text-sm text-muted-foreground">
            {RANGE_PRESETS[rangeKey].label} • {total} total
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={rangeKey}
            onValueChange={(v) => setRangeKey(v as RangeKey)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(RANGE_PRESETS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setUploadOpen(true)} className="gap-2">
            <Upload className="w-4 h-4" /> Upload photo
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-12 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : isError ? (
        <Card>
          <CardContent className="py-8 flex items-start gap-3 text-destructive">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold mb-1">Couldn't load photos</p>
              <p className="text-sm">
                {(error as { message?: string } | undefined)?.message ??
                  "Please try again shortly."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : grouped.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Camera className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
            <p className="font-semibold mb-1">No photos in this range</p>
            <p className="text-sm text-muted-foreground mb-4">
              Upload your first progress photo to start a check-in record.
            </p>
            <Button onClick={() => setUploadOpen(true)} className="gap-2">
              <Upload className="w-4 h-4" /> Upload photo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {grouped.map(([date, items]) => (
            <Card key={date}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    {safeFormat(date)}
                  </h3>
                  <Badge variant="outline" className="text-muted-foreground">
                    {items.length} {items.length === 1 ? "photo" : "photos"}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {items.map((p) => (
                    <PhotoTile
                      key={p.id}
                      photo={p}
                      onOpen={() => setOpened(p)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <UploadPhotoDialog open={uploadOpen} onClose={() => setUploadOpen(false)} />
      <PhotoLightbox photo={opened} onClose={() => setOpened(null)} />
    </div>
  );
}

function PhotoTile({
  photo,
  onOpen,
}: {
  photo: Photo;
  onOpen: () => void;
}) {
  const pose = (photo.pose as PhotoPose) ?? "front";
  const poseLabel = PHOTO_POSE_LABELS[pose] ?? String(photo.pose);
  // Prefer the list's `url` field if backend ever adds one; otherwise fall
  // back to fetching the binary from `/photos/detail?thumbnail=true`.
  const hasUrl = Boolean(photo.url);
  const detail = usePhotoDetail(photo.id, true, !hasUrl);
  const src = hasUrl
    ? photo.url!
    : detail.data
      ? toDataUrl(detail.data)
      : null;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="border border-border rounded-sm overflow-hidden bg-muted/40 text-left hover:border-primary/60 transition-colors group"
      title={`Open ${poseLabel} from ${photo.date}`}
    >
      <div className="aspect-[3/4] flex items-center justify-center bg-muted">
        {src ? (
          <img
            src={src}
            alt={`${poseLabel} on ${photo.date}`}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
          />
        ) : detail.isError ? (
          <div className="text-center text-muted-foreground p-3">
            <AlertCircle className="w-6 h-6 mx-auto mb-1 opacity-50" />
            <p className="text-xs">Couldn't load</p>
          </div>
        ) : (
          <div className="text-center text-muted-foreground p-3">
            <Loader2 className="w-6 h-6 mx-auto animate-spin opacity-50" />
          </div>
        )}
      </div>
      <div className="p-2 flex items-center justify-between">
        <span className="text-xs font-semibold">{poseLabel}</span>
        <span className="text-[10px] text-muted-foreground">#{photo.id}</span>
      </div>
    </button>
  );
}

function safeFormat(date: string): string {
  try {
    return format(parseISO(date), "EEEE, MMM d, yyyy");
  } catch {
    return date;
  }
}
