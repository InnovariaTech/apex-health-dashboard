/**
 * Client-side image prep for Beluga ID/document upload.
 *
 * Beluga wants photos resized to ~1000px wide and kept under 3MB (measured
 * decoded). Our API enforces the 3MB ceiling, so getting the file small enough
 * is purely a frontend job. PDFs pass through untouched. See `beluga-api.md`.
 *
 * The wire format is handled by the api layer (raw multipart bytes); this module
 * only produces a small-enough File.
 */

/** Beluga's target width. Portrait images keep aspect ratio. */
const TARGET_WIDTH = 1000;
/** Backend ceiling. We aim comfortably under it. */
const MAX_BYTES = 3 * 1024 * 1024;
/** Progressive JPEG qualities to try until the blob fits. */
const QUALITY_STEPS = [0.85, 0.75, 0.6, 0.45];

export const BELUGA_ACCEPT =
  "image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf";

export class ImageTooLargeError extends Error {
  constructor(message = "This file is too large. Please choose a smaller image.") {
    super(message);
    this.name = "ImageTooLargeError";
  }
}

export class ImageDecodeError extends Error {
  constructor(
    message = "We couldn't read this image. Try a JPEG or PNG, or a photo taken with your camera.",
  ) {
    super(message);
    this.name = "ImageDecodeError";
  }
}

function isPdf(file: File): boolean {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}

function isHeic(file: File): boolean {
  return (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    /\.hei[cf]$/i.test(file.name)
  );
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new ImageDecodeError());
    };
    img.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) =>
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality),
  );
}

/**
 * Return a File small enough for Beluga.
 *
 * - PDFs: returned as-is if ≤3MB, else `ImageTooLargeError`.
 * - HEIC/HEIF: cannot be decoded to canvas in Chrome/Firefox. If already ≤3MB
 *   we send as-is (iOS Safari usually converts to JPEG on pick anyway); if over,
 *   we throw so the UI can ask for a JPEG. (No heic2any dependency by design.)
 * - Other images: decode → draw at ≤1000px wide → re-encode JPEG, stepping the
 *   quality down until under 3MB.
 */
export async function resizeForBeluga(file: File): Promise<File> {
  if (isPdf(file)) {
    if (file.size > MAX_BYTES) throw new ImageTooLargeError();
    return file;
  }

  if (isHeic(file)) {
    if (file.size <= MAX_BYTES) return file;
    throw new ImageDecodeError(
      "This HEIC photo is too large to send. Please choose a JPEG, or retake the photo.",
    );
  }

  const img = await loadImage(file);

  const scale = img.width > TARGET_WIDTH ? TARGET_WIDTH / img.width : 1;
  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new ImageDecodeError();
  ctx.drawImage(img, 0, 0, width, height);

  for (const quality of QUALITY_STEPS) {
    const blob = await canvasToBlob(canvas, quality);
    if (blob && blob.size <= MAX_BYTES) {
      const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
      return new File([blob], name, { type: "image/jpeg" });
    }
  }

  throw new ImageTooLargeError(
    "This image is too large even after compression. Please choose a smaller photo.",
  );
}
