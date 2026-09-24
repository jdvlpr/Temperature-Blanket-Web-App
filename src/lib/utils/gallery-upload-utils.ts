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

// The WordPress host truncates request bodies somewhere between ~2.25 MB and ~2.6 MB
// instead of rejecting them, so WordPress sees cut-off JSON and replies
// "Invalid JSON body passed." (rest_invalid_json). Keep the whole gallery request
// body under this budget, with margin below the largest size known to work.
export const GALLERY_BODY_BYTE_BUDGET = 2_000_000;

// Smallest the preview image may be scaled to before giving up
const MIN_IMAGE_SCALE = 0.2;

const MAX_RESIZE_ATTEMPTS = 4;

export const byteLength = (value: string): number =>
  new TextEncoder().encode(value).length;

/**
 * The scale to apply to an image's width and height so its encoded size fits
 * within the given byte budget. Encoded size grows roughly with pixel area, so
 * the scale is the square root of the size ratio, shrunk a bit for margin.
 * Returns 1 if the image already fits, or null if it can't be made to fit.
 */
export const getImageScaleForBudget = (
  imageBytes: number,
  imageBudgetBytes: number,
): number | null => {
  if (imageBytes <= imageBudgetBytes) return 1;
  if (imageBudgetBytes <= 0) return null;
  const scale = Math.sqrt(imageBudgetBytes / imageBytes) * 0.9;
  if (scale < MIN_IMAGE_SCALE) return null;
  return scale;
};

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load the preview image.'));
    img.src = src;
  });

const resizePNG = async (
  img: HTMLImageElement,
  scale: number,
): Promise<string> => {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas 2d context.');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/png');
};

/**
 * Builds the JSON request body for a gallery submission, scaling the preview
 * image down as needed so the whole body fits within GALLERY_BODY_BYTE_BUDGET.
 * Returns null if the body can't be made to fit (e.g. the weather data alone
 * is too large).
 */
export const buildGalleryRequestBody = async (
  data: Record<string, unknown> & { img: string },
): Promise<string | null> => {
  let body = JSON.stringify(data);
  let bodyBytes = byteLength(body);
  if (bodyBytes <= GALLERY_BODY_BYTE_BUDGET) return body;

  const original = await loadImage(data.img);
  let img = data.img;
  let totalScale = 1;

  for (let attempt = 0; attempt < MAX_RESIZE_ATTEMPTS; attempt++) {
    const imageBytes = byteLength(img);
    const otherBytes = bodyBytes - imageBytes;
    const scale = getImageScaleForBudget(
      imageBytes,
      GALLERY_BODY_BYTE_BUDGET - otherBytes,
    );
    if (scale === null) return null;

    totalScale *= scale;
    if (totalScale < MIN_IMAGE_SCALE) return null;

    // Always resize from the original so quality doesn't degrade each attempt
    img = await resizePNG(original, totalScale);
    body = JSON.stringify({ ...data, img });
    bodyBytes = byteLength(body);
    if (bodyBytes <= GALLERY_BODY_BYTE_BUDGET) return body;
  }

  return null;
};
