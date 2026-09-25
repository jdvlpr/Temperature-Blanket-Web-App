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

// Reading sync requests. A save's body is the gzipped project exactly as the
// browser compressed it; its metadata travels in headers, so the Worker never
// has to decompress or parse the project.

import { SYNC_HEADERS } from '$lib/sync/protocol';
import {
  MAX_PROJECT_BYTES,
  MAX_TITLE_LENGTH,
  PROJECT_ID_PATTERN,
} from './store';

export type SaveHeaders = {
  baseRev: number | null;
  clientUpdatedAt: number;
  schemaVersion: number;
  title: string;
  contentHash: string;
  sizeBytes: number;
};

export type Parsed<T> =
  | { ok: true; value: T }
  | { ok: false; status: number; code: string; message: string };

const invalid = (message: string): Parsed<never> => ({
  ok: false,
  status: 400,
  code: 'INVALID_REQUEST',
  message,
});

const nonNegativeInteger = (value: string | null) =>
  value !== null && /^\d{1,15}$/.test(value) ? Number(value) : null;

export const isProjectId = (id: string) => PROJECT_ID_PATTERN.test(id);

/** A revision from a query parameter or header; null when absent or invalid. */
export const parseRev = nonNegativeInteger;

export function parseSaveHeaders(headers: Headers): Parsed<SaveHeaders> {
  const sizeBytes = nonNegativeInteger(headers.get('content-length'));
  if (!sizeBytes)
    return {
      ok: false,
      status: 411,
      code: 'LENGTH_REQUIRED',
      message: 'Content-Length is required',
    };
  if (sizeBytes > MAX_PROJECT_BYTES)
    return {
      ok: false,
      status: 413,
      code: 'PROJECT_TOO_LARGE',
      message: 'This project is too large to sync',
    };

  const baseRevHeader = headers.get(SYNC_HEADERS.baseRev);
  const baseRev = baseRevHeader ? nonNegativeInteger(baseRevHeader) : null;
  if (baseRevHeader && baseRev === null)
    return invalid('Invalid base revision');

  const clientUpdatedAt = nonNegativeInteger(
    headers.get(SYNC_HEADERS.clientUpdatedAt),
  );
  if (clientUpdatedAt === null) return invalid('Invalid update time');

  const schemaVersion = nonNegativeInteger(
    headers.get(SYNC_HEADERS.schemaVersion),
  );
  if (!schemaVersion || schemaVersion > 1000)
    return invalid('Invalid schema version');

  let title: string;
  try {
    title = decodeURIComponent(headers.get(SYNC_HEADERS.title) ?? '');
  } catch {
    return invalid('Invalid title');
  }
  if (title.length > MAX_TITLE_LENGTH) title = title.slice(0, MAX_TITLE_LENGTH);

  const contentHash = headers.get(SYNC_HEADERS.contentHash) ?? '';
  if (!/^[0-9a-f]{64}$/.test(contentHash))
    return invalid('Invalid content hash');

  return {
    ok: true,
    value: {
      baseRev,
      clientUpdatedAt,
      schemaVersion,
      title,
      contentHash,
      sizeBytes,
    },
  };
}
