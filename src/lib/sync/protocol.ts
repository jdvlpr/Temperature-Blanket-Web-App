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

// What the browser and the /api/sync routes agree on.
//
//   GET    /api/sync/changes?since=N&limit=100  ChangesResponse
//   GET    /api/sync/projects/{id}               gzipped project JSON; ETag = revision
//   PUT    /api/sync/projects/{id}               gzipped project JSON + SYNC_HEADERS → { meta }
//   DELETE /api/sync/projects/{id}?baseRev=N     { meta }
//   GET    /api/sync/trash                       { projects: TrashedProjectMeta[] }
//   DELETE /api/sync/trash                       deletes everything in it for good
//   GET    /api/sync/trash/{id}                  a trashed project's gzipped JSON
//   DELETE /api/sync/trash/{id}                  deletes one for good
//   PUT    /api/sync/palettes                    { palettes: PaletteUpload[] } → { results }
//
// A save or delete based on an outdated revision gets 409 { code: 'CONFLICT', current }.
// A deleted project stays in the Trash (with its data) for TRASH_DAYS; restoring
// one is an ordinary save over the deletion. Palettes travel in the changes feed.

export const SYNC_API = '/api/sync';

export const SYNC_HEADERS = {
  /** The revision the save is based on; absent to create the project */
  baseRev: 'x-sync-base-rev',
  /** When the device last edited the project, in milliseconds */
  clientUpdatedAt: 'x-sync-client-updated-at',
  schemaVersion: 'x-sync-schema-version',
  /** Percent-encoded, since titles are place names in any language */
  title: 'x-sync-title',
  /** SHA-256 (hex) of the project's content, ignoring its site and save time (projectFingerprintText) */
  contentHash: 'x-sync-content-hash',
  /** On a project download: its revision */
  rev: 'x-sync-rev',
} as const;

/** The shape of a synced project's JSON. Raise it when that shape changes. */
export const SYNC_SCHEMA_VERSION = 1;

export type ProjectMeta = {
  id: string;
  rev: number;
  deleted: boolean;
  title: string;
  sizeBytes: number;
  schemaVersion: number;
  clientUpdatedAt: number;
  serverUpdatedAt: number;
  contentHash: string | null;
};

/** A saved palette as the account keeps it. Newest `updatedAt` wins. */
export type PaletteRecord = {
  id: string;
  rev: number;
  name: string;
  /** Empty once purged */
  code: string;
  createdAt: number;
  updatedAt: number;
  /** In the Trash since then */
  deletedAt: number | null;
  /** Deleted for good: nothing brings it back */
  purged: boolean;
};

export type PaletteInput = Omit<PaletteRecord, 'id' | 'rev'>;

/** Palettes go up together, up to MAX_PALETTES_PER_UPLOAD a request */
export type PaletteUpload = PaletteInput & { id: string };
export const MAX_PALETTES_PER_UPLOAD = 100;

/** Per palette: the account's copy afterwards, or why it couldn't be saved */
export type PaletteUploadResult =
  | { id: string; palette: PaletteRecord; applied: boolean }
  | { id: string; error: SyncErrorCode };

/** A deleted project the account still keeps (the Trash). */
export type TrashedProjectMeta = {
  id: string;
  rev: number;
  title: string;
  deletedAt: number;
  sizeBytes: number;
};

export type ChangesResponse =
  | { fullResyncRequired: true; rev: number }
  | {
      fullResyncRequired: false;
      changes: ProjectMeta[];
      /** Palettes changed in the same revision range (absent from older servers) */
      palettes?: PaletteRecord[];
      nextSince: number;
      hasMore: boolean;
    };

export type SyncErrorCode =
  | 'CONFLICT'
  | 'SYNC_PAUSED'
  | 'SYNC_NOT_INVITED'
  | 'QUOTA_EXCEEDED'
  | 'PROJECT_TOO_LARGE'
  | 'LENGTH_REQUIRED'
  | 'INVALID_REQUEST'
  | 'NOT_FOUND';
