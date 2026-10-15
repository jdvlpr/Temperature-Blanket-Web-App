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

// What the app links to an account's Ravelry account (migration 0011): its
// username, the saved projects posted there, and their photos.

import type { D1Database } from '@cloudflare/workers-types';
import type { RavelryPhoto } from './api';

export type RavelryProjectLink = {
  projectId: string;
  ravelryProjectId: number;
  ravelryUsername: string;
  permalink: string;
  picturePhotoId: number | null;
  postedAt: number;
  updatedAt: number;
  /** When its photos were last read from Ravelry, or null (migration 0013) */
  photosRefreshedAt?: number | null;
};

export type StoredRavelryPhoto = {
  photoId: number;
  sortOrder: number;
  isPicture: boolean;
  squareUrl: string | null;
  smallUrl: string | null;
  mediumUrl: string | null;
  medium2Url: string | null;
  aspectRatio: number | null;
};

/** The project's page on Ravelry. */
export const ravelryProjectUrl = (link: {
  ravelryUsername: string;
  permalink: string;
}) =>
  `https://www.ravelry.com/projects/${encodeURIComponent(link.ravelryUsername)}/${encodeURIComponent(link.permalink)}`;

export async function rememberRavelryUser(
  db: D1Database,
  userId: string,
  user: { id: number; username: string },
) {
  await db
    .prepare(
      `insert into "ravelryUser" ("userId", "ravelryUserId", "username", "updatedAt")
       values (?, ?, ?, ?)
       on conflict ("userId") do update set
         "ravelryUserId" = excluded."ravelryUserId",
         "username" = excluded."username",
         "updatedAt" = excluded."updatedAt"`,
    )
    .bind(userId, user.id, user.username, Date.now())
    .run();
}

export async function ravelryUsername(
  db: D1Database,
  userId: string,
): Promise<string | null> {
  return db
    .prepare('select "username" from "ravelryUser" where "userId" = ?')
    .bind(userId)
    .first<string>('username');
}

export async function getProjectLink(
  db: D1Database,
  userId: string,
  projectId: string,
): Promise<RavelryProjectLink | null> {
  return db
    .prepare(
      `select "projectId", "ravelryProjectId", "ravelryUsername", "permalink",
              "picturePhotoId", "postedAt", "updatedAt"
       from "ravelryProject" where "userId" = ? and "projectId" = ?`,
    )
    .bind(userId, projectId)
    .first<RavelryProjectLink>();
}

/** Every linked project of the account, for My Projects. */
export async function listProjectLinks(
  db: D1Database,
  userId: string,
): Promise<RavelryProjectLink[]> {
  const { results } = await db
    .prepare(
      `select "projectId", "ravelryProjectId", "ravelryUsername", "permalink",
              "picturePhotoId", "postedAt", "updatedAt", "photosRefreshedAt"
       from "ravelryProject" where "userId" = ? order by "postedAt" desc`,
    )
    .bind(userId)
    .all<RavelryProjectLink>();
  return results;
}

export async function saveProjectLink(
  db: D1Database,
  userId: string,
  link: Omit<RavelryProjectLink, 'postedAt' | 'updatedAt'>,
) {
  const now = Date.now();
  await db
    .prepare(
      `insert into "ravelryProject" ("userId", "projectId", "ravelryProjectId",
         "ravelryUsername", "permalink", "picturePhotoId", "postedAt", "updatedAt")
       values (?, ?, ?, ?, ?, ?, ?, ?)
       on conflict ("userId", "projectId") do update set
         "ravelryProjectId" = excluded."ravelryProjectId",
         "ravelryUsername" = excluded."ravelryUsername",
         "permalink" = excluded."permalink",
         "picturePhotoId" = excluded."picturePhotoId",
         "updatedAt" = excluded."updatedAt"`,
    )
    .bind(
      userId,
      link.projectId,
      link.ravelryProjectId,
      link.ravelryUsername,
      link.permalink,
      link.picturePhotoId,
      now,
      now,
    )
    .run();
}

