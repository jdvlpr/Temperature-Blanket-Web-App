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

// Synced projects: metadata in D1 (migrations/0003_sync.sql), gzipped project JSON
// in R2. The Worker never decompresses or parses a project, which keeps every
// request well inside the free plan's CPU limit. A deleted project keeps its R2
// copy for TRASH_DAYS (the Trash). Saved palettes are small, so they live in D1
// (migrations/0006_trash_and_palettes.sql) and share the revision counter.

import { trashCutoff } from '$lib/storage/trash';
import type {
  ChangesResponse,
  PaletteInput,
  PaletteRecord,
  ProjectMeta,
  TrashedProjectMeta,
} from '$lib/sync/protocol';
import type {
  D1Database,
  R2Bucket,
  ReadableStream,
} from '@cloudflare/workers-types';

export const PROJECT_ID_PATTERN = /^[A-Za-z0-9-]{1,64}$/;

/** Compressed size limit for one project. Years of daily weather fit easily. */
export const MAX_PROJECT_BYTES = 5 * 1024 * 1024;
/** Per-account quota: projects that aren't deleted, and their compressed size. */
export const MAX_PROJECTS_PER_USER = 200;
export const MAX_BYTES_PER_USER = 50 * 1024 * 1024;
export const MAX_TITLE_LENGTH = 200;
export const MAX_CHANGES_PAGE = 500;
/** Palettes that aren't deleted, per account */
export const MAX_PALETTES_PER_USER = 1000;
export const MAX_PALETTE_CODE_LENGTH = 4000;
export const MAX_PALETTE_NAME_LENGTH = 100;

const DAY_MS = 24 * 60 * 60 * 1000;
/** How long deletion records are kept for devices that haven't synced since. */
export const DELETION_RECORD_TTL_MS = 180 * DAY_MS;
/** How long replaced project copies are kept, so one lost in a conflict can be recovered. */
export const OLD_COPY_TTL_MS = 7 * DAY_MS;
const CLEANUP_INTERVAL_MS = DAY_MS;
// D1 allows 100 bound parameters per statement
const OLD_COPY_CHUNK = 90;

type ProjectRow = {
  projectId: string;
  rev: number;
  deletedAt: number | null;
  title: string;
  sizeBytes: number;
  schemaVersion: number;
  clientUpdatedAt: number;
  serverUpdatedAt: number;
  contentHash: string | null;
  blobKey: string | null;
};

const toMeta = (row: ProjectRow): ProjectMeta => ({
  id: row.projectId,
  rev: row.rev,
  deleted: row.deletedAt !== null,
  title: row.title,
  sizeBytes: row.sizeBytes,
  schemaVersion: row.schemaVersion,
  clientUpdatedAt: row.clientUpdatedAt,
  serverUpdatedAt: row.serverUpdatedAt,
  contentHash: row.contentHash,
});

type PaletteRow = {
  paletteId: string;
  rev: number;
  name: string;
  code: string;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
  purgedAt: number | null;
};

const toPalette = (row: PaletteRow): PaletteRecord => ({
  id: row.paletteId,
  rev: row.rev,
  name: row.name,
  code: row.code,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  deletedAt: row.deletedAt,
  purged: row.purgedAt !== null,
});

const blobKeyFor = (userId: string, projectId: string) =>
  `u/${userId}/p/${projectId}/${crypto.randomUUID()}.json.gz`;

const userPrefix = (userId: string) => `u/${userId}/`;

// Takes the user's next revision number. Every write runs this first in its batch.
const bumpRevision = (db: D1Database, userId: string) =>
  db
    .prepare(
      `insert into "userSync" ("userId", "rev") values (?, 1)
       on conflict ("userId") do update set "rev" = "rev" + 1`,
    )
    .bind(userId);

const CURRENT_REV = `(select "rev" from "userSync" where "userId" = ?)`;

async function projectRow(
  db: D1Database,
  userId: string,
  projectId: string,
): Promise<ProjectRow | null> {
  return db
    .prepare(`select * from "project" where "userId" = ? and "projectId" = ?`)
    .bind(userId, projectId)
    .first<ProjectRow>();
}

export async function getProjectMeta(
  db: D1Database,
  userId: string,
  projectId: string,
): Promise<ProjectMeta | null> {
  const row = await projectRow(db, userId, projectId);
  return row ? toMeta(row) : null;
}

