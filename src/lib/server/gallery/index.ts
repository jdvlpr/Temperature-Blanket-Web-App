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

// Publishing to the gallery from an account (/api/account/gallery). Publishing
// needs an account: /api/project only refuses now. A project or palette has one
// gallery page, updated in place (gallery plugin 1.9.0).
import { SECRET_WORDPRESS_PROJECT_CREATION_AUTH_KEY } from '$app/env/private';

import { PUBLIC_WORDPRESS_BASE_URL } from '$app/env/public';
import { requireAccount } from '#lib/server/auth/index.js';
import { PROJECT_ID_PATTERN } from '#lib/server/sync/store.js';
import { cleanName } from '#lib/utils/string-utils.js';
import type { D1Database } from '@cloudflare/workers-types';
import { json, type RequestEvent } from '@sveltejs/kit';
import {
  countPalettesSince,
  postKind,
  renamePost,
  updatePost,
  ensurePublicId,
  forgetPost,
  getSettings,
  listPosts,
  recordPost,
  updateSettings,
  type GalleryPost,
  type GallerySettings,
} from './store';
import { galleryApi, type GalleryApi, type PublishResponse } from './wordpress';
import { getPlatform } from '#lib/server/cloudflare.js';

const MAX_TITLE_LENGTH = 200;
/** The plugin's limit too (TEMPBLANKET_PALETTE_MAX_TITLE_LENGTH) */
export const MAX_PALETTE_TITLE_LENGTH = 80;
/** Palettes are quick to make, so sharing them has a daily limit per account */
export const PALETTES_PER_DAY = 20;
const DAY = 24 * 60 * 60 * 1000;
const MAX_PALETTE_LINK_LENGTH = 8000;
export const SAVED_PALETTE_ID = /^[A-Za-z0-9_-]{1,64}$/;

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
 * off (GALLERY_PUBLISH_ENABLED) and this is a publish or update. The browser
 * shows these; it never falls back to an anonymous submission. Listing and
 * removing pages keep working while publishing is paused.
 */
