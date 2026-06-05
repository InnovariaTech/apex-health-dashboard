/**
 * Trainerize progress photos — backs `src/api/trainerize/photos.ts`.
 * See `docs/trainerize/goals/list-photos.md` and `upload-photo.md`.
 *
 * Known limitation (from `docs/trainerize/goals/README.md`):
 *   "photos/getByID is **not** exposed — no binary download proxy yet."
 *
 * Consequence: the list response carries `{id, date, pose}` only — there is
 * no `url` / `thumbnailUrl` field. The UI can show photo metadata (date,
 * pose) but cannot render the actual image until backend exposes a binary
 * download endpoint.
 */

export type PhotoPose = "back" | "front" | "side";

export const PHOTO_POSE_VALUES: PhotoPose[] = ["front", "side", "back"];

export const PHOTO_POSE_LABELS: Record<PhotoPose, string> = {
  back: "Back",
  front: "Front",
  side: "Side",
};

export interface Photo {
  id: number;
  date: string;
  pose: PhotoPose | string;
  /** Backend may add this in the future; UI renders a thumbnail when present. */
  url?: string;
}

export interface ListPhotosParams {
  startDate: string;
  endDate: string;
}

export interface ListPhotosResult {
  total: number;
  photos: Photo[];
}

export interface UploadPhotoPayload {
  file: File;
  date: string;
  pose: PhotoPose;
}

export interface UploadPhotoResult {
  ids: number[];
}

/** 10 MB per `docs/trainerize/goals/upload-photo.md`. */
export const PHOTO_MAX_SIZE_BYTES = 10 * 1024 * 1024;

/**
 * Photo detail (binary base64). Backed by `GET /me/photos/detail` —
 * see `docs/trainerize/nutrition-photos-appointments-apis.md` §Photos detail.
 * Trainerize returns binary; Apex encodes as base64 with `contentType`.
 */
export interface PhotoDetail {
  photoId: number;
  thumbnail: boolean;
  contentType: string;
  base64: string;
}

export interface GetPhotoDetailParams {
  photoId: number;
  thumbnail?: boolean;
}

/** Builds the `src` value for an `<img>` tag from a PhotoDetail. */
export function toDataUrl(detail: PhotoDetail): string {
  return `data:${detail.contentType};base64,${detail.base64}`;
}
