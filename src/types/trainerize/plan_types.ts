/**
 * Trainerize training plans, programs, and workout definitions.
 * See `docs/trainerize/client-apis.md` Phase 2.
 */

export type PlanDurationType =
  | "specificDate"
  | "week"
  | "month"
  | "notSpecified"
  | string;

export interface TrainingPlan {
  id: number;
  name: string;
  startDate?: string;
  endDate?: string;
  duration?: number | string;
  durationType?: PlanDurationType;
  [key: string]: unknown;
}

/** `GET /api/trainerize/me/programs` — trainer-created curricula. */
export interface TrainerizeProgram {
  id: number;
  name: string;
  [key: string]: unknown;
}

/** Workout definition inside a training plan. */
export interface WorkoutDef {
  id: number;
  name: string;
  /** Total est. seconds for the workout (sum of intervals + sets). */
  duration?: number;
  instruction?: string;
  type?: string;
  /** Workout-level media — typically null; thumbnails come from exercises. */
  media?: ExerciseMedia | null;
  exercises?: WorkoutDefExercise[];
  [key: string]: unknown;
}

/**
 * Variant-keyed URL bag used by Trainerize for both video and thumbnail
 * payloads. Any field may be null; renderers should fall back across the
 * variants in priority order.
 */
export interface ExerciseMediaUrlVariants {
  sd?: string | null;
  hd?: string | null;
  fhd?: string | null;
  hls?: string | null;
  hlssd?: string | null;
  hlshd?: string | null;
  mobile?: string | null;
}

/** Per-exercise media block — present on workout-defs responses. */
export interface ExerciseMedia {
  isOverride?: boolean;
  /** Upstream storage tier — observed: "awss3" (HLS) or "vimeo" (progressive). */
  type?: string;
  status?: string;
  token?: string | null;
  loopVideoToken?: string | null;
  videoUrl?: ExerciseMediaUrlVariants | null;
  loopVideoUrl?: ExerciseMediaUrlVariants | null;
  thumbnailUrl?: { hd?: string | null; sd?: string | null } | null;
  audioUrl?: { male?: string | null; female?: string | null } | null;
  [key: string]: unknown;
}

/**
 * Structured target description. The list response uses an object shape;
 * older callsites also handed us a plain string fallback so the union
 * keeps both compiling.
 */
export interface ExerciseTargetDetail {
  type?: number;
  distance?: number | null;
  distanceUnit?: string | null;
  time?: number | null;
  text?: string | null;
  zone?: unknown;
  [key: string]: unknown;
}

export interface WorkoutDefExercise {
  /** Exercise-def id. The list response puts this and `name` at top level. */
  id?: number;
  name?: string;
  sets?: number;
  target?: string;
  targetDetail?: ExerciseTargetDetail | string;
  side?: string | null;
  /** Superset grouping id — exercises sharing this value are one superset. */
  superSetID?: number;
  supersetType?: string;
  intervalTime?: number;
  restTime?: number;
  recordType?: string;
  version?: string;
  media?: ExerciseMedia | null;
  videoType?: string;
  /** Bare token / vimeo id; resolve playback via `media.videoUrl.*`. */
  videoUrl?: string;
  videoMobileUrl?: ExerciseMediaUrlVariants | null;
  videoStatus?: string;
  /**
   * Legacy nested-def shape some daily-workout payloads use. Kept so older
   * callers reading `ex.def?.name` still compile against this type.
   */
  def?: {
    id: number;
    name?: string;
    description?: string;
  };
  [key: string]: unknown;
}

/** Best-fit thumbnail URL for an exercise (SD preferred for card thumbs). */
export function getExerciseThumbnail(
  ex: WorkoutDefExercise | undefined | null,
): string | null {
  const thumb = ex?.media?.thumbnailUrl;
  if (!thumb) return null;
  return thumb.sd || thumb.hd || null;
}

/**
 * Hero thumbnail for a workout def — workout-level `media` is typically
 * null in the list response, so we fall back to the first exercise that
 * actually has a thumbnail.
 */
