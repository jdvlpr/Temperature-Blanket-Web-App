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

// The signed-in account's Ravelry link (/api/account/ravelry). Ravelry is
// linked, never signed in with; its tokens stay on the server.

const PATH = '/api/account/ravelry';

export type RavelryStatus =
  | { available: false }
  | { available: true; connected: false }
  | {
      available: true;
      connected: true;
      username?: string;
      photoUrl?: string | null;
      /** Linked, but Ravelry no longer accepts it: connect again */
      needsReconnect?: boolean;
      /** Linked, but it couldn't be checked just now (see the server log) */
      failed?: boolean;
    };

/** Whether Ravelry can be connected and to whom it is; null when that can't be told. */
export async function getRavelryStatus(): Promise<RavelryStatus | null> {
  try {
    const response = await fetch(PATH);
    // Signed out, or Ravelry off
    if (!response.ok) return null;
    return (await response.json()) as RavelryStatus;
  } catch {
    return null;
  }
}

/**
 * Leaves for Ravelry to approve the link, then comes back to `returnTo`, with
 * ?error= if it failed.
 */
export async function connectRavelry(returnTo = '/account') {
  // Better Auth's generic OAuth providers link like the built-in ones
  const response = await fetch('/api/auth/link-social', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: 'ravelry',
      callbackURL: returnTo,
      // Marked, so only the Ravelry row shows the error
      errorCallbackURL: `${returnTo}${returnTo.includes('?') ? '&' : '?'}ravelry=failed`,
    }),
  });
  if (!response.ok)
    throw new Error(`Connect Ravelry failed: ${response.status}`);
  const { url } = (await response.json()) as { url: string };
  window.location.assign(url);
}

/** Forgets the Ravelry link here; nothing on Ravelry changes. */
export async function disconnectRavelry() {
  const response = await fetch(PATH, { method: 'DELETE' });
  if (!response.ok)
    throw new Error(`Disconnect Ravelry failed: ${response.status}`);
}

export type RavelryPhoto = {
  photoId: number;
  sortOrder: number;
  /** The project's picture from this app (replaced on update) */
  isPicture: boolean;
  squareUrl: string | null;
  smallUrl: string | null;
  mediumUrl: string | null;
  medium2Url: string | null;
  aspectRatio: number | null;
};

/** A saved project posted to Ravelry. */
export type RavelryProjectLink = {
  projectId: string;
  url: string;
  postedAt: number;
  updatedAt: number;
  photos: RavelryPhoto[];
  /** What the app's picture was drawn from (see ravelryPictureKey), if it's been added */
  pictureKey: string | null;
};

/** A yarn on the Ravelry project; `ours` when this app added it. */
export type RavelryPack = {
  packId: number;
  name: string;
  colorway: string;
  yarnId: number | null;
  ours: boolean;
};

/** What's on the Ravelry project now (the notes without the link line). */
export type RavelryProjectDetails = {
  name: string;
  craftId: number | null;
  statusId: number | null;
  started: string | null;
  finishBy: string | null;
  completed: string | null;
  progress: number | null;
  notes: string;
  packs: RavelryPack[];
};

