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

// A small picture of each saved project's preview, for its card on My Projects.
// Previews can only be drawn for the open project (they read its state), so the
// picture is taken when the planner saves, and kept in this browser beside the
// project (`thumb_<id>`), not in it: a project's synced copy doesn't change, or
// upload again, because of its picture.

import { browser } from '$app/env';
import { del, get, set } from 'idb-keyval';

const THUMBNAIL_PREFIX = 'thumb_';
/** Wide enough for a card on a large screen at 2x */
const THUMBNAIL_WIDTH = 320;

export type StoredThumbnail = {
  /** The project link it was drawn from: drawn again only once that changes */
  href: string;
  /** A JPEG, as a data URL */
  image: string;
};

/** A saved project's picture, if one was taken in this browser. */
export async function getThumbnail(id: string): Promise<string | null> {
  if (!browser) return null;
  try {
    return (
      (await get<StoredThumbnail>(`${THUMBNAIL_PREFIX}${id}`))?.image ?? null
    );
  } catch {
    return null;
  }
}

export async function removeThumbnail(id: string): Promise<void> {
  if (!browser) return;
  try {
    await del(`${THUMBNAIL_PREFIX}${id}`);
  } catch {
    // Nothing to clean up
  }
}

/** Draws an SVG small, as a JPEG (white behind it), or null if it can't. */
async function drawSmall(
  svg: SVGSVGElement,
  width: number,
  height: number,
): Promise<string | null> {
  if (!width || !height) return null;
  const scale = Math.min(1, THUMBNAIL_WIDTH / width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const url = URL.createObjectURL(
    new Blob([new XMLSerializer().serializeToString(svg)], {
      type: 'image/svg+xml',
    }),
  );
  try {
    const image = new Image();
    image.width = width;
    image.height = height;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('The preview could not be drawn'));
      image.src = url;
    });
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.82);
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
    // Safari only frees a canvas's memory once it's sized down
    canvas.width = 0;
    canvas.height = 0;
  }
}

/**
 * Takes the open project's picture from its preview, when the browser is idle,
 * unless the one kept is of this same link. Never throws; without a preview
 * on the page, it does nothing.
 */
export function captureThumbnail(
  id: string | null | undefined,
  href: string,
  preview: { svg?: SVGSVGElement | null; width?: number; height?: number },
) {
  if (!browser || !id) return;
  const idle =
    window.requestIdleCallback ??
    ((callback: () => void) => setTimeout(callback, 200));
  idle(async () => {
    try {
      const key = `${THUMBNAIL_PREFIX}${id}`;
      if ((await get<StoredThumbnail>(key))?.href === href) return;
      if (!preview.svg?.isConnected) return;
      const image = await drawSmall(
        preview.svg,
        preview.width ?? 0,
        preview.height ?? 0,
      );
      if (image) await set(key, { href, image } satisfies StoredThumbnail);
    } catch (e) {
      console.warn('Could not keep the project’s picture', e);
    }
  });
}