/** Forgets a link and its photos here; the Ravelry project stays. */
export async function forgetProjectLink(
  db: D1Database,
  userId: string,
  projectId: string,
) {
  await db.batch([
    db
      .prepare(
        'delete from "ravelryPhoto" where "userId" = ? and "projectId" = ?',
      )
      .bind(userId, projectId),
    db
      .prepare(
        'delete from "ravelryProject" where "userId" = ? and "projectId" = ?',
      )
      .bind(userId, projectId),
  ]);
}

export async function listPhotos(
  db: D1Database,
  userId: string,
  projectId: string,
): Promise<StoredRavelryPhoto[]> {
  const { results } = await db
    .prepare(
      `select "photoId", "sortOrder", "isPicture", "squareUrl", "smallUrl",
              "mediumUrl", "medium2Url", "aspectRatio"
       from "ravelryPhoto" where "userId" = ? and "projectId" = ?
       order by "sortOrder", "addedAt"`,
    )
    .bind(userId, projectId)
    .all<Omit<StoredRavelryPhoto, 'isPicture'> & { isPicture: number }>();
  return results.map((row) => ({ ...row, isPicture: !!row.isPicture }));
}

/**
 * Replaces the kept photos of a project with Ravelry's list (in its order),
 * keeping which one is the app's picture.
 */
export async function replacePhotos(
  db: D1Database,
  userId: string,
  projectId: string,
  photos: RavelryPhoto[],
  picturePhotoId: number | null,
) {
  const now = Date.now();
  await db.batch([
    db
      .prepare(
        'update "ravelryProject" set "photosRefreshedAt" = ? where "userId" = ? and "projectId" = ?',
      )
      .bind(now, userId, projectId),
    db
      .prepare(
        'delete from "ravelryPhoto" where "userId" = ? and "projectId" = ?',
      )
      .bind(userId, projectId),
    ...photos.map((photo, index) =>
      db
        .prepare(
          `insert into "ravelryPhoto" ("userId", "projectId", "photoId", "sortOrder",
             "isPicture", "squareUrl", "smallUrl", "mediumUrl", "medium2Url",
             "aspectRatio", "addedAt")
           values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          userId,
          projectId,
          photo.id,
          photo.sort_order ?? index,
          photo.id === picturePhotoId ? 1 : 0,
          photo.square_url ?? null,
          photo.small_url ?? null,
          photo.medium_url ?? null,
          photo.medium2_url ?? null,
          photo.aspect_ratio ?? null,
          now,
        ),
    ),
  ]);
}

/** The photos of the project behind a gallery page, when its owner linked it to Ravelry. */
export async function photosForGalleryPost(
  db: D1Database,
  postId: number,
): Promise<{ url: string; photos: StoredRavelryPhoto[] } | null> {
  const link = await db
    .prepare(
      `select r."userId", r."projectId", r."ravelryUsername", r."permalink"
       from "galleryPost" g
       join "ravelryProject" r on r."userId" = g."userId" and r."projectId" = g."projectId"
       where g."postId" = ?`,
    )
    .bind(postId)
    .first<{
      userId: string;
      projectId: string;
      ravelryUsername: string;
      permalink: string;
    }>();
  if (!link) return null;
  const photos = await listPhotos(db, link.userId, link.projectId);
  return { url: ravelryProjectUrl(link), photos };
}

/** Everything linked to Ravelry, as the account forgets the link. */
export function forgetRavelryStatements(db: D1Database, userId: string) {
  return ['ravelryPhoto', 'ravelryProject', 'ravelryUser'].map((table) =>
    db.prepare(`delete from "${table}" where "userId" = ?`).bind(userId),
  );
}

/** A link as the browser gets it. */
export const linkForClient = (
  link: RavelryProjectLink,
  photos: StoredRavelryPhoto[],
) => ({
  projectId: link.projectId,
  url: ravelryProjectUrl(link),
  postedAt: link.postedAt,
  updatedAt: link.updatedAt,
  photos,
});