export type { ProjectMeta };

/**
 * Everything that changed after revision `since`, oldest first. A device whose
 * `since` is older than purged deletion records must compare its whole list.
 */
export async function listChanges(
  db: D1Database,
  userId: string,
  since: number,
  limit: number,
): Promise<ChangesResponse> {
  const sync = await db
    .prepare(`select "rev", "minValidRev" from "userSync" where "userId" = ?`)
    .bind(userId)
    .first<{ rev: number; minValidRev: number }>();

  if (since > 0 && since < (sync?.minValidRev ?? 0))
    return { fullResyncRequired: true, rev: sync?.rev ?? 0 };

  // Each table's next `limit + 1` changes; merged by revision, the first `limit`
  // are the next page of both
  const [projects, palettes] = await Promise.all([
    db
      .prepare(
        `select * from "project" where "userId" = ? and "rev" > ?
         order by "rev" limit ?`,
      )
      .bind(userId, since, limit + 1)
      .all<ProjectRow>(),
    db
      .prepare(
        `select * from "palette" where "userId" = ? and "rev" > ?
         order by "rev" limit ?`,
      )
      .bind(userId, since, limit + 1)
      .all<PaletteRow>()
      // Before migration 0006: projects keep syncing without palettes
      .catch(() => ({ results: [] as PaletteRow[] })),
  ]);
  const merged = [
    ...projects.results.map((row) => ({ rev: row.rev, project: row })),
    ...palettes.results.map((row) => ({ rev: row.rev, palette: row })),
  ].sort((a, b) => a.rev - b.rev);
  const page = merged.slice(0, limit);

  return {
    fullResyncRequired: false,
    changes: page.flatMap((c) => ('project' in c ? [toMeta(c.project)] : [])),
    palettes: page.flatMap((c) =>
      'palette' in c ? [toPalette(c.palette)] : [],
    ),
    nextSince: page.at(-1)?.rev ?? since,
    hasMore: merged.length > limit,
  };
}

export type SaveInput = {
  userId: string;
  projectId: string;
  /** The revision this save is based on; null to create the project. */
  baseRev: number | null;
  clientUpdatedAt: number;
  schemaVersion: number;
  title: string;
  contentHash: string;
  sizeBytes: number;
  body: ReadableStream | ArrayBuffer;
};

export type SaveResult =
  | { status: 'saved'; meta: ProjectMeta }
  | { status: 'conflict'; current: ProjectMeta | null }
  | { status: 'quota'; reason: 'projects' | 'bytes' };

/**
 * Saves a project if `baseRev` is still its current revision (or it doesn't exist
 * yet, for a create). Otherwise another device saved first: nothing changes and
 * the current metadata comes back as a conflict.
 */
export async function saveProject(
  db: D1Database,
  bucket: R2Bucket,
  input: SaveInput,
  now = Date.now(),
): Promise<SaveResult> {
  const { userId, projectId, baseRev } = input;

  const usage = await db
    .prepare(
      `select count(*) as "projects", coalesce(sum("sizeBytes"), 0) as "bytes"
       from "project"
       where "userId" = ? and "deletedAt" is null and "projectId" != ?`,
    )
    .bind(userId, projectId)
    .first<{ projects: number; bytes: number }>();
  if ((usage?.projects ?? 0) + 1 > MAX_PROJECTS_PER_USER)
    return { status: 'quota', reason: 'projects' };
  if ((usage?.bytes ?? 0) + input.sizeBytes > MAX_BYTES_PER_USER)
    return { status: 'quota', reason: 'bytes' };

  const key = blobKeyFor(userId, projectId);
  await bucket.put(key, input.body, {
    httpMetadata: { contentType: 'application/gzip' },
  });

  const values = [
    input.clientUpdatedAt,
    now,
    input.schemaVersion,
    input.sizeBytes,
    input.title,
    input.contentHash,
    key,
  ];

  const statements =
    baseRev === null
      ? [
          bumpRevision(db, userId),
          db
            .prepare(
              `insert into "project" ("userId", "projectId", "rev", "clientUpdatedAt",
                 "serverUpdatedAt", "schemaVersion", "sizeBytes", "title", "contentHash", "blobKey")
               values (?, ?, ${CURRENT_REV}, ?, ?, ?, ?, ?, ?, ?)
               on conflict ("userId", "projectId") do nothing`,
            )
            .bind(userId, projectId, userId, ...values),
        ]
      : [
          bumpRevision(db, userId),
          // Only when the update below will succeed: same condition
          db
            .prepare(
              `insert into "syncOldBlob" ("key", "userId", "replacedAt")
               select "blobKey", "userId", ? from "project"
               where "userId" = ? and "projectId" = ? and "rev" = ? and "blobKey" is not null`,
            )
            .bind(now, userId, projectId, baseRev),
          // Also brings back a deleted project: an edit beats a deletion
          db
            .prepare(
              `update "project" set "rev" = ${CURRENT_REV}, "deletedAt" = null,
                 "clientUpdatedAt" = ?, "serverUpdatedAt" = ?, "schemaVersion" = ?,
                 "sizeBytes" = ?, "title" = ?, "contentHash" = ?, "blobKey" = ?
               where "userId" = ? and "projectId" = ? and "rev" = ?`,
            )
            .bind(userId, ...values, userId, projectId, baseRev),
        ];

  let changed: number;
  try {
    const results = await db.batch(statements);
    changed = results.at(-1)?.meta.changes ?? 0;
  } catch (e) {
    await bucket.delete(key);
    throw e;
  }

  if (changed === 0) {
    // Someone else saved first. A skipped revision number is harmless.
    await bucket.delete(key);
    return {
      status: 'conflict',
      current: await getProjectMeta(db, userId, projectId),
    };
  }

  const meta = await getProjectMeta(db, userId, projectId);
  return { status: 'saved', meta: meta! };
}

