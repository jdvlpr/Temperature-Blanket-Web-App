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

// Publishing to the gallery from an account (/api/account/gallery). Guests keep
// submitting anonymously through /api/project.

import { SECRET_WORDPRESS_PROJECT_CREATION_AUTH_KEY } from '$env/static/private';
import { PUBLIC_WORDPRESS_BASE_URL } from '$env/static/public';
import { requireAccount } from '$lib/server/auth';
import { PROJECT_ID_PATTERN } from '$lib/server/sync/store';
import { cleanName } from '$lib/utils/string-utils';
import type { D1Database } from '@cloudflare/workers-types';
import { json, type RequestEvent } from '@sveltejs/kit';
import {
  countPalettesSince,
  forgetPost,
  getSettings,
  listPosts,
  recordPost,
  type GallerySettings,
} from './store';
import { galleryApi, type GalleryApi } from './wordpress';

const MAX_TITLE_LENGTH = 200;
/** The plugin's limit too (TEMPBLANKET_PALETTE_MAX_TITLE_LENGTH) */
export const MAX_PALETTE_TITLE_LENGTH = 80;
/** Palettes are quick to make, so sharing them has a daily limit per account */
export const PALETTES_PER_DAY = 20;
const DAY = 24 * 60 * 60 * 1000;
const MAX_PALETTE_LINK_LENGTH = 8000;
const SAVED_PALETTE_ID = /^[A-Za-z0-9_-]{1,64}$/;

/** The WordPress gallery, reached with the shared key. */
export function defaultGalleryApi(): GalleryApi {
  return galleryApi({
    baseUrl: PUBLIC_WORDPRESS_BASE_URL,
    key: SECRET_WORDPRESS_PROJECT_CREATION_AUTH_KEY,
    // Never pass the global fetch itself: on Workers, calling it as a method of
    // another object throws "Illegal invocation"
    fetch: (input, init) => fetch(input, init),
  });
}

export const galleryError = (status: number, code: string, message: string) =>
  json({ code, message }, { status, headers: { 'Cache-Control': 'no-store' } });

export type GalleryContext = {
  db: D1Database;
  userId: string;
  /** The account's display name, as it is now */
  name?: string;
  api: GalleryApi;
};

/**
 * The signed-in user's gallery pages, or a Response: 404 with accounts off, 401
 * when signed out, 503 GALLERY_PAUSED when publishing from accounts is switched
 * off (GALLERY_PUBLISH_ENABLED) and this is a publish. For all of these the
 * browser falls back to anonymous submission. Listing and removing pages keep
 * working while publishing is paused.
 */
export async function requireGallery(
  event: RequestEvent,
  { publishing = false } = {},
): Promise<GalleryContext | Response> {
  const account = await requireAccount(event);
  if (account instanceof Response) return account;

  const env = event.platform?.env;
  if (!env?.DB || (publishing && env.GALLERY_PUBLISH_ENABLED !== 'true'))
    return galleryError(
      503,
      'GALLERY_PAUSED',
      'Publishing from accounts is paused',
    );
  return {
    db: env.DB,
    userId: account.user.id,
    name: account.user.name ?? '',
    api: defaultGalleryApi(),
  };
}

/** The saved project a gallery payload's link points at (?project=<id>), if any. */
export function projectIdFromLink(projectUrl: unknown): string | null {
  if (typeof projectUrl !== 'string') return null;
  try {
    const id = new URL(projectUrl).searchParams.get('project');
    return id && PROJECT_ID_PATTERN.test(id) ? id : null;
  } catch {
    return null;
  }
}

/**
 * Publishes the browser's gallery payload (as sent to /api/project) as this user.
 * Ownership comes from the session, so the project needn't be saved to the
 * account; its ID (?project=) is kept to tie the page to it. WordPress's own answers
 * (400, 409 duplicate, 500) come back unchanged with status 200, as /api/project
 * does, adding `linked: true` when the page was recorded to the account.
 */
