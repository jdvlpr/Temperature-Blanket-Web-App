// Copyright (c) 2024 - 2026, Thomas (https://github.com/jdvlpr)
//
// This file is part of Temperature-Blanket-Web-App.
//
// Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
// under the terms of the GNU General Public License as published by the Free Software Foundation,
// either version 3 of the License, or (at your option) any later version.
//
// Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
// without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
// See the GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App.
// If not, see <https://www.gnu.org/licenses/>.

// Large photos are drawn at most this many pixels wide or tall
export const MAX_IMAGE_DIMENSION = 1200;

/**
 * Whether a chosen file can be opened as a photo. Gives the message to show
 * if it isn't an image, or if it is but fails to open.
 */
export function checkImageFile(file: {
  type: string;
  name: string;
}): { ok: false; error: string } | { ok: true; failMessage: string } {
  const isHeic =
    /image\/hei[cf]/.test(file.type) || /\.hei[cf]$/i.test(file.name);
  if (!file.type.startsWith('image/') && !isHeic)
    return {
      ok: false,
      error: "That file isn't an image. Try a JPG, PNG, or WebP file.",
    };
  return {
    ok: true,
    failMessage: isHeic
      ? "This browser can't open HEIC photos. Try a JPG or PNG, or a screenshot of the photo."
      : "Couldn't open that image. Try a JPG, PNG, or WebP file.",
  };
}

/** Load an image, ready to draw. Rejects if it can't be opened. */
export async function decodeImage(src: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.src = src;
  await image.decode();
  return image;
}

/** Draw an image at most `maxDimension` pixels wide or tall, and read its pixels */
export function imageToPixels(
  image: HTMLImageElement,
  maxDimension = MAX_IMAGE_DIMENSION,
): { pixels: ImageData; canvas: HTMLCanvasElement } | null {
  const scale = Math.min(
    1,
    maxDimension / Math.max(image.naturalWidth, image.naturalHeight),
  );
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(image, 0, 0, width, height);
  return { pixels: ctx.getImageData(0, 0, width, height), canvas };
}

/** A small preview of a photo, for continuing with it later */
export function makeThumbnail(source: HTMLCanvasElement): string {
  const scale = Math.min(1, 240 / Math.max(source.width, source.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(source.width * scale));
  canvas.height = Math.max(1, Math.round(source.height * scale));
  canvas.getContext('2d')?.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.8);
}
