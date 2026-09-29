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

export type GalleryPost = {
  postId: number;
  projectId: string;
  title: string;
  publishedAt: number;
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
      `insert or ignore into "galleryPost" ("postId", "userId", "projectId", "title", "publishedAt")
       values (?, ?, ?, ?, ?)`,
    )
    .bind(post.postId, userId, post.projectId, post.title, post.publishedAt)
    .run();
}

/** The user's gallery pages, newest first. */
export async function listPosts(
  db: D1Database,
  userId: string,
): Promise<GalleryPost[]> {
  const { results } = await db
    .prepare(
      `select "postId", "projectId", "title", "publishedAt" from "galleryPost"
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

export async function getSettings(
  db: D1Database,
  userId: string,
): Promise<GallerySettings> {
  const row = await db
    .prepare(
      `select "showName", "removeOnDelete" from "galleryOwner" where "userId" = ?`,
    )
    .bind(userId)
    .first<{ showName: number; removeOnDelete: number }>();
  return row
    ? { showName: row.showName === 1, removeOnDelete: row.removeOnDelete === 1 }
    : { ...DEFAULT_SETTINGS };
}

/** Changes the settings given; the rest keep their current values. */
export async function updateSettings(
  db: D1Database,
  userId: string,
  changes: Partial<GallerySettings>,
): Promise<GallerySettings> {
  const settings = { ...(await getSettings(db, userId)), ...changes };
  await db
    .prepare(
      `insert into "galleryOwner" ("userId", "showName", "removeOnDelete") values (?, ?, ?)
       on conflict ("userId") do update set "showName" = excluded."showName",
         "removeOnDelete" = excluded."removeOnDelete"`,
    )
    .bind(userId, Number(settings.showName), Number(settings.removeOnDelete))
    .run();
  return settings;
}

/**
 * The display name to show on a gallery page, or null: only for pages published
 * from an account whose owner opted in and has a name. Read at render time, so a
 * rename updates every page.
 */
export async function ownerNameForPost(
  db: D1Database,
  postId: number,
): Promise<string | null> {
  const row = await db
    .prepare(
      `select "user"."name" as "name" from "galleryPost"
       join "galleryOwner" on "galleryOwner"."userId" = "galleryPost"."userId"
       join "user" on "user"."id" = "galleryPost"."userId"
       where "galleryPost"."postId" = ? and "galleryOwner"."showName" = 1`,
    )
    .bind(postId)
    .first<{ name: string }>();
  return row?.name.trim() || null;
}
