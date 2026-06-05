import { axiosService } from "@/api/http/axiosInstance";
import { unwrap, type Envelope } from "./_envelope";
import type {
  GetPhotoDetailParams,
  ListPhotosParams,
  ListPhotosResult,
  PhotoDetail,
  UploadPhotoPayload,
  UploadPhotoResult,
} from "@/types/trainerize/photos_types";

/**
 * Trainerize progress photos — list + upload.
 * See `docs/trainerize/goals/list-photos.md`, `upload-photo.md`.
 *
 * Notes:
 *  - Server resolves the linked client ID; never send `userID`.
 *  - `uploadPhoto` is the **only** Trainerize route in this API that uses
 *    multipart/form-data (not JSON), per the doc header.
 *  - `listPhotos` requires both `startDate` and `endDate` — both must be
 *    non-empty strings (caller responsibility).
 */

const BASE = "/api/trainerize/me/photos";
const DETAIL = `${BASE}/detail`;

export async function listPhotos(
  params: ListPhotosParams,
): Promise<ListPhotosResult> {
  const res = await axiosService.get<Envelope<ListPhotosResult>>(BASE, {
    params,
  });
  const data = unwrap<ListPhotosResult | null>(res.data);
  if (!data) return { total: 0, photos: [] };
  if (Array.isArray(data as unknown)) {
    return {
      total: (data as unknown as unknown[]).length,
      photos: data as unknown as ListPhotosResult["photos"],
    };
  }
  return {
    total: typeof data.total === "number" ? data.total : (data.photos?.length ?? 0),
    photos: Array.isArray(data.photos) ? data.photos : [],
  };
}

export async function getPhotoDetail(
  params: GetPhotoDetailParams,
): Promise<PhotoDetail> {
  // Coerce boolean to string so axios serializes it as `thumbnail=true|false`
  // rather than relying on its default boolean handling.
  const query: Record<string, unknown> = { photoId: params.photoId };
  if (typeof params.thumbnail === "boolean") {
    query.thumbnail = String(params.thumbnail);
  }
  const res = await axiosService.get<Envelope<PhotoDetail>>(DETAIL, {
    params: query,
  });
  return unwrap<PhotoDetail>(res.data);
}

export async function uploadPhoto(
  payload: UploadPhotoPayload,
): Promise<UploadPhotoResult> {
  const form = new FormData();
  form.append("file", payload.file);
  form.append("date", payload.date);
  form.append("pose", payload.pose);
  // Let the browser set the multipart boundary header automatically.
  const res = await axiosService.post<Envelope<UploadPhotoResult>>(BASE, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  const data = unwrap<UploadPhotoResult | null>(res.data);
  if (!data || !Array.isArray(data.ids)) return { ids: [] };
  return data;
}
