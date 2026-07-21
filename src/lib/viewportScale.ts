/**
 * Viewport up-scaling.
 *
 * The UI is built in fixed pixels tuned for a 1920-wide (1080p) canvas. On
 * larger displays (e.g. a 27" 2560×1440) the fixed-width content otherwise
 * shrinks into a centered island with empty side gutters. This uniformly
 * magnifies the whole interface so it fills the screen at the *same*
 * proportions it has on a 1080p laptop — "identical, just bigger".
 *
 * Design notes:
 *   - CSS `zoom` (not `transform: scale`) so the fixed-position sidebar
 *     scales AND repositions correctly, and text re-renders crisply.
 *   - Scales UP only (floor 1.0): laptops and anything ≤1920 are untouched.
 *   - Capped (MAX_SCALE) so 4K / ultrawide don't balloon comically.
 *   - Keyed off `innerWidth` (the browser window's CSS width), so it also
 *     adapts if the window is resized or the browser is itself zoomed.
 *
 * To disable: remove the `initViewportScale()` call in `main.tsx`.
 */

/** The canvas width the fixed-px design was built against. */
const DESIGN_WIDTH = 1920;

/** Never magnify beyond this, to keep 4K / ultrawide sane. */
const MAX_SCALE = 1.4;

function computeScale(): number {
  const raw = window.innerWidth / DESIGN_WIDTH;
  const clamped = Math.min(MAX_SCALE, Math.max(1, raw));
  // Round to 3dp to avoid sub-pixel jitter while resizing.
  return Math.round(clamped * 1000) / 1000;
}

function applyViewportScale(): void {
  const scale = computeScale();
  // `setProperty` avoids relying on the non-standard `.style.zoom` typing.
  if (scale === 1) {
    document.documentElement.style.removeProperty("zoom");
  } else {
    document.documentElement.style.setProperty("zoom", String(scale));
  }
}

export function initViewportScale(): void {
  applyViewportScale();
  window.addEventListener("resize", applyViewportScale);
}
