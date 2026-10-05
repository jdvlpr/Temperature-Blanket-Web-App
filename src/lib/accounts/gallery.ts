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

export type GalleryPage = {
  postId: number;
  /** The saved project, or for a palette the saved palette */
  projectId: string;
  title: string;
  publishedAt: number;
  kind?: 'project' | 'palette';
  /** A palette's Yarn Palette Creator link */
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
  | { status: 'error'; message: string };

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
  if (!response.ok || Number(data?.code) !== 200)
    return {
      status: 'error',
      message:
        typeof data?.message === 'string' && data.message
          ? data.message
          : 'The palette couldn’t be shared. Try again later.',
    };
  window.dispatchEvent(new Event(GALLERY_PAGES_CHANGED));
  return {
    status: 'shared',
    postId: typeof data?.id === 'number' ? data.id : null,
  };
}