export type DeleteResult =
  | { status: 'deleted'; meta: ProjectMeta }
  | { status: 'conflict'; current: ProjectMeta }
  | { status: 'not-found' };

/**
 * Marks a project deleted if nothing changed since `baseRev`, so a deletion never
 * beats a newer edit from another device. Deleting it again is a no-op. Its data
 * stays, for the Trash: restoring it is a save over the deletion.
 */
export async function deleteProject(
  db: D1Database,
  userId: string,
  projectId: string,
  baseRev: number,
  now = Date.now(),
): Promise<DeleteResult> {
  const matches = `"userId" = ? and "projectId" = ? and "rev" = ? and "deletedAt" is null`;
  const results = await db.batch([
    bumpRevision(db, userId),
    db
      .prepare(
        `update "project" set "rev" = ${CURRENT_REV}, "deletedAt" = ?, "serverUpdatedAt" = ?
         where ${matches}`,
      )
      .bind(userId, now, now, userId, projectId, baseRev),
  ]);

  const current = await getProjectMeta(db, userId, projectId);
  if (!current) return { status: 'not-found' };
  if ((results.at(-1)?.meta.changes ?? 0) > 0 || current.deleted)
    return { status: 'deleted', meta: current };
  return { status: 'conflict', current };
}

/** A project's stored data (gzipped JSON) with its metadata, or null if there is none. */
export async function getProjectData(
  db: D1Database,
  bucket: R2Bucket,
  userId: string,
  projectId: string,
): Promise<{ meta: ProjectMeta; body: ReadableStream } | null> {
  const row = await projectRow(db, userId, projectId);
  if (!row?.blobKey || row.deletedAt !== null) return null;
  const object = await bucket.get(row.blobKey);
  if (!object) return null;
  return { meta: toMeta(row), body: object.body };
}

// *****************
// The Trash: deleted projects whose data is kept for TRASH_DAYS
// *****************

const IN_TRASH = `"deletedAt" is not null and "blobKey" is not null and "deletedAt" >= ?`;

/** Deleted projects that can still be restored, most recently deleted first. */
export async function listTrash(
  db: D1Database,
  userId: string,
  now = Date.now(),
): Promise<TrashedProjectMeta[]> {
  const { results } = await db
    .prepare(
      `select "projectId", "rev", "title", "deletedAt", "sizeBytes" from "project"
       where "userId" = ? and ${IN_TRASH} order by "deletedAt" desc`,
    )
    .bind(userId, trashCutoff(now))
    .all<{
      projectId: string;
      rev: number;
      title: string;
      deletedAt: number;
      sizeBytes: number;
    }>();
  return results.map(({ projectId, ...rest }) => ({ id: projectId, ...rest }));
}

