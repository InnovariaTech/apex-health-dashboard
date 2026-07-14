import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { differenceInCalendarMonths, format, parseISO, subDays } from "date-fns";
import { Camera, Plus } from "lucide-react";
import { usePhotos, usePhotoDetail } from "@/hooks/trainerize/usePhotos";
import { useTrainerizeLink } from "@/hooks/trainerize/useLinkage";
import type { Photo } from "@/types/trainerize/photos_types";
import { createPageUrl } from "@/utils";

/**
 * Progress photos card matching the New Ui mockup — 6-tile grid plus an
 * inline before/after comparison slider.
 *
 * Trainerize's list endpoint returns metadata only; the binary lives at
 * `GET /me/photos/detail` per photo. We fetch detail lazily for the
 * earliest + latest photos (the two ends of the comparison slider) and
 * fetch detail for each grid tile only when it scrolls into view via a
 * tiny `usePhotoDetail` per tile. This keeps the dashboard lean — six
 * extra round-trips only the first time the user lands on it, then
 * cached for an hour by React Query.
 *
 * Hidden when the user has no Trainerize link.
 */

const RANGE_DAYS = 180;
const TILE_COUNT = 6;

export default function ProgressPhotosCard() {
  const linkQuery = useTrainerizeLink();
  if (!linkQuery.isLoading && !linkQuery.data) return null;

  const endDate = format(new Date(), "yyyy-MM-dd");
  const startDate = format(subDays(new Date(), RANGE_DAYS), "yyyy-MM-dd");
  const photosQuery = usePhotos(startDate, endDate);

  const tiles = useMemo<Photo[]>(() => {
    const all = photosQuery.data?.photos ?? [];
    // Sort newest first; pad with `null` slots are handled by the renderer.
    return [...all]
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
      .slice(0, TILE_COUNT);
  }, [photosQuery.data]);

  // Before/after picks the oldest + newest in the visible set.
  const before = tiles[tiles.length - 1] ?? null;
  const after = tiles[0] ?? null;

  return (
    <div className="apex-card p-6 lg:p-7 mb-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-baseline gap-2">
            <h3 className="apex-card-title">Progress photos</h3>
            <span className="text-mute font-medium text-[14px]">
              ({photosQuery.data?.total ?? tiles.length})
            </span>
          </div>
          <p className="text-[13.5px] text-ink-2 mt-1.5">
            Visual body-composition timeline · uploaded via the Apex Fit app
          </p>
        </div>
        <Link
          to={createPageUrl("Progress")}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[11px] border border-border bg-card hover:bg-secondary text-[13px] font-semibold transition-colors"
        >
          <Plus className="w-[15px] h-[15px]" strokeWidth={2.2} />
          Add photo
        </Link>
      </div>

      {/* Tiles */}
      <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mt-5">
        {Array.from({ length: TILE_COUNT }).map((_, i) => {
          const p = tiles[i];
          return p ? (
            <PhotoTile key={p.id} photo={p} />
          ) : (
            <PhotoPlaceholder key={`ph-${i}`} index={i} />
          );
        })}
      </div>

      {/* Before / after slider */}
      {before && after && before.id !== after.id ? (
        <BeforeAfter before={before} after={after} />
      ) : null}
    </div>
  );
}

// ─── Tile (real photo via base64 binary) ─────────────────────────────────

