import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPhotoDetail,
  listPhotos,
  uploadPhoto,
} from "@/api/trainerize/photos";
import { queryKeys } from "@/hooks/queryKeys";
import type { UploadPhotoPayload } from "@/types/trainerize/photos_types";

/**
 * Trainerize progress photos. Both `startDate` and `endDate` are required by
 * the upstream endpoint, so the query is gated on both being non-empty.
 * See `docs/trainerize/goals/list-photos.md` and `upload-photo.md`.
 */

export function usePhotos(startDate: string, endDate: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.trainerize.photos(startDate, endDate),
    queryFn: () => listPhotos({ startDate, endDate }),
    enabled: enabled && Boolean(startDate) && Boolean(endDate),
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch a single photo's binary as base64. Photos are immutable once
 * uploaded, so we cache for an hour. `enabled` gates on a valid id +
 * caller intent (e.g. a closed lightbox shouldn't fetch the full size).
 */
export function usePhotoDetail(
  photoId: number | undefined,
  thumbnail: boolean,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.trainerize.photoDetail(photoId ?? 0, thumbnail),
    queryFn: () =>
      getPhotoDetail({ photoId: photoId as number, thumbnail }),
    enabled: enabled && typeof photoId === "number" && photoId > 0,
    staleTime: 60 * 60 * 1000,
    // Photo binaries are large; don't retry blindly on transient failures.
    retry: 1,
  });
}

export function useUploadPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UploadPhotoPayload) => uploadPhoto(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trainerize", "photos"] });
    },
  });
}