export async function publishFromAccount(
  gallery: GalleryContext,
  payloadText: string,
  now = Date.now(),
): Promise<Response> {
  let payload: { project_url?: unknown; title?: unknown };
  try {
    payload = JSON.parse(payloadText);
  } catch {
    return galleryError(400, 'INVALID_REQUEST', 'Invalid gallery payload');
  }

  // Every planner link has one; '' just leaves the page unconnected to a project
  const projectId = projectIdFromLink(payload?.project_url) ?? '';

  // Forwarded as sent, so a large payload is parsed once and never re-encoded
  const response = await gallery.api.publish(payloadText, gallery.userId);

  if (Number(response.code) === 200) {
    if (typeof response.id !== 'number') {
      // The plugin predates owner IDs: the page exists but can't be linked
      console.error('Gallery publish returned no post ID');
      return json({ ...response, linked: false });
    }
    const title =
      typeof payload.title === 'string' && payload.title.trim()
        ? payload.title.trim().slice(0, MAX_TITLE_LENGTH)
        : 'Untitled project';
    await recordPost(gallery.db, gallery.userId, {
      postId: response.id,
      projectId,
      title,
      publishedAt: now,
    });
    return json({ ...response, linked: true });
  }
  return json(response);
}

/** A Yarn Palette Creator link on this site (`origin`), or null. */
export function paletteLink(value: unknown, origin: string): string | null {
  if (typeof value !== 'string' || value.length > MAX_PALETTE_LINK_LENGTH)
    return null;
  try {
    const url = new URL(value);
    return url.origin === origin && url.pathname === '/yarn' && url.search
      ? url.href
      : null;
  } catch {
    return null;
  }
}

/**
 * Shares a saved palette to the gallery as this user, from
 * { paletteId, title, yarnUrl }. Accounts only: WordPress's palette route
 * needs the owner. Its answers (400, 409 already shared, 500) come back with
 * status 200, as for projects, adding `linked: true` once recorded.
 */
export async function publishPaletteFromAccount(
  gallery: GalleryContext,
  body: unknown,
  origin: string,
  now = Date.now(),
): Promise<Response> {
  const input = (body ?? {}) as Record<string, unknown>;
  const title = cleanName(input.title, MAX_PALETTE_TITLE_LENGTH);
  const yarnUrl = paletteLink(input.yarnUrl, origin);
  if (!title || !yarnUrl)
    return galleryError(
      400,
      'INVALID_REQUEST',
      'A palette needs a name and a Yarn Palette Creator link',
    );
  const paletteId =
    typeof input.paletteId === 'string' &&
    SAVED_PALETTE_ID.test(input.paletteId)
      ? input.paletteId
      : '';

  if (
    (await countPalettesSince(gallery.db, gallery.userId, now - DAY)) >=
    PALETTES_PER_DAY
  )
    return galleryError(
      429,
      'TOO_MANY_PALETTES',
      `You can share up to ${PALETTES_PER_DAY} palettes a day`,
    );

  const response = await gallery.api.publishPalette(
    { title, yarn_url: yarnUrl },
    gallery.userId,
  );
  if (Number(response.code) === 200 && typeof response.id === 'number') {
    await recordPost(gallery.db, gallery.userId, {
      postId: response.id,
      projectId: paletteId,
      title,
      publishedAt: now,
      kind: 'palette',
      link: yarnUrl,
    });
    return json({ ...response, linked: true });
  }
  return json(response);
}

/**
 * Before an account is deleted: removes its gallery pages or keeps them without
 * an owner, as the user chose (keep by default). Best effort: WordPress being
 * down mustn't stop someone deleting their account, and an orphaned owner ID
 * points at nobody once the account is gone.
 */
export async function releaseGalleryPosts(
  db: D1Database,
  api: GalleryApi,
  userId: string,
) {
  let posts: Awaited<ReturnType<typeof listPosts>>;
  let settings: GallerySettings;
  try {
    [posts, settings] = await Promise.all([
      listPosts(db, userId),
      getSettings(db, userId),
    ]);
  } catch (e) {
    // Before migration 0004 there's nothing to release
    console.error('Could not read gallery pages for account deletion', e);
    return;
  }
  if (!posts.length) return;

  if (settings.removeOnDelete)
    for (const post of posts)
      await api
        .trash(post.postId, userId)
        .then(() => forgetPost(db, userId, post.postId))
        .catch((e) => console.error('Could not remove gallery page', e));

  // Always, so no page keeps an ID that no longer belongs to anyone
  await api
    .clearOwner(userId)
    .catch((e) => console.error('Could not clear gallery owner', e));
}