export function getWorkoutDefThumbnail(
  def: WorkoutDef | undefined | null,
): string | null {
  const workoutThumb = def?.media?.thumbnailUrl;
  if (workoutThumb?.sd || workoutThumb?.hd) {
    return workoutThumb.sd || workoutThumb.hd || null;
  }
  for (const ex of def?.exercises ?? []) {
    const t = getExerciseThumbnail(ex);
    if (t) return t;
  }
  return null;
}

/**
 * Playback source for an exercise demo. The discriminator tells the modal
 * which player path to take:
 *   - `"vimeo"`: render the official iframe embed (the `progressive_redirect`
 *     MP4 URLs in the response are signed/scoped to the vimeo player and
 *     don't actually play in a bare `<video>` tag).
 *   - `"hls"`: HLS stream — needs hls.js in non-Safari browsers.
 *   - `"mp4"`: plain progressive MP4 — works in a native `<video>`.
 */
export type ExerciseVideoSource =
  | { kind: "vimeo"; vimeoId: string }
  | { kind: "hls"; url: string }
  | { kind: "mp4"; url: string };

/**
 * Pick a playable source for an exercise. Prefers the embed-friendly path
 * for each storage tier:
 *   - `media.type === "vimeo"` → iframe with `loopVideoToken` (or `token`).
 *   - otherwise → HLS first (awss3 ships HLS only), then progressive MP4.
 *
 * Returns null when nothing playable is present so the caller can hide the
 * action entirely.
 */
export function getExerciseVideoSource(
  ex: WorkoutDefExercise | undefined | null,
): ExerciseVideoSource | null {
  const media = ex?.media;
  if (!media) return null;

  if (media.type === "vimeo") {
    const token =
      (typeof media.loopVideoToken === "string" && media.loopVideoToken) ||
      (typeof media.token === "string" && media.token) ||
      "";
    if (token.trim() !== "") {
      return { kind: "vimeo", vimeoId: token.trim() };
    }
  }

  const main = media.videoUrl;
  if (main?.hls) return { kind: "hls", url: main.hls };
  if (main?.hlshd) return { kind: "hls", url: main.hlshd };
  if (main?.hlssd) return { kind: "hls", url: main.hlssd };

  const loop = media.loopVideoUrl;
  if (loop?.hls) return { kind: "hls", url: loop.hls };

  if (loop?.fhd) return { kind: "mp4", url: loop.fhd };
  if (loop?.sd) return { kind: "mp4", url: loop.sd };
  if (main?.fhd) return { kind: "mp4", url: main.fhd };
  if (main?.sd) return { kind: "mp4", url: main.sd };
  return null;
}

/** @deprecated — use `getExerciseVideoSource` so the player knows the kind. */
export function getExerciseVideoUrl(
  ex: WorkoutDefExercise | undefined | null,
): string | null {
  const src = getExerciseVideoSource(ex);
  if (!src) return null;
  if (src.kind === "vimeo") return `https://player.vimeo.com/video/${src.vimeoId}`;
  return src.url;
}

/** Human-readable target line, e.g. "10 reps", "60s", or "—". */
export function formatExerciseTarget(
  ex: WorkoutDefExercise | undefined | null,
): string {
  if (!ex) return "—";
  if (typeof ex.target === "string" && ex.target.trim() !== "") {
    return ex.target.trim();
  }
  const detail = ex.targetDetail;
  if (typeof detail === "string" && detail.trim() !== "") return detail.trim();
  if (detail && typeof detail === "object") {
    if (typeof detail.text === "string" && detail.text.trim() !== "") {
      return detail.text.trim();
    }
    if (typeof detail.time === "number" && detail.time > 0) {
      return `${detail.time}s`;
    }
    if (typeof detail.distance === "number" && detail.distance > 0) {
      const unit = detail.distanceUnit ?? "";
      return `${detail.distance}${unit ? ` ${unit}` : ""}`;
    }
  }
  return "—";
}

export interface ListWorkoutDefsParams {
  planId: number;
  searchTerm?: string;
  /** offset, default 0 */
  start?: number;
  /** page size, default 10 */
  count?: number;
}
