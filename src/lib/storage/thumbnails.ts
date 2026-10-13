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
//
// Projects not opened since get theirs in the background: My Projects opens
// each in a hidden frame (named THUMBNAIL_FRAME_NAME) on this site, where the
// planner draws its preview, keeps the picture, and says so (THUMBNAIL_MESSAGE).
// That frame never saves, syncs or counts as a visit.

import { browser } from '$app/env';
import { withoutVersion } from '#lib/utils/gallery-link-utils.js';
import { del, get, set } from 'idb-keyval';

const THUMBNAIL_PREFIX = 'thumb_';

/** The hidden frame's name, which puts the planner in it in picture-only mode */
export const THUMBNAIL_FRAME_NAME = 'tb-thumbnail';
/** What the frame tells My Projects once it's done (`{ type, id, ok }`) */
export const THUMBNAIL_MESSAGE = 'tb-thumbnail-done';

/** Whether this page is My Projects' hidden frame, only drawing a picture */
export const isThumbnailFrame = () =>
  browser && window.name === THUMBNAIL_FRAME_NAME && window.parent !== window;

/** Tells My Projects the frame is done with this project */
export function frameDone(id: string | null | undefined, ok: boolean) {
  if (!isThumbnailFrame()) return;
  window.parent.postMessage(
    { type: THUMBNAIL_MESSAGE, id, ok },
    window.location.origin,
  );
}

/** Whether a stored picture shows this version of the project */
export async function hasThumbnail(id: string, href: string) {
  return (await getThumbnail(id, href)) !== null;
}
/** Wide enough for a card on a large screen at 2x */
const THUMBNAIL_WIDTH = 320;

export type StoredThumbnail = {
  /** The project link it was drawn from: drawn again only once that changes */
  href: string;
  /** A JPEG, as a data URL */
  image: string;
};

/** Whether a picture shows this version of the project (its app version aside) */
const sameProject = (a: string, b: string) =>
  withoutVersion(a) === withoutVersion(b);

/**
 * A saved project's picture, if one of this version of it was taken in this
 * browser: one of an older version (changed since, on another device too)
 * isn't shown.
 */
export async function getThumbnail(
  id: string,
  href: string,
): Promise<string | null> {
  if (!browser) return null;
  try {
    const stored = await get<StoredThumbnail>(`${THUMBNAIL_PREFIX}${id}`);
    return stored && sameProject(stored.href, href) ? stored.image : null;
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

/**
 * Draws an SVG small, as a JPEG (white behind it), or null if it can't: at
 * full size with Canvg, as the gallery's pictures are drawn (svgToPNG), then
 * scaled down onto a small canvas.
 */
async function drawSmall(
  svg: SVGSVGElement,
  width: number,
  height: number,
): Promise<string | null> {
  if (!width || !height) return null;
  const full = document.createElement('canvas');
  full.width = width;
  full.height = height;
  const scale = Math.min(1, THUMBNAIL_WIDTH / width);
  const small = document.createElement('canvas');
  small.width = Math.max(1, Math.round(width * scale));
  small.height = Math.max(1, Math.round(height * scale));
  try {
    const fullCtx = full.getContext('2d');
    const ctx = small.getContext('2d');
    if (!fullCtx || !ctx) return null;
    const { Canvg } = await import('canvg');
    await Canvg.fromString(
      fullCtx,
      new XMLSerializer().serializeToString(svg),
      { ignoreAnimation: true, ignoreMouse: true },
    ).render();
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, small.width, small.height);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(full, 0, 0, small.width, small.height);
    return small.toDataURL('image/jpeg', 0.82);
  } catch {
    return null;
  } finally {
    // Safari only frees a canvas's memory once it's sized down
    for (const canvas of [full, small]) {
      canvas.width = 0;
      canvas.height = 0;
    }
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
  idle(() => void keepThumbnail(id, href, preview));
}

/** Takes and keeps the picture now; whether one of this link is kept. */
export async function keepThumbnail(
  id: string,
  href: string,
  preview: { svg?: SVGSVGElement | null; width?: number; height?: number },
): Promise<boolean> {
  {
    try {
      const key = `${THUMBNAIL_PREFIX}${id}`;
      const stored = await get<StoredThumbnail>(key);
      if (stored && sameProject(stored.href, href)) return true;
      if (!preview.svg?.isConnected) return false;
      const image = await drawSmall(
        preview.svg,
        preview.width ?? 0,
        preview.height ?? 0,
      );
      if (!image) return false;
      await set(key, { href, image } satisfies StoredThumbnail);
      return true;
    } catch (e) {
      console.warn('Could not keep the project’s picture', e);
      return false;
    }
  }
}

/**
 * Draws a saved project's picture in the background (My Projects): opens it
 * in a hidden frame on this site, where the planner keeps its picture and
 * says so. Resolves whether it did; `cancel` stops it (leaving the page).
 */
export function drawInFrame(
  id: string,
  href: string,
  timeoutMs = 60_000,
): { done: Promise<boolean>; cancel: () => void } {
  const frame = document.createElement('iframe');
  let finish: (ok: boolean) => void = () => {};
  const done = new Promise<boolean>((resolve) => (finish = resolve));
  const onMessage = (event: MessageEvent) => {
    if (
      event.origin === window.location.origin &&
      event.source === frame.contentWindow &&
      event.data?.type === THUMBNAIL_MESSAGE &&
      event.data.id === id
    )
      end(Boolean(event.data.ok));
  };
  const timer = setTimeout(() => end(false), timeoutMs);
  function end(ok: boolean) {
    clearTimeout(timer);
    window.removeEventListener('message', onMessage);
    frame.remove();
    finish(ok);
  }
  window.addEventListener('message', onMessage);

  // This site's copy of the project, wherever its link was saved
  const url = new URL(href, window.location.href);
  frame.name = THUMBNAIL_FRAME_NAME;
  frame.src = `${window.location.origin}${url.pathname}${url.search}${url.hash}`;
  frame.title = 'Drawing a project picture';
  frame.tabIndex = -1;
  frame.setAttribute('aria-hidden', 'true');
  // Laid out at a desktop size, off screen, so the preview draws as usual
  frame.style.cssText =
    'position:fixed;left:-20000px;top:0;width:1280px;height:900px;border:0;opacity:0;pointer-events:none;';
  document.body.appendChild(frame);
  return { done, cancel: () => end(false) };
}
