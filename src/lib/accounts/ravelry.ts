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

/** Whether Ravelry can be connected and to whom it is; null when that can't be told. */
export async function getRavelryStatus(): Promise<RavelryStatus | null> {
  try {
    const response = await fetch(PATH);
    return response.ok ? await response.json() : null;
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