function PhotoTile({ photo }: { photo: Photo }) {
  // Full-res (thumbnail=false) for crispness — matches the Progress page and
  // shares the same React Query cache entry.
  const detail = usePhotoDetail(photo.id, false);
  const src =
    detail.data?.base64 && detail.data?.contentType
      ? `data:${detail.data.contentType};base64,${detail.data.base64}`
      : photo.url ?? null;

  return (
    <div
      className="relative border border-border rounded-[14px] overflow-hidden aspect-[3/4] bg-secondary"
      style={{ backgroundImage: src ? `url(${src})` : undefined, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      {!src && (
        <div className="absolute inset-0 grid place-items-center text-mute">
          <Camera className="w-7 h-7" strokeWidth={1.6} />
        </div>
      )}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-[.08em] bg-black/60 text-white">
          {String(photo.pose)}
        </span>
        <span className="px-2 py-0.5 rounded-md text-[10.5px] font-mono bg-black/60 text-white">
          {safeFormat(photo.date, "MMM yyyy")}
        </span>
      </div>
    </div>
  );
}

function PhotoPlaceholder({ index }: { index: number }) {
  return (
    <div className="relative border border-dashed border-border rounded-[14px] aspect-[3/4] bg-secondary grid place-items-center text-mute">
      <div className="text-center">
        <Camera className="w-7 h-7 mx-auto mb-2" strokeWidth={1.6} />
        <p className="text-[11.5px] font-mono uppercase tracking-[.08em]">
          Slot {index + 1}
        </p>
      </div>
    </div>
  );
}

// ─── Before / after slider ───────────────────────────────────────────────

function BeforeAfter({ before, after }: { before: Photo; after: Photo }) {
  const [pct, setPct] = useState(50);
  const beforeDetail = usePhotoDetail(before.id, false);
  const afterDetail = usePhotoDetail(after.id, false);

  const beforeSrc =
    beforeDetail.data &&
    `data:${beforeDetail.data.contentType};base64,${beforeDetail.data.base64}`;
  const afterSrc =
    afterDetail.data &&
    `data:${afterDetail.data.contentType};base64,${afterDetail.data.base64}`;

  const beforeMonth = safeFormat(before.date, "MMM yyyy");
  const afterMonth = safeFormat(after.date, "MMM yyyy");

  return (
    <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-7 items-center">
      <div
        className="relative border border-border rounded-[16px] overflow-hidden aspect-[3/4] max-h-[540px] bg-secondary select-none"
      >
        {beforeSrc && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${beforeSrc})` }}
          />
        )}
        {afterSrc && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${afterSrc})`,
              clipPath: `inset(0 0 0 ${pct}%)`,
            }}
          />
        )}
        <span className="absolute top-3 left-3 z-10 px-2 py-1 rounded-md text-[10.5px] font-mono uppercase tracking-[.08em] bg-black/70 text-white">
          {beforeMonth}
        </span>
        <span className="absolute top-3 right-3 z-10 px-2 py-1 rounded-md text-[10.5px] font-mono uppercase tracking-[.08em] bg-black/70 text-white">
          {afterMonth}
        </span>
        <div
          className="absolute top-0 bottom-0 z-20 w-[3px] bg-white pointer-events-none"
          style={{ left: `${pct}%`, boxShadow: "0 0 0 1px rgba(0,0,0,.12)" }}
        />
        <input
          type="range"
          min={0}
          max={100}
          value={pct}
          onChange={(e) => setPct(Number(e.target.value))}
          className="absolute inset-0 z-30 w-full h-full opacity-0 cursor-ew-resize"
          aria-label="Compare before and after"
        />
      </div>
      <div>
        <h4 className="text-[18px] font-bold tracking-[-0.01em] text-foreground">
          {monthsBetween(before.date, after.date)} transformation
        </h4>
        <p className="text-[14px] text-ink-2 mt-2 max-w-[42ch]">
          Drag the slider to compare your {beforeMonth} starting point against
          your {afterMonth} latest snapshot.
        </p>
      </div>
    </div>
  );
}

function safeFormat(value: string, pattern: string): string {
  try {
    return format(parseISO(value), pattern);
  } catch {
    return value;
  }
}

function monthsBetween(a: string, b: string): string {
  try {
    // Count the calendar months spanned inclusively so the number matches the
    // month labels shown to the user — e.g. Feb 2026 → Jul 2026 reads as
    // "6-month" (Feb, Mar, Apr, May, Jun, Jul), not 5.
    const months = Math.abs(differenceInCalendarMonths(parseISO(b), parseISO(a))) + 1;
    return `${months}-month`;
  } catch {
    return "Multi-month";
  }
}
