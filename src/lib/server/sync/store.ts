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
// request well inside the free plan's CPU limit.

import type { ChangesResponse, ProjectMeta } from '$lib/sync/protocol';
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

  const { results } = await db
    .prepare(
      `select * from "project" where "userId" = ? and "rev" > ?
       order by "rev" limit ?`,
    )
    .bind(userId, since, limit + 1)
    .all<ProjectRow>();

  const hasMore = results.length > limit;
  const changes = results.slice(0, limit).map(toMeta);
  return {
    fullResyncRequired: false,
    changes,
    nextSince: changes.at(-1)?.rev ?? since,
    hasMore,
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
 * beats a newer edit from another device. Deleting it again is a no-op.
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
        `insert into "syncOldBlob" ("key", "userId", "replacedAt")
         select "blobKey", "userId", ? from "project" where ${matches} and "blobKey" is not null`,
      )
      .bind(now, userId, projectId, baseRev),
    db
      .prepare(
        `update "project" set "rev" = ${CURRENT_REV}, "deletedAt" = ?, "serverUpdatedAt" = ?,
           "sizeBytes" = 0, "contentHash" = null, "blobKey" = null
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

  const deletionCutoff = now - DELETION_RECORD_TTL_MS;
  const purged = await db
    .prepare(
      `select max("rev") as "maxRev" from "project"
       where "userId" = ? and "deletedAt" is not null and "deletedAt" < ?`,
    )
    .bind(userId, deletionCutoff)
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
