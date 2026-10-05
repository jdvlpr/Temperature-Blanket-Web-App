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

// No imports, so scripts outside Vite (generate-auth-migration) can load it.

// Invisible characters that can disguise or reorder text (bidirectional
// overrides, zero-width spaces, the byte-order mark). The zero-width joiner
// stays, since emoji sequences need it.
const INVISIBLE_NAME_CHARACTERS =
  /[\u00AD\u061C\u180E\u200B\u200C\u200E\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]/gu;

/**
 * A name someone typed (for a project, palette or account), made safe to store
 * and show: no control or invisible formatting characters, whitespace runs as
 * one space, trimmed, and at most `max` characters without splitting an emoji
 * or other surrogate pair. Showing it still needs the usual escaping.
 */
export const cleanName = (name: unknown, max: number): string => {
  if (typeof name !== 'string') return '';
  const cleaned = name
    .normalize('NFC')
    .replace(/\p{Cc}/gu, ' ')
    .replace(INVISIBLE_NAME_CHARACTERS, '')
    .replace(/\s+/g, ' ')
    .trim();
  return Array.from(cleaned).slice(0, max).join('').trim();
};
