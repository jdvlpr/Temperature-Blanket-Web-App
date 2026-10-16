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

// Gallery pages published from the signed-in account (/api/account/gallery).

import { cleanName } from '#lib/utils/string-utils.js';

export type GalleryPage = {
  postId: number;
  /** The saved project, or for a palette the saved palette */
  projectId: string;
  title: string;
  publishedAt: number;
  kind?: 'project' | 'palette';
  /** A palette's Yarn Palette Creator link, or the project's link as published (none on older pages) */
  link?: string | null;
  /** Included on the owner's public gallery, with their name */
  showOwner?: boolean;
  /** When it was last updated in place, or null */
  updatedAt?: number | null;
};

/** Fired on window when the account's gallery pages change, so lists reload. */
export const GALLERY_PAGES_CHANGED = 'tb:gallery-pages-changed';

export type GallerySettings = {
  /** Whether the next page starts out included on the public gallery: the last choice */
  showOwnerDefault: boolean;
  removeOnDelete: boolean;
};

const PATH = '/api/account/gallery';

/** The settings, and the owner page's ID once a page has been included */
export type GalleryOwnerSettings = GallerySettings & {
  publicId: string | null;
};

/** The account's gallery pages and settings, or null when they aren't available. */
export async function getGalleryPages(): Promise<{
  posts: GalleryPage[];
  settings: GalleryOwnerSettings;
  /** Whether publishing from accounts is switched on */
  publishing: boolean;
  /** The account's display name, as it is now */
  name?: string;
} | null> {
  try {
    const response = await fetch(PATH);
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

export async function updateGallerySettings(
  changes: Partial<GallerySettings>,
): Promise<GalleryOwnerSettings> {
  const response = await fetch(PATH, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(changes),
  });
  if (!response.ok)
    throw new Error(`Gallery settings failed: ${response.status}`);
  return (await response.json()).settings;
}

/**
 * Includes one of the account's pages on its public gallery or takes it off.
 * Answers the owner page's ID, which exists once a page has been included.
 */
/** Anonymous was refused: the page's project is on Ravelry, which links to it. */
export class RavelryLinkedError extends Error {}

/**
 * Shows or hides the owner's name. `unlinkRavelry` unlinks the page's project
 * from Ravelry too, which Anonymous needs (otherwise RavelryLinkedError).
 */
export async function setGalleryPageShowOwner(
  postId: number,
  showOwner: boolean,
  { unlinkRavelry = false } = {},
): Promise<{ publicId: string | null }> {
  const response = await fetch(`${PATH}/${postId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      showOwner,
      ...(unlinkRavelry && { unlinkRavelry }),
    }),
  });
  if (response.status === 409)
    throw new RavelryLinkedError('Unlink it from Ravelry first');
  if (!response.ok)
    throw new Error(`Changing the gallery page failed: ${response.status}`);
  return response.json();
}

/** The gallery's longest palette name (MAX_PALETTE_TITLE_LENGTH on the server) */
export const MAX_GALLERY_PALETTE_NAME_LENGTH = 80;

/**
 * Whether a palette's gallery page shows another name than the palette has now
 * (its name, or the fallback when it has none), as the gallery would store it.
 * A palette's colors never change, so this is the only way it can differ.
 */
export const paletteNameDiffers = (
  label: string,
  page: Pick<GalleryPage, 'title'>,
) => cleanName(label, MAX_GALLERY_PALETTE_NAME_LENGTH) !== page.title;

export async function removeGalleryPage(postId: number) {
  const response = await fetch(`${PATH}/${postId}`, { method: 'DELETE' });
  if (!response.ok && response.status !== 404)
    throw new Error(`Removing the gallery page failed: ${response.status}`);
}

export type AccountPublishResult =
  /** WordPress's answer (200, 400, 409 duplicate…); `linked` when recorded to the account */
  | { status: 'answered'; response: Record<string, unknown> }
  /** Publishing is paused (GALLERY_PUBLISH_ENABLED off) */
  | { status: 'paused' }
  /** The gallery's plugin is too old to update pages in place */
  | { status: 'unsupported' }
  /** Not signed in anymore */
  | { status: 'signed-out' }
  /** The page being updated is gone */
  | { status: 'gone' }
  | { status: 'error'; message: string };

/**
 * Publishes the gallery payload as the signed-in user, or with `postId`
 * updates that page in place. Never falls back to an anonymous submission:
 * every page has an owner who can update or unpublish it.
 */
export async function publishFromAccount(
  body: string,
  { showOwner = false, postId }: { showOwner?: boolean; postId?: number } = {},
): Promise<AccountPublishResult> {
  return sendPage(
    postId ? `${PATH}/${postId}` : `${PATH}?showOwner=${showOwner}`,
    postId ? 'PUT' : 'POST',
    body,
  );
}

/** Updates one of the account's palette pages in place: its name and colors. */
export const updatePalettePage = (
  postId: number,
  palette: { title: string; yarnUrl: string },
) => sendPage(`${PATH}/${postId}`, 'PUT', JSON.stringify(palette));

async function sendPage(
  url: string,
  method: string,
  body: string,
): Promise<AccountPublishResult> {
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body,
    });
  } catch {
    return { status: 'error', message: 'Check your connection and try again.' };
  }
  const data = await response.json().catch(() => null);
  if (response.ok && data) return { status: 'answered', response: data };
  if (response.status === 503 && data?.code === 'GALLERY_PAUSED')
    return { status: 'paused' };
  if (response.status === 501) return { status: 'unsupported' };
  if (response.status === 401) return { status: 'signed-out' };
  if (response.status === 404) return { status: 'gone' };
  return {
    status: 'error',
    message:
      typeof data?.message === 'string'
        ? data.message
        : 'The gallery couldn’t be reached. Try again later.',
  };
}

export type SharePaletteResult =
  | { status: 'shared'; postId: number | null }
  /** This account published these colors already: its page (gallery plugin 1.7.0) */
  | { status: 'published-already'; postId: number; title: string }
  /** `code` is WordPress's, e.g. 409 when the same palette is already in the gallery
   * (an older plugin doesn't say which page) */
  | { status: 'error'; message: string; code?: number };

/** Shares a saved palette to the gallery as the signed-in user. */
export async function sharePalette(palette: {
  paletteId: string;
  title: string;
  yarnUrl: string;
  /** Include it on the account's public gallery, with its name */
  showOwner: boolean;
}): Promise<SharePaletteResult> {
  let response: Response;
  try {
    response = await fetch(`${PATH}/palettes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(palette),
    });
  } catch {
    return {
      status: 'error',
      message: 'Check your connection and try again.',
    };
  }
  const data = await response.json().catch(() => null);
  if (response.status === 401)
    return { status: 'error', message: 'Sign in again, then try again.' };
  if (response.status === 503)
    return {
      status: 'error',
      message: 'Sharing to the gallery is paused right now. Try again later.',
    };
  const existingId = Number(data?.data?.id);
  if (
    response.ok &&
    Number(data?.code) === 409 &&
    Number.isInteger(existingId) &&
    existingId > 0
  )
    return {
      status: 'published-already',
      postId: existingId,
      title: typeof data.data.title === 'string' ? data.data.title : '',
    };
  if (!response.ok || Number(data?.code) !== 200)
    return {
      status: 'error',
      message:
        typeof data?.message === 'string' && data.message
          ? data.message
          : 'The palette couldn’t be shared. Try again later.',
      code: Number(data?.code) || undefined,
    };
  window.dispatchEvent(new Event(GALLERY_PAGES_CHANGED));
  return {
    status: 'shared',
    postId: typeof data?.id === 'number' ? data.id : null,
  };
}

