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

// Gallery pages the user starred (migration 0015): private bookmarks, one D1
// request each, never WordPress. Only the user sees them.

import type { D1Database } from '@cloudflare/workers-types';
import type { GalleryPostKind } from './store';

/** Stars per account, so the table can't grow without end */
export const STAR_LIMIT = 500;

export type GalleryStar = {
  postId: number;
  kind: GalleryPostKind;
  createdAt: number;
};

export type AddStarResult =
  'added' | 'starred-already' | 'star-limit' | 'own-page';

const LIST_STARS = `select "postId", "kind", "createdAt" from "galleryStar"
  where "userId" = ?1 and (?2 is null or "kind" = ?2)
  order by "createdAt" desc, "postId" desc`;

/** The user's stars, newest first, of one kind or both */
export async function listStars(
  db: D1Database,
  userId: string,
  kind?: GalleryPostKind,
): Promise<GalleryStar[]> {
  const { results } = await db
    .prepare(LIST_STARS)
    .bind(userId, kind ?? null)
    .all<GalleryStar>();
  return results;
}

/**
 * The user's stars, and their own gallery pages (which can't be starred, so
 * their cards show no star), for one request from the browser.
 */
export async function listStarsAndOwn(db: D1Database, userId: string) {
  const [stars, own] = await Promise.all([
    listStars(db, userId),
    db
      .prepare(`select "postId" from "galleryPost" where "userId" = ?`)
      .bind(userId)
      .all<{ postId: number }>(),
  ]);
  return { stars, own: own.results.map((row) => row.postId) };
}

/**
 * Stars a page, unless it's starred already, it's one of the user's own pages,
 * or they have STAR_LIMIT stars.
 */
export async function addStar(
  db: D1Database,
  userId: string,
  postId: number,
  kind: GalleryPostKind,
  now = Date.now(),
): Promise<AddStarResult> {
  const { meta } = await db
    .prepare(
      `insert or ignore into "galleryStar" ("userId", "postId", "kind", "createdAt")
       select ?1, ?2, ?3, ?4
       where not exists (select 1 from "galleryPost" where "postId" = ?2 and "userId" = ?1)
         and (select count(*) from "galleryStar" where "userId" = ?1) < ?5`,
    )
    .bind(userId, postId, kind, now, STAR_LIMIT)
    .run();
  if (meta.changes) return 'added';

  // Nothing added: say why (rare, so a second request is fine)
  const row = await db
    .prepare(
      `select
         exists (select 1 from "galleryStar" where "userId" = ?1 and "postId" = ?2) as "starred",
         exists (select 1 from "galleryPost" where "userId" = ?1 and "postId" = ?2) as "own"`,
    )
    .bind(userId, postId)
    .first<{ starred: number; own: number }>();
  if (row?.starred) return 'starred-already';
  if (row?.own) return 'own-page';
  return 'star-limit';
}

export async function removeStar(
  db: D1Database,
  userId: string,
  postId: number,
) {
  await removeStars(db, userId, [postId]);
}

/** Removes these stars, e.g. ones on pages that are gone from WordPress */
export async function removeStars(
  db: D1Database,
  userId: string,
  postIds: number[],
) {
  if (!postIds.length) return;
  // Under D1's 100 bound parameters per statement
  const statements = [];
  for (let i = 0; i < postIds.length; i += 90) {
    const ids = postIds.slice(i, i + 90);
    statements.push(
      db
        .prepare(
          `delete from "galleryStar" where "userId" = ? and "postId" in (${ids.map(() => '?').join(', ')})`,
        )
        .bind(userId, ...ids),
    );
  }
  await db.batch(statements);
}
