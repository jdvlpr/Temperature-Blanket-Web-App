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

// The app's record of gallery pages published from accounts (migration 0004).
// The pages themselves live on WordPress.

import type { D1Database } from '@cloudflare/workers-types';

export type GalleryPostKind = 'project' | 'palette';

export type GalleryPost = {
  postId: number;
  /** The saved project's ID, or for a palette the saved palette's */
  projectId: string;
  title: string;
  publishedAt: number;
  /** Since migration 0007; older rows are projects */
  kind?: GalleryPostKind;
  /** A palette's Yarn Palette Creator link */
  link?: string | null;
};

export type GallerySettings = {
  /** Show the account's display name on its gallery pages */
  showName: boolean;
  /** When the account is deleted, remove its gallery pages instead of keeping them */
  removeOnDelete: boolean;
};

const DEFAULT_SETTINGS: GallerySettings = {
  showName: false,
  removeOnDelete: false,
};

export async function recordPost(
  db: D1Database,
  userId: string,
  post: GalleryPost,
) {
  await db
    .prepare(
      `insert or ignore into "galleryPost" ("postId", "userId", "projectId", "title", "publishedAt", "kind", "link")
       values (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      post.postId,
      userId,
      post.projectId,
      post.title,
      post.publishedAt,
      post.kind ?? 'project',
      post.link ?? null,
    )
    .run();
}

/** The user's gallery pages, newest first. */
export async function listPosts(
  db: D1Database,
  userId: string,
): Promise<GalleryPost[]> {
  const { results } = await db
    .prepare(
      `select "postId", "projectId", "title", "publishedAt", "kind", "link" from "galleryPost"
       where "userId" = ? order by "publishedAt" desc`,
    )
    .bind(userId)
    .all<GalleryPost>();
  return results;
}

/** Whether this user published this page from their account. */
export async function ownsPost(
  db: D1Database,
  userId: string,
  postId: number,
): Promise<boolean> {
  const row = await db
    .prepare(
      `select 1 as "owned" from "galleryPost" where "postId" = ? and "userId" = ?`,
    )
    .bind(postId, userId)
    .first();
  return row !== null;
}

/** How many palettes the user has shared since this time (a daily limit). */
export async function countPalettesSince(
  db: D1Database,
  userId: string,
  since: number,
): Promise<number> {
  const row = await db
    .prepare(
      `select count(*) as "count" from "galleryPost"
       where "userId" = ? and "kind" = 'palette' and "publishedAt" >= ?`,
    )
    .bind(userId, since)
    .first<{ count: number }>();
  return row?.count ?? 0;
}

export async function forgetPost(
  db: D1Database,
  userId: string,
  postId: number,
) {
  await db
    .prepare(`delete from "galleryPost" where "postId" = ? and "userId" = ?`)
    .bind(postId, userId)
    .run();
}

/** The settings, and the owner page's ID once they've shown their name. */
export type GalleryOwnerSettings = GallerySettings & {
  publicId: string | null;
};

const PUBLIC_ID_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const PUBLIC_ID_LENGTH = 12;
export const PUBLIC_ID_PATTERN = /^[A-Za-z0-9]{12}$/;

/** A random ID for an owner page, e.g. /gallery/by/Xk3pQ9aZr2Lm. */
export function newPublicId() {
  const bytes = crypto.getRandomValues(new Uint8Array(PUBLIC_ID_LENGTH));
  // 62 letters, so 248 = 4 × 62 keeps every letter equally likely
  let id = '';
  while (id.length < PUBLIC_ID_LENGTH) {
    for (const byte of bytes)
      if (byte < 248 && id.length < PUBLIC_ID_LENGTH)
        id += PUBLIC_ID_ALPHABET[byte % 62];
    crypto.getRandomValues(bytes);
  }
  return id;
}

export async function getSettings(
  db: D1Database,
  userId: string,
): Promise<GalleryOwnerSettings> {
  const row = await db
    .prepare(
      `select "showName", "removeOnDelete", "publicId" from "galleryOwner" where "userId" = ?`,
    )
    .bind(userId)
    .first<{
      showName: number;
      removeOnDelete: number;
      publicId: string | null;
    }>();
  return row
    ? {
        showName: row.showName === 1,
        removeOnDelete: row.removeOnDelete === 1,
        publicId: row.publicId,
      }
    : { ...DEFAULT_SETTINGS, publicId: null };
}

/**
 * Changes the settings given; the rest keep their current values. Showing the
 * name for the first time gives the owner a page ID, which then never changes.
 */
export async function updateSettings(
  db: D1Database,
  userId: string,
  changes: Partial<GallerySettings>,
): Promise<GalleryOwnerSettings> {
  const current = await getSettings(db, userId);
  const settings = { ...current, ...changes };
  if (settings.showName && !settings.publicId)
    settings.publicId = newPublicId();
  await db
    .prepare(
      `insert into "galleryOwner" ("userId", "showName", "removeOnDelete", "publicId")
       values (?, ?, ?, ?)
       on conflict ("userId") do update set "showName" = excluded."showName",
         "removeOnDelete" = excluded."removeOnDelete",
         "publicId" = coalesce("galleryOwner"."publicId", excluded."publicId")`,
    )
    .bind(
      userId,
      Number(settings.showName),
      Number(settings.removeOnDelete),
      settings.publicId,
    )
    .run();
  return settings;
}

export type GalleryOwner = { name: string; publicId: string };

// Only owners who chose to show their name and have one
const SHOWN_OWNER = `"galleryOwner"."showName" = 1
  and "galleryOwner"."publicId" is not null and trim("user"."name") != ''`;

/**
 * Who published a gallery page, when they chose to show their name: null for
 * anonymous pages and owners who haven't. Read at render time, so a rename
 * updates every page.
 */
export async function ownerForPost(
  db: D1Database,
  postId: number,
): Promise<GalleryOwner | null> {
  const row = await db
    .prepare(
      `select "user"."name" as "name", "galleryOwner"."publicId" as "publicId"
       from "galleryPost"
       join "galleryOwner" on "galleryOwner"."userId" = "galleryPost"."userId"
       join "user" on "user"."id" = "galleryPost"."userId"
       where "galleryPost"."postId" = ? and ${SHOWN_OWNER}`,
    )
    .bind(postId)
    .first<GalleryOwner>();
  return row ? { name: row.name.trim(), publicId: row.publicId } : null;
}

/** An owner's page: their name and gallery pages (projects and palettes), newest first, or null. */
export async function ownerPage(
  db: D1Database,
  publicId: string,
): Promise<{
  name: string;
  postIds: number[];
  paletteIds: number[];
} | null> {
  const owner = await db
    .prepare(
      `select "user"."id" as "userId", "user"."name" as "name" from "galleryOwner"
       join "user" on "user"."id" = "galleryOwner"."userId"
       where "galleryOwner"."publicId" = ? and ${SHOWN_OWNER}`,
    )
    .bind(publicId)
    .first<{ userId: string; name: string }>();
  if (!owner) return null;
  const posts = await listPosts(db, owner.userId);
  const ids = (kind: GalleryPostKind) =>
    posts.filter((p) => (p.kind ?? 'project') === kind).map((p) => p.postId);
  return {
    name: owner.name.trim(),
    postIds: ids('project'),
    paletteIds: ids('palette'),
  };
}