export async function requireGallery(
  event: RequestEvent,
  { publishing = false } = {},
): Promise<GalleryContext | Response> {
  const account = await requireAccount(event);
  if (account instanceof Response) return account;

  const env = getPlatform()?.env;

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
 * Records a page published from the account, with whether it's included on the
 * owner's public gallery, and remembers that choice as the next page's default.
 */
async function recordPublished(
  gallery: GalleryContext,
  post: GalleryPost & { showOwner: boolean },
) {
  await recordPost(gallery.db, gallery.userId, post);
  await updateSettings(gallery.db, gallery.userId, {
    showOwnerDefault: post.showOwner,
  });
  if (post.showOwner) await ensurePublicId(gallery.db, gallery.userId);
}

/**
 * Publishes the browser's gallery payload as this user, or with `postId`
 * updates that page of theirs in place (same link, views and settings).
 * The project has to be in the account (409 NOT_IN_ACCOUNT): its page follows
 * it into and out of the Trash, which only the account's copy tells the
 * server about. Its ID (?project=) ties the page to it. WordPress's own
 * answers (400, 409 duplicate, 500) come back unchanged with status 200, adding
 * `linked: true` when the page was recorded to the account. Updating answers 404
 * for a page that isn't theirs and 501 UPDATE_UNSUPPORTED with an older plugin.
 */
export async function publishFromAccount(
  gallery: GalleryContext,
  payloadText: string,
  { showOwner = false, postId }: { showOwner?: boolean; postId?: number } = {},
  now = Date.now(),
): Promise<Response> {
  let payload: {
    project_url?: unknown;
    title?: unknown;
    project_name?: unknown;
  };
  try {
    payload = JSON.parse(payloadText);
  } catch {
    return galleryError(400, 'INVALID_REQUEST', 'Invalid gallery payload');
  }

  // Every planner link has one
  const projectId = projectIdFromLink(payload?.project_url) ?? '';
  const { getProjectMeta } = await import('#lib/server/sync/store.js');
  const meta = projectId
    ? await getProjectMeta(gallery.db, gallery.userId, projectId)
    : null;
  if (!meta || meta.deleted)
    return galleryError(
      409,
      'NOT_IN_ACCOUNT',
      'Add this project to your account first',
    );

  // An update keeps the page's own choice of showing its owner
  let existing: GalleryPost | undefined;
  if (postId !== undefined) {
    existing = (await listPosts(gallery.db, gallery.userId)).find(
      (post) =>
        post.postId === postId && (post.kind ?? 'project') === 'project',
    );
    if (!existing)
      return galleryError(404, 'NOT_FOUND', 'No such gallery page');
    showOwner = existing.showOwner ?? false;
  }

  // Sharing palettes along with a project is no longer offered: never forward it
  // Otherwise forwarded as sent, so a large payload is parsed once and never re-encoded
  let forwarded = payloadText;
  if (payload && typeof payload === 'object' && 'share_palettes' in payload) {
    delete (payload as { share_palettes?: unknown }).share_palettes;
    forwarded = JSON.stringify(payload);
  }

  let response: PublishResponse;
  if (postId !== undefined) {
    let result;
    try {
      result = await gallery.api.updateProject(
        postId,
        forwarded,
        gallery.userId,
      );
    } catch (e) {
      console.error('Could not update gallery page', e);
      return galleryError(
        502,
        'GALLERY_UNAVAILABLE',
        'The gallery couldn’t be reached. Try again later.',
      );
    }
    if (result.status === 'unsupported')
      return galleryError(
        501,
        'UPDATE_UNSUPPORTED',
        'The gallery can’t update pages yet',
      );
    if (result.status === 'gone') {
      // Removed on WordPress (by hand, say): nothing left to update
      await forgetPost(gallery.db, gallery.userId, postId);
      return galleryError(404, 'NOT_FOUND', 'No such gallery page');
    }
    response = result.response;
  } else response = await gallery.api.publish(forwarded, gallery.userId);

  if (Number(response.code) === 200) {
    if (typeof response.id !== 'number') {
      // The plugin predates owner IDs: the page exists but can't be linked
      console.error('Gallery publish returned no post ID');
      return json({ ...response, linked: false });
    }
    // The project's name when it has one, as the gallery shows it
    const title =
      cleanName(payload.project_name, MAX_TITLE_LENGTH) ||
      cleanName(payload.title, MAX_TITLE_LENGTH) ||
      'Untitled project';
    // Its link as published, so My Projects can show the page's colors
    const link =
      typeof payload.project_url === 'string' &&
      payload.project_url.length <= MAX_PALETTE_LINK_LENGTH
        ? payload.project_url
        : null;
    if (existing)
      await updatePost(gallery.db, gallery.userId, existing.postId, {
        title,
        link,
        updatedAt: now,
      });
    else
      await recordPublished(gallery, {
        postId: response.id,
        projectId,
        title,
        publishedAt: now,
        link,
        showOwner,
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
 * { paletteId, title, yarnUrl, showOwner }. Accounts only: WordPress's palette route
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
    await recordPublished(gallery, {
      postId: response.id,
      projectId: paletteId,
      title,
      publishedAt: now,
      kind: 'palette',
      link: yarnUrl,
      showOwner: input.showOwner === true,
    });
    return json({ ...response, linked: true });
  }
  return json(response);
}

/**
 * Renames one of this user's palette pages in place, keeping its link (gallery
 * plugin 1.7.0). 501 RENAME_UNSUPPORTED when the gallery's plugin is older, so the
 * app can publish it again with the new name instead.
 */
export async function renamePaletteFromAccount(
  gallery: GalleryContext,
  postId: number,
  title: unknown,
): Promise<Response> {
  const name = cleanName(title, MAX_PALETTE_TITLE_LENGTH);
  if (!name)
    return galleryError(400, 'INVALID_REQUEST', 'A palette needs a name');
  // Ownership from the session, checked here before WordPress checks it again
  if ((await postKind(gallery.db, gallery.userId, postId)) !== 'palette')
    return galleryError(404, 'NOT_FOUND', 'No such gallery page');

  let result;
  try {
    result = await gallery.api.renamePalette(postId, name, gallery.userId);
  } catch (e) {
    console.error('Could not rename gallery page', e);
    return galleryError(
      502,
      'GALLERY_UNAVAILABLE',
      'The gallery couldn’t be reached. Try again later.',
    );
  }
  if (result.status === 'unsupported')
    return galleryError(
      501,
      'RENAME_UNSUPPORTED',
      'The gallery can’t rename pages yet',
    );
  if (result.status === 'gone')
    return galleryError(404, 'NOT_FOUND', 'No such gallery page');
  if (result.status === 'refused')
    return galleryError(
      400,
      'INVALID_REQUEST',
      result.message || 'That name can’t be used',
    );

  await renamePost(gallery.db, gallery.userId, postId, result.title);
  return json(
    { title: result.title },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

/**
 * Updates one of this user's palette pages in place from { title, yarnUrl },
 * keeping its link (gallery plugin 1.9.0). 501 UPDATE_UNSUPPORTED when the
 * plugin is older, so the app can publish it again instead.
 */
export async function updatePaletteFromAccount(
  gallery: GalleryContext,
  postId: number,
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
  // Ownership from the session, checked here before WordPress checks it again
  if ((await postKind(gallery.db, gallery.userId, postId)) !== 'palette')
    return galleryError(404, 'NOT_FOUND', 'No such gallery page');

  let result;
  try {
    result = await gallery.api.updatePalette(
      postId,
      { title, yarn_url: yarnUrl },
      gallery.userId,
    );
  } catch (e) {
    console.error('Could not update gallery page', e);
    return galleryError(
      502,
      'GALLERY_UNAVAILABLE',
      'The gallery couldn’t be reached. Try again later.',
    );
  }
  if (result.status === 'unsupported')
    return galleryError(
      501,
      'UPDATE_UNSUPPORTED',
      'The gallery can’t update pages yet',
    );
  if (result.status === 'gone') {
    await forgetPost(gallery.db, gallery.userId, postId);
    return galleryError(404, 'NOT_FOUND', 'No such gallery page');
  }
  const { response } = result;
  if (Number(response.code) === 200) {
    const saved = cleanName(response.title, MAX_PALETTE_TITLE_LENGTH) || title;
    await updatePost(gallery.db, gallery.userId, postId, {
      title: saved,
      link: yarnUrl,
      updatedAt: now,
    });
    return json({ ...response, title: saved, linked: true });
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