/** A failed call: `code` RAVELRY_RECONNECT means connect Ravelry again. */
export class RavelryRequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | undefined,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${PATH}${path}`, init);
  } catch {
    throw new RavelryRequestError(
      0,
      'OFFLINE',
      'Check your connection and try again.',
    );
  }
  const body = await response.json().catch(() => null);
  if (!response.ok)
    throw new RavelryRequestError(
      response.status,
      body?.code,
      body?.message ?? 'Something went wrong. Try again.',
    );
  return body as T;
}

const jsonInit = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

/** A message for people, from a failed Ravelry request. */
export function ravelryErrorMessage(error: unknown): string {
  if (!(error instanceof RavelryRequestError))
    return 'Something went wrong. Try again.';
  if (error.code === 'RAVELRY_RECONNECT')
    return 'Ravelry stopped accepting the connection. Connect it again on your Account page.';
  if (error.code === 'RAVELRY_ERROR')
    return 'Ravelry didn’t answer as expected. Try again in a moment.';
  if (error.code === 'NEEDS_GALLERY_PAGE')
    return 'Publish it to the gallery first, then post it to Ravelry.';
  if (error.code === 'NEEDS_NAME_SHOWN')
    return 'Show your name on its gallery page first, then post it to Ravelry.';
  return error.message;
}

export const listRavelryProjects = () =>
  request<{ projects: RavelryProjectLink[] }>('/projects').then(
    (r) => r.projects,
  );

/** The link, with its photos, and what's on the Ravelry project now. */
export const getRavelryProject = (projectId: string) =>
  request<{ project: RavelryProjectLink; details: RavelryProjectDetails }>(
    `/projects/${encodeURIComponent(projectId)}`,
  );

type RavelryYarn = { ravelryYarnId?: number; name: string; colorway: string };

/**
 * Posting needs a name and sends everything. Updating sends only the fields
 * that changed (null clears a date) and the yarns to add or remove.
 */
export type RavelryProjectRequest = {
  name?: string;
  craftId?: number | null;
  statusId?: number | null;
  started?: string | null;
  finishBy?: string | null;
  completed?: string | null;
  /** 0 to 100 */
  progress?: number | null;
  /** Without the link line, which the server keeps at the end */
  notes?: string;
  /** Posting: one per color */
  yarns?: RavelryYarn[];
  /** Updating: only packs this app added can be removed */
  packs?: { add: RavelryYarn[]; remove: number[] };
};

/** Posts the project to Ravelry, or changes the Ravelry project it's linked to. */
export const postRavelryProject = (
  projectId: string,
  body: RavelryProjectRequest,
) =>
  request<{ project: RavelryProjectLink }>(
    `/projects/${encodeURIComponent(projectId)}`,
    jsonInit('POST', body),
  ).then((r) => r.project);

/** Unlinks it here; the Ravelry project stays on Ravelry. */
export const unlinkRavelryProject = (projectId: string) =>
  request<{ unlinked: true }>(`/projects/${encodeURIComponent(projectId)}`, {
    method: 'DELETE',
  });

type PhotoResult = { photos: RavelryPhoto[]; processing: boolean };

/**
 * Adds a photo to the linked project; as the `picture`, it replaces the app's
 * last one, and `pictureKey` is kept with it. It goes straight from the browser to
 * Ravelry (with a one-use token, so big photos skip this server), or through
 * this server if that upload doesn't reach Ravelry.
 */
export async function addRavelryPhoto(
  projectId: string,
  file: Blob,
  {
    picture = false,
    pictureKey,
  }: { picture?: boolean; pictureKey?: string | null } = {},
): Promise<PhotoResult> {
  const path = `/projects/${encodeURIComponent(projectId)}/photos`;
  try {
    const { uploadToken, uploadUrl } = await request<{
      uploadToken: string;
      uploadUrl: string;
    }>(`${path}/upload`, { method: 'POST' });
    const form = new FormData();
    form.set('upload_token', uploadToken);
    form.set('file0', file, photoFilename(file));
    // Ravelry's answer may be hidden by CORS; the server asks Ravelry instead
    await fetch(uploadUrl, {
      method: 'POST',
      body: form,
      mode: 'no-cors',
    }).catch(() => {});
    return await request<PhotoResult>(
      path,
      jsonInit('POST', { uploadToken, picture, pictureKey }),
    );
  } catch (e) {
    // Only an upload that didn't arrive falls back; other errors are real
    if (!(e instanceof RavelryRequestError) || e.code !== 'UPLOAD_NOT_FOUND')
      throw e;
  }
  const form = new FormData();
  form.set('file', file, 'photo');
  if (picture) form.set('picture', '1');
  if (pictureKey) form.set('pictureKey', pictureKey);
  return request<PhotoResult>(path, { method: 'POST', body: form });
}

const photoFilename = (file: Blob) =>
  file.type === 'image/png'
    ? 'photo.png'
    : file.type.includes('hei')
      ? 'photo.heic'
      : 'photo.jpg';

/** Deletes a photo of the linked project, on Ravelry too. */
export const deleteRavelryPhoto = (projectId: string, photoId: number) =>
  request<{ photos: RavelryPhoto[] }>(
    `/projects/${encodeURIComponent(projectId)}/photos/${photoId}`,
    { method: 'DELETE' },
  ).then((r) => r.photos);

/** Puts the photos in this order on Ravelry; the first is the main photo. */
export const reorderRavelryPhotos = (projectId: string, photoIds: number[]) =>
  request<{ photos: RavelryPhoto[] }>(
    `/projects/${encodeURIComponent(projectId)}/photos/order`,
    jsonInit('POST', { photoIds }),
  ).then((r) => r.photos);

/**
 * What the app's picture was drawn from, as a short code: the project's link
 * plus anything else it's drawn from. The same code later means the picture on
 * Ravelry is still current. Null where the browser can't hash.
 */
export async function ravelryPictureKey(href: string, extra: string) {
  try {
    const bytes = new TextEncoder().encode(`${href}\n${extra}`);
    const hash = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(hash)]
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, 16);
  } catch {
    return null;
  }
}

export type RavelryOption = { id: number; name: string };

export const getRavelryOptions = () =>
  request<{ crafts: RavelryOption[]; statuses: RavelryOption[] }>('/options');

export type RavelryYarnMatch = {
  id: number;
  name: string;
  company: string;
  weight: string;
  discontinued: boolean;
  photoUrl: string | null;
};

export const searchRavelryYarns = (query: string) =>
  request<{ yarns: RavelryYarnMatch[] }>(
    `/yarns?q=${encodeURIComponent(query)}`,
  ).then((r) => r.yarns);