/** A project in the Trash: its data (gzipped JSON) and revision, or null. */
export async function getTrashedProjectData(
  db: D1Database,
  bucket: R2Bucket,
  userId: string,
  projectId: string,
  now = Date.now(),
): Promise<{ rev: number; body: ReadableStream } | null> {
  const row = await db
    .prepare(
      `select "rev", "blobKey" from "project"
       where "userId" = ? and "projectId" = ? and ${IN_TRASH}`,
    )
    .bind(userId, projectId, trashCutoff(now))
    .first<{ rev: number; blobKey: string }>();
  if (!row) return null;
  const object = await bucket.get(row.blobKey);
  return object ? { rev: row.rev, body: object.body } : null;
}

/**
 * Deletes the kept data of deleted projects for good: one, or with `projectId`
 * null, the whole Trash. The deletion records stay, for devices that haven't
 * synced since. Returns how many were deleted.
 */
export async function purgeTrash(
  db: D1Database,
  bucket: R2Bucket,
  userId: string,
  projectId: string | null,
): Promise<number> {
  const { results } = await db
    .prepare(
      `select "projectId", "blobKey" from "project"
       where "userId" = ? and "deletedAt" is not null and "blobKey" is not null
       ${projectId === null ? '' : 'and "projectId" = ?'}`,
    )
    .bind(...(projectId === null ? [userId] : [userId, projectId]))
    .all<{ projectId: string; blobKey: string }>();
  for (let i = 0; i < results.length; i += OLD_COPY_CHUNK)
    await forgetBlobs(db, bucket, userId, results.slice(i, i + OLD_COPY_CHUNK));
  return results.length;
}

/**
 * Deletes these copies and clears them from their deleted projects. A project
 * restored meanwhile has a new copy, so its row is left alone.
 */
async function forgetBlobs(
  db: D1Database,
  bucket: R2Bucket,
  userId: string,
  rows: { projectId: string; blobKey: string }[],
) {
  if (!rows.length) return;
  await bucket.delete(rows.map((r) => r.blobKey));
  await db.batch(
    rows.map((r) =>
      db
        .prepare(
          `update "project" set "blobKey" = null, "sizeBytes" = 0, "contentHash" = null
           where "userId" = ? and "projectId" = ? and "blobKey" = ? and "deletedAt" is not null`,
        )
        .bind(userId, r.projectId, r.blobKey),
    ),
  );
}

// *****************
// Saved palettes
// *****************

export type PaletteSaveResult =
  { status: 'saved' | 'kept'; palette: PaletteRecord } | { status: 'quota' };

/**
 * Saves a palette if this change is newer than the account's copy. An older
 * change, or any change to a purged palette, is kept out: the account's copy
 * comes back ('kept') for the device to take.
 */
export async function savePalette(
  db: D1Database,
  userId: string,
  paletteId: string,
  input: PaletteInput,
  now = Date.now(),
): Promise<PaletteSaveResult> {
  const row = () =>
    db
      .prepare(`select * from "palette" where "userId" = ? and "paletteId" = ?`)
      .bind(userId, paletteId)
      .first<PaletteRow>();

  const existing = await row();
  if (
    existing &&
    (existing.purgedAt !== null || input.updatedAt <= existing.updatedAt)
  )
    return { status: 'kept', palette: toPalette(existing) };

  const live = !input.purged && input.deletedAt === null;
  if (live && (!existing || existing.deletedAt !== null)) {
    const count = await db
      .prepare(
        `select count(*) as "n" from "palette"
         where "userId" = ? and "deletedAt" is null and "purgedAt" is null and "paletteId" != ?`,
      )
      .bind(userId, paletteId)
      .first<number>('n');
    if ((count ?? 0) + 1 > MAX_PALETTES_PER_USER) return { status: 'quota' };
  }

  const purged = input.purged;
  const results = await db.batch([
    bumpRevision(db, userId),
    db
      .prepare(
        `insert into "palette" ("userId", "paletteId", "rev", "name", "code",
           "createdAt", "updatedAt", "deletedAt", "purgedAt")
         values (?, ?, ${CURRENT_REV}, ?, ?, ?, ?, ?, ?)
         on conflict ("userId", "paletteId") do update set
           "rev" = excluded."rev", "name" = excluded."name", "code" = excluded."code",
           "createdAt" = excluded."createdAt", "updatedAt" = excluded."updatedAt",
           "deletedAt" = excluded."deletedAt", "purgedAt" = excluded."purgedAt"
         where "palette"."purgedAt" is null and "palette"."updatedAt" < excluded."updatedAt"`,
      )
      .bind(
        userId,
        paletteId,
        userId,
        purged ? '' : input.name,
        purged ? '' : input.code,
        input.createdAt,
        input.updatedAt,
        purged ? (input.deletedAt ?? now) : input.deletedAt,
        purged ? now : null,
      ),
  ]);
  const saved = (await row())!;
  return {
    status: (results.at(-1)?.meta.changes ?? 0) > 0 ? 'saved' : 'kept',
    palette: toPalette(saved),
  };
}

