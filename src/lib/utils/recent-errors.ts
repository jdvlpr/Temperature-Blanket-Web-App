// Copyright (c) 2026, Thomas (https://github.com/jdvlpr)
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

// The last few errors in this visit, kept in memory only (src/hooks.client.ts
// notes them, in the beta), so feedback can say what went wrong. Nothing is
// sent unless the person sends feedback, which shows them first.

import { ERROR_TEXT_MAX, ERRORS_MAX } from '#lib/utils/beta-feedback.js';

const errors: string[] = [];

/** One line for an error: its name and message, then where it was thrown */
export function describeError(error: unknown): string | null {
  const message = error instanceof Error ? error.message : error;
  // A script from another origin (an extension, analytics): nothing to learn
  if (typeof message === 'string' && /^Script error\.?$/.test(message.trim()))
    return null;
  let text: string;
  if (error instanceof Error) {
    const where = error.stack
      ?.split('\n')
      .map((line) => line.trim())
      .find((line) => line.startsWith('at ') || line.includes('@'));
    text = `${error.name}: ${error.message}${where ? ` (${where})` : ''}`;
  } else if (typeof error === 'string') {
    text = error;
  } else {
    return null;
  }
  return text.slice(0, ERROR_TEXT_MAX);
}

export function noteError(error: unknown) {
  const text = describeError(error);
  if (!text || errors.at(-1) === text) return;
  errors.push(text);
  if (errors.length > ERRORS_MAX) errors.shift();
}

export const recentErrors = (): string[] => [...errors];

/** Notes errors nothing caught, once (the beta only) */
export function watchErrors() {
  window.addEventListener('error', (event) =>
    noteError(event.error ?? event.message),
  );
  window.addEventListener('unhandledrejection', (event) =>
    noteError(event.reason),
  );
}
