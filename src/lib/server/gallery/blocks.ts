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

// Blocking a gallery page's publisher (migration 0018, "galleryBlock"): their
// pages are left out of the blocker's gallery, globe and Popular. They aren't
// told, and the blocker is never told who they are: a block is made from a
// page and listed by it, and the server never returns account IDs.
//
// So that a block can't tie an anonymous page to a name, it has a scope: made
// from a page that doesn't show its owner's name, it hides only that person's
// pages that don't ('anonymous'); made from one that does (or their gallery),
// only those that do ('named').
//
// Signed in, blocks are kept here. A guest's are page IDs kept on their
// device, sent with each look-up and added to their account when they sign in.

import type { D1Database } from '@cloudflare/workers-types';
import type { GalleryPostKind } from './store';

/** Blocks per account, and pages a guest's list may hold */
export const BLOCK_LIMIT = 200;
/** Pages answered as hidden at most, which is far more than any person has */
const HIDDEN_LIMIT = 2000;

export type BlockScope = 'named' | 'anonymous';

/** A row of the Blocked list: the page they were blocked from */
export type GalleryBlock = {
  postId: number;
  kind: GalleryPostKind;
  title: string;
  createdAt: number;
};

type PostOwner = {
  userId: string;
  showOwner: number;
  kind: GalleryPostKind;
  title: string;
};

/** Who published a page from their account, and whether it shows their name */
async function ownerOfPost(
  db: D1Database,
  postId: number,
): Promise<PostOwner | null> {
  return db
    .prepare(
      `select "userId", "showOwner", coalesce("kind", 'project') as "kind", "title"
       from "galleryPost" where "postId" = ?`,
    )
    .bind(postId)
    .first<PostOwner>();
}

const scopeOf = (owner: PostOwner): BlockScope =>
  owner.showOwner === 1 ? 'named' : 'anonymous';

export type BlockResult =
  'blocked' | 'no-publisher' | 'own-page' | 'block-limit';

/**
 * Blocks the publisher of this page. 'no-publisher' for pages published
 * without an account, which can be reported but not blocked.
 */
export async function blockFromPost(
  db: D1Database,
  userId: string,
  postId: number,
  now = Date.now(),
): Promise<BlockResult> {
  const owner = await ownerOfPost(db, postId);
  if (!owner) return 'no-publisher';
  if (owner.userId === userId) return 'own-page';
  const { meta } = await db
    .prepare(
      `insert into "galleryBlock"
         ("userId", "blockedUserId", "scope", "viaPostId", "viaKind", "viaTitle", "createdAt")
       select ?1, ?2, ?3, ?4, ?5, ?6, ?7
       where exists (select 1 from "galleryBlock" where "userId" = ?1 and "blockedUserId" = ?2 and "scope" = ?3)
         or (select count(*) from "galleryBlock" where "userId" = ?1) < ?8
       on conflict ("userId", "blockedUserId", "scope") do nothing`,
    )
    .bind(
      userId,
      owner.userId,
      scopeOf(owner),
      postId,
      owner.kind,
      owner.title,
      now,
      BLOCK_LIMIT,
    )
    .run();
  if (meta.changes) return 'blocked';
  const row = await db
    .prepare(
      `select 1 from "galleryBlock" where "userId" = ? and "blockedUserId" = ? and "scope" = ?`,
    )
    .bind(userId, owner.userId, scopeOf(owner))
    .first();
  return row ? 'blocked' : 'block-limit';
}

/**
 * Unblocks the publisher of this page: the block made from it, or the one
 * that hides it.
 */
export async function unblockFromPost(
  db: D1Database,
  userId: string,
  postId: number,
) {
  const owner = await ownerOfPost(db, postId);
  await db
    .prepare(
      `delete from "galleryBlock" where "userId" = ?1
         and ("viaPostId" = ?2 or ("blockedUserId" = ?3 and "scope" = ?4))`,
    )
    .bind(userId, postId, owner?.userId ?? null, owner ? scopeOf(owner) : null)
    .run();
}

/** The user's blocks, newest first, by the pages they were made from */
export async function listBlocks(
  db: D1Database,
  userId: string,
): Promise<GalleryBlock[]> {
  const { results } = await db
    .prepare(
      `select "viaPostId" as "postId", "viaKind" as "kind", "viaTitle" as "title", "createdAt"
       from "galleryBlock" where "userId" = ? order by "createdAt" desc`,
    )
    .bind(userId)
    .all<GalleryBlock>();
  return results;
}

/** Adds a guest's blocks (page IDs) to their account when they sign in */
export async function mergeBlocks(
  db: D1Database,
  userId: string,
  postIds: number[],
  now = Date.now(),
): Promise<number> {
  let blocked = 0;
  for (const postId of [...new Set(postIds)].slice(0, BLOCK_LIMIT))
    if ((await blockFromPost(db, userId, postId, now)) === 'blocked') blocked++;
  return blocked;
}

// A page matches a block on its publisher and on whether it shows their name
const MATCHES = `p."userId" = b."blockedUserId"
  and b."scope" = case when p."showOwner" = 1 then 'named' else 'anonymous' end`;

/**
 * The live gallery pages this person shouldn't see: those of the people they
 * blocked, from their account (`userId`) and from a guest's list of pages
 * (`guestPostIds`, the pages they blocked from).
 */
export async function hiddenPostIds(
  db: D1Database,
  { userId, guestPostIds = [] }: { userId?: string; guestPostIds?: number[] },
): Promise<number[]> {
  const hidden = new Set<number>();
  if (userId) {
    const { results } = await db
      .prepare(
        `select p."postId" from "galleryPost" p
         join "galleryBlock" b on ${MATCHES}
         where b."userId" = ? and p."hiddenAt" is null
         limit ${HIDDEN_LIMIT}`,
      )
      .bind(userId)
      .all<{ postId: number }>();
    for (const row of results) hidden.add(row.postId);
  }
  const ids = [...new Set(guestPostIds)].slice(0, BLOCK_LIMIT);
  // Under D1's 100 bound parameters per statement
  for (let i = 0; i < ids.length; i += 90) {
    const some = ids.slice(i, i + 90);
    const { results } = await db
      .prepare(
        `with "b" as (
           select "userId" as "blockedUserId",
             case when "showOwner" = 1 then 'named' else 'anonymous' end as "scope"
           from "galleryPost" where "postId" in (${some.map(() => '?').join(', ')})
             ${userId ? `and "userId" != ?` : ''}
         )
         select distinct p."postId" from "galleryPost" p
         join "b" on ${MATCHES}
         where p."hiddenAt" is null
         limit ${HIDDEN_LIMIT}`,
      )
      .bind(...some, ...(userId ? [userId] : []))
      .all<{ postId: number }>();
    for (const row of results) hidden.add(row.postId);
  }
  return [...hidden].slice(0, HIDDEN_LIMIT);
}