/**
 * Purges old deletion records and replaced copies for one user, at most once a
 * day. Pages has no scheduled jobs, so this runs in the background after a sync write.
 */
export async function cleanUpUserSync(
  db: D1Database,
  bucket: R2Bucket,
  userId: string,
  now = Date.now(),
) {
  const claimed = await db
    .prepare(
      `update "userSync" set "cleanedUpAt" = ? where "userId" = ? and "cleanedUpAt" <= ?`,
    )
    .bind(now, userId, now - CLEANUP_INTERVAL_MS)
    .run();
  if (claimed.meta.changes === 0) return;

  // The Trash: data kept longer than TRASH_DAYS goes, and palettes are purged
  const trashEnd = trashCutoff(now);
  for (let i = 0; i < 10; i++) {
    const { results } = await db
      .prepare(
        `select "projectId", "blobKey" from "project" where "userId" = ?
         and "deletedAt" is not null and "deletedAt" < ? and "blobKey" is not null limit ?`,
      )
      .bind(userId, trashEnd, OLD_COPY_CHUNK)
      .all<{ projectId: string; blobKey: string }>();
    if (!results.length) break;
    await forgetBlobs(db, bucket, userId, results);
  }
  await db
    .prepare(
      `update "palette" set "name" = '', "code" = '', "purgedAt" = ?
       where "userId" = ? and "deletedAt" is not null and "deletedAt" < ? and "purgedAt" is null`,
    )
    .bind(now, userId, trashEnd)
    .run();

  const deletionCutoff = now - DELETION_RECORD_TTL_MS;
  const purged = await db
    .prepare(
      `select max("rev") as "maxRev" from (
         select "rev" from "project"
         where "userId" = ? and "deletedAt" is not null and "deletedAt" < ?
         union all
         select "rev" from "palette"
         where "userId" = ? and "deletedAt" is not null and "deletedAt" < ?)`,
    )
    .bind(userId, deletionCutoff, userId, deletionCutoff)
    .first<{ maxRev: number | null }>();
  if (purged?.maxRev)
    await db.batch([
      db
        .prepare(
          `delete from "project" where "userId" = ? and "deletedAt" is not null and "deletedAt" < ?`,
        )
        .bind(userId, deletionCutoff),
      db
        .prepare(
          `delete from "palette" where "userId" = ? and "deletedAt" is not null and "deletedAt" < ?`,
        )
        .bind(userId, deletionCutoff),
      db
        .prepare(
          `update "userSync" set "minValidRev" = max("minValidRev", ?) where "userId" = ?`,
        )
        .bind(purged.maxRev, userId),
    ]);

  const copyCutoff = now - OLD_COPY_TTL_MS;
  for (let i = 0; i < 10; i++) {
    const { results } = await db
      .prepare(
        `select "key" from "syncOldBlob" where "userId" = ? and "replacedAt" < ? limit ?`,
      )
      .bind(userId, copyCutoff, OLD_COPY_CHUNK)
      .all<{ key: string }>();
    if (!results.length) break;
    const keys = results.map((r) => r.key);
    await bucket.delete(keys);
    await db
      .prepare(
        `delete from "syncOldBlob" where "key" in (${keys.map(() => '?').join(', ')})`,
      )
      .bind(...keys)
      .run();
  }
}

/** Deletes every stored project copy for a user, before the account is deleted. */
export async function deleteUserProjectData(bucket: R2Bucket, userId: string) {
  let cursor: string | undefined;
  do {
    const listing = await bucket.list({ prefix: userPrefix(userId), cursor });
    if (listing.objects.length)
      await bucket.delete(listing.objects.map((o) => o.key));
    cursor = listing.truncated ? listing.cursor : undefined;
  } while (cursor);
}
