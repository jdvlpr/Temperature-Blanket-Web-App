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

// Project IDs are opaque strings. Older projects use the millisecond timestamp
// of when the app was first loaded (e.g. "1727190000000"); newer projects use a
// UUID. Both stay valid forever, since they're part of every share URL.
export const PROJECT_ID_PATTERN = /^[A-Za-z0-9-]{1,64}$/;

const LEGACY_TIMESTAMP_ID_PATTERN = /^\d+$/;

/**
 * Create a new project ID (a version 4 UUID).
 * Never throws: `crypto.randomUUID` only exists in secure contexts (HTTPS or
 * localhost), so fall back to `crypto.getRandomValues`, then `Math.random`.
 */
export function newProjectId(): string {
  const cryptoObj = globalThis.crypto;
  if (typeof cryptoObj?.randomUUID === 'function') {
    try {
      return cryptoObj.randomUUID();
    } catch {
      // Fall through to the manual version below
    }
  }

  const bytes = new Uint8Array(16);
  if (typeof cryptoObj?.getRandomValues === 'function') {
    cryptoObj.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++)
      bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10xx

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'));
  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-');
}

/**
 * For a legacy timestamp project ID, return the time it encodes (in ms).
 * Returns null for any other ID, such as a UUID.
 */
export function timestampFromLegacyProjectId(
  id: string | null | undefined,
): number | null {
  if (!id || !LEGACY_TIMESTAMP_ID_PATTERN.test(id)) return null;
  const timestamp = Number(id);
  // Must also be a valid Date: toISOString() throws past ±8.64e15 ms
  return Number.isSafeInteger(timestamp) &&
    Number.isFinite(new Date(timestamp).getTime())
    ? timestamp
    : null;
}

/**
 * The time a project was created, in ms: its stored `createdAt` if it has
 * one, otherwise the time encoded in a legacy timestamp ID, otherwise null.
 */
export function projectCreatedAtTime({
  createdAt,
  id,
}: {
  createdAt?: string | null;
  id?: string | null;
}): number | null {
  if (createdAt) {
    const time = new Date(createdAt).getTime();
    if (Number.isFinite(time)) return time;
  }
  return timestampFromLegacyProjectId(id);
}
