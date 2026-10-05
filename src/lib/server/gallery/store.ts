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
  /**
   * Included on the owner's public gallery: the page says "By" and the owner's
   * display name, and their owner page lists it (migration 0009)
   */
  showOwner?: boolean;
};

export type GallerySettings = {
  /** Whether the next page starts out included on the owner's public gallery: their last choice */
  showOwnerDefault: boolean;
  /** When the account is deleted, remove its gallery pages instead of keeping them */
  removeOnDelete: boolean;
};

const DEFAULT_SETTINGS: GallerySettings = {
  showOwnerDefault: false,
  removeOnDelete: false,
};

export async function recordPost(
  db: D1Database,
  userId: string,
  post: GalleryPost,
) {
  await db
    .prepare(
      `insert or ignore into "galleryPost" ("postId", "userId", "projectId", "title", "publishedAt", "kind", "link", "showOwner")
       values (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      post.postId,
      userId,
      post.projectId,
      post.title,
      post.publishedAt,
      post.kind ?? 'project',
      post.link ?? null,
      Number(post.showOwner ?? false),
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
      `select "postId", "projectId", "title", "publishedAt", "kind", "link", "showOwner" from "galleryPost"
       where "userId" = ? order by "publishedAt" desc`,
    )
    .bind(userId)
    .all<Omit<GalleryPost, 'showOwner'> & { showOwner: number }>();
  return results.map((post) => ({ ...post, showOwner: post.showOwner === 1 }));
}

/**
 * Includes one of the user's pages on their public gallery, or takes it off.
 * False when the user has no such page.
 */
export async function setPostShowOwner(
  db: D1Database,
  userId: string,
  postId: number,
  showOwner: boolean,
): Promise<boolean> {
  const { meta } = await db
    .prepare(
      `update "galleryPost" set "showOwner" = ? where "postId" = ? and "userId" = ?`,
    )
    .bind(Number(showOwner), postId, userId)
    .run();
  if (!meta.changes) return false;
  if (showOwner) await ensurePublicId(db, userId);
  return true;
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

/** The settings, and the owner page's ID once a page has shown their name. */
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
      `select "showOwnerDefault", "removeOnDelete", "publicId" from "galleryOwner" where "userId" = ?`,
    )
    .bind(userId)
    .first<{
      showOwnerDefault: number;
      removeOnDelete: number;
      publicId: string | null;
    }>();
  return row
    ? {
        showOwnerDefault: row.showOwnerDefault === 1,
        removeOnDelete: row.removeOnDelete === 1,
        publicId: row.publicId,
      }
    : { ...DEFAULT_SETTINGS, publicId: null };
}

/**
 * Changes the settings given; the rest keep their current values. The owner
 * page ID is kept as it is: see ensurePublicId.
 */
export async function updateSettings(
  db: D1Database,
  userId: string,
  changes: Partial<GallerySettings>,
): Promise<GalleryOwnerSettings> {
  const current = await getSettings(db, userId);
  const settings = { ...current, ...changes };
  await db
    .prepare(
      `insert into "galleryOwner" ("userId", "showOwnerDefault", "removeOnDelete")
       values (?, ?, ?)
       on conflict ("userId") do update set "showOwnerDefault" = excluded."showOwnerDefault",
         "removeOnDelete" = excluded."removeOnDelete"`,
    )
    .bind(
      userId,
      Number(settings.showOwnerDefault),
      Number(settings.removeOnDelete),
    )
    .run();
  return settings;
}

/**
 * The owner page's ID, made the first time a page is included on the owner's
 * public gallery. It never changes after that, so links to it keep working.
 */
export async function ensurePublicId(
  db: D1Database,
  userId: string,
): Promise<string> {
  await db
    .prepare(
      `insert into "galleryOwner" ("userId", "publicId") values (?, ?)
       on conflict ("userId") do update set
         "publicId" = coalesce("galleryOwner"."publicId", excluded."publicId")`,
    )
    .bind(userId, newPublicId())
    .run();
  return (await getSettings(db, userId)).publicId!;
}

export type GalleryOwner = { name: string; publicId: string };

// Owners with an owner page and a name to show
const NAMED_OWNER = `"galleryOwner"."publicId" is not null and trim("user"."name") != ''`;

/**
 * Who published a gallery page, when it's included on their public gallery:
 * null for anonymous pages, pages not included and owners without a display
 * name. Read at render time, so a rename updates every page.
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
       where "galleryPost"."postId" = ? and "galleryPost"."showOwner" = 1 and ${NAMED_OWNER}`,
    )
    .bind(postId)
    .first<GalleryOwner>();
  return row ? { name: row.name.trim(), publicId: row.publicId } : null;
}

/**
 * An owner's page: their name and the gallery pages (projects and palettes)
 * included on it, newest first, or null when there are none to show.
 */
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
       where "galleryOwner"."publicId" = ? and ${NAMED_OWNER}`,
    )
    .bind(publicId)
    .first<{ userId: string; name: string }>();
  if (!owner) return null;
  const posts = (await listPosts(db, owner.userId)).filter((p) => p.showOwner);
  if (!posts.length) return null;
  const ids = (kind: GalleryPostKind) =>
    posts.filter((p) => (p.kind ?? 'project') === kind).map((p) => p.postId);
  return {
    name: owner.name.trim(),
    postIds: ids('project'),
    paletteIds: ids('palette'),
  };
}
