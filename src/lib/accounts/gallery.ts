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
  projectId: string;
  title: string;
  publishedAt: number;
};

export type GallerySettings = {
  showName: boolean;
  removeOnDelete: boolean;
};

const PATH = '/api/account/gallery';

/** The account's gallery pages and settings, or null when they aren't available. */
export async function getGalleryPages(): Promise<{
  posts: GalleryPage[];
  settings: GallerySettings;
  /** Whether publishing from accounts is switched on */
  publishing: boolean;
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
): Promise<GallerySettings> {
  const response = await fetch(PATH, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(changes),
  });
  if (!response.ok)
    throw new Error(`Gallery settings failed: ${response.status}`);
  return (await response.json()).settings;
}

export async function removeGalleryPage(postId: number) {
  const response = await fetch(`${PATH}/${postId}`, { method: 'DELETE' });
  if (!response.ok && response.status !== 404)
    throw new Error(`Removing the gallery page failed: ${response.status}`);
}

export type AccountPublishResult =
  /** WordPress's answer, as /api/project gives it; `linked` when recorded to the account */
  | { status: 'answered'; response: Record<string, unknown> }
  /** Publish anonymously instead; 'not-saved' when the project isn't in the account */
  | { status: 'fallback'; reason: 'not-saved' | 'unavailable' };

/** Publishes the gallery payload as the signed-in user. */
export async function publishFromAccount(
  body: string,
): Promise<AccountPublishResult> {
  const response = await fetch(PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  if (response.ok)
    return { status: 'answered', response: await response.json() };
  const error = await response.json().catch(() => null);
  return {
    status: 'fallback',
    reason: error?.code === 'NOT_IN_ACCOUNT' ? 'not-saved' : 'unavailable',
  };
}