/** The account's gallery pages sorted out by what they were made from. */
export type GroupedGalleryPages = {
  /** The newest page of each saved project here, by project ID */
  byProject: Map<string, GalleryPage>;
  /** The newest page of each saved palette here, by palette ID */
  byPalette: Map<string, GalleryPage>;
};

/**
 * Puts each page with the project or palette it came from, so each shows one
 * page: its newest. A page goes with its project or palette (into the Trash
 * and out), so ones not saved here aren't shown.
 */
export function groupGalleryPages(
  pages: readonly GalleryPage[],
  projectIds: Iterable<string>,
  paletteIds: Iterable<string>,
): GroupedGalleryPages {
  const projects = new Set(projectIds);
  const palettes = new Set(paletteIds);
  const grouped: GroupedGalleryPages = {
    byProject: new Map(),
    byPalette: new Map(),
  };

  const newestFirst = [...pages].sort(
    (a, b) => b.publishedAt - a.publishedAt || b.postId - a.postId,
  );
  for (const page of newestFirst) {
    const isPalette = page.kind === 'palette';
    if (!(isPalette ? palettes : projects).has(page.projectId)) continue;
    const shown = isPalette ? grouped.byPalette : grouped.byProject;
    if (!shown.has(page.projectId)) shown.set(page.projectId, page);
  }
  return grouped;
}
