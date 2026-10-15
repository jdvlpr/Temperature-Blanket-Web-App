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
    };

const CONNECTED_HINT = 'tb-ravelry-connected';

/**
 * Whether Ravelry was connected when this browser last checked (the Account
 * page and My Projects check), so the planner can offer the stash without
 * asking the server each time it opens.
 */
export function ravelryConnectedHint(): boolean {
  try {
    return localStorage.getItem(CONNECTED_HINT) === '1';
  } catch {
    return false;
  }
}

function setConnectedHint(connected: boolean) {
  try {
    if (connected) localStorage.setItem(CONNECTED_HINT, '1');
    else localStorage.removeItem(CONNECTED_HINT);
  } catch {
    // Without it, the planner doesn't offer the stash
  }
}

/** Whether Ravelry can be connected and to whom it is; null when that can't be told. */
export async function getRavelryStatus(): Promise<RavelryStatus | null> {
  try {
    const response = await fetch(PATH);
    if (!response.ok) {
      // Signed out, or Ravelry off
      if (response.status === 401 || response.status === 404)
        setConnectedHint(false);
      return null;
    }
    const status: RavelryStatus = await response.json();
    setConnectedHint(
      status.available && status.connected && !status.needsReconnect,
    );
    return status;
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
  setConnectedHint(false);
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
  return error.message;
}

export const listRavelryProjects = () =>
  request<{ projects: RavelryProjectLink[] }>('/projects').then(
    (r) => r.projects,
  );

/** The link, with its photos refreshed from Ravelry. */
export const getRavelryProject = (projectId: string) =>
  request<{ project: RavelryProjectLink }>(
    `/projects/${encodeURIComponent(projectId)}`,
  ).then((r) => r.project);

export type RavelryProjectRequest = {
  name: string;
  craftId: number | null;
  statusId: number | null;
  started: string | null;
  finishBy: string | null;
  link: string;
  notes: string;
  yarns: { ravelryYarnId?: number; name: string; colorway: string }[];
  update?: { name: boolean; dates: boolean; status: boolean; notes: boolean };
};

/** Posts the project to Ravelry, or updates the Ravelry project it's linked to. */
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

/** Adds a photo to the linked Ravelry project; as `picture`, it replaces the app's last one. */
export function addRavelryPhoto(
  projectId: string,
  file: Blob,
  { picture = false } = {},
) {
  const form = new FormData();
  form.set('file', file, 'photo');
  if (picture) form.set('picture', '1');
  return request<{ photos: RavelryPhoto[]; processing: boolean }>(
    `/projects/${encodeURIComponent(projectId)}/photos`,
    { method: 'POST', body: form },
  );
}

/** Deletes a photo of the linked project, on Ravelry too. */
export const deleteRavelryPhoto = (projectId: string, photoId: number) =>
  request<{ photos: RavelryPhoto[] }>(
    `/projects/${encodeURIComponent(projectId)}/photos/${photoId}`,
    { method: 'DELETE' },
  ).then((r) => r.photos);

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

export type RavelryStashEntry = {
  id: number;
  brand: string;
  yarn: string;
  colorway: string;
  colorFamily: string;
  weight: string;
  ravelryYarnId: number | null;
  photo: { small: string | null; medium: string | null } | null;
  url: string;
};

export const getRavelryStash = () =>
  request<{ stash: RavelryStashEntry[] }>('/stash').then((r) => r.stash);
