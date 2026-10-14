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
export async function setGalleryPageShowOwner(
  postId: number,
  showOwner: boolean,
): Promise<{ publicId: string | null }> {
  const response = await fetch(`${PATH}/${postId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ showOwner }),
  });
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

export type RenameGalleryPageResult =
  | { status: 'renamed'; title: string }
  /** The gallery plugin can't rename yet: publish a new version instead */
  | { status: 'unsupported' }
  | { status: 'error'; message: string };

/** Renames one of the account's palette pages in place, keeping its link. */
export async function renameGalleryPage(
  postId: number,
  title: string,
): Promise<RenameGalleryPageResult> {
  let response: Response;
  try {
    response = await fetch(`${PATH}/${postId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
  } catch {
    return { status: 'error', message: 'Check your connection and try again.' };
  }
  const data = await response.json().catch(() => null);
  if (response.ok && typeof data?.title === 'string')
    return { status: 'renamed', title: data.title };
  if (response.status === 501 && data?.code === 'RENAME_UNSUPPORTED')
    return { status: 'unsupported' };
  if (response.status === 401)
    return { status: 'error', message: 'Sign in again, then try again.' };
  if (response.status === 404)
    return {
      status: 'error',
      message: 'Its gallery page is gone. Refresh My Projects to see it.',
    };
  if (response.status === 400 && typeof data?.message === 'string')
    return { status: 'error', message: data.message };
  return {
    status: 'error',
    message: 'The gallery couldn’t be reached. Try again later.',
  };
}

export async function removeGalleryPage(postId: number) {
  const response = await fetch(`${PATH}/${postId}`, { method: 'DELETE' });
  if (!response.ok && response.status !== 404)
    throw new Error(`Removing the gallery page failed: ${response.status}`);
}

export type AccountPublishResult =
  /** WordPress's answer, as /api/project gives it; `linked` when recorded to the account */
  | { status: 'answered'; response: Record<string, unknown> }
  /** Publishing from accounts is off or unavailable: publish anonymously instead */
  | { status: 'fallback' };

/** Publishes the gallery payload as the signed-in user. */
export async function publishFromAccount(
  body: string,
  { showOwner = false } = {},
): Promise<AccountPublishResult> {
  const response = await fetch(`${PATH}?showOwner=${showOwner}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  if (response.ok)
    return { status: 'answered', response: await response.json() };
  return { status: 'fallback' };
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
  /** The newest page of each project not saved here, by project ID */
  galleryOnlyProjects: Map<string, GalleryPage>;
  /** The newest page of each palette not saved here, by palette ID */
  galleryOnlyPalettes: Map<string, GalleryPage>;
};

/**
 * Puts each page with the project or palette it came from, so each shows one
 * page: its newest. Ones not saved here show as cards of their own.
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
    galleryOnlyProjects: new Map(),
    galleryOnlyPalettes: new Map(),
  };

  const newestFirst = [...pages].sort(
    (a, b) => b.publishedAt - a.publishedAt || b.postId - a.postId,
  );
  for (const page of newestFirst) {
    const isPalette = page.kind === 'palette';
    const saved = (isPalette ? palettes : projects).has(page.projectId);
    const shown = isPalette
      ? saved
        ? grouped.byPalette
        : grouped.galleryOnlyPalettes
      : saved
        ? grouped.byProject
        : grouped.galleryOnlyProjects;
    if (!shown.has(page.projectId)) shown.set(page.projectId, page);
  }
  return grouped;
}
