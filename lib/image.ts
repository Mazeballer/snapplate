/** Shrinks a photo before it is uploaded or sent for analysis: faster, cheaper, and plenty sharp for food. */

/** The size to scale a picture down to so its longest side is at most `max`. Never scales up. */
export function fitWithin(width: number, height: number, max: number): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= max) return { width, height };
  const scale = max / longest;
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

export const MAX_PHOTO_SIDE = 1024;
export const PHOTO_QUALITY = 0.8;

/** Resize a photo to a JPEG no larger than 1024px on its longest side, honouring its rotation. */
export async function resizePhoto(source: Blob, max = MAX_PHOTO_SIDE, quality = PHOTO_QUALITY): Promise<Blob> {
  const bitmap = await createImageBitmap(source, { imageOrientation: "from-image" });
  try {
    const { width, height } = fitWithin(bitmap.width, bitmap.height, max);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not prepare the photo.");
    context.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob) throw new Error("Could not prepare the photo.");
    return blob;
  } finally {
    bitmap.close();
  }
}

/** The base64 text of a blob, without the "data:...;base64," prefix. */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the photo."));
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.readAsDataURL(blob);
  });
}
