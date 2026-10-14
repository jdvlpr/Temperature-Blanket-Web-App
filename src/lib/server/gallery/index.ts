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
  ensurePublicId,
  forgetPost,
  getSettings,
  listPosts,
  recordPost,
  updateSettings,
  type GalleryPost,
  type GallerySettings,
} from './store';
import { galleryApi, type GalleryApi } from './wordpress';
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

/** A palette shared with a project, as the browser asks (gallery plugin 1.7.0) */
type SharePaletteRequest = {
  title?: unknown;
  yarn_url?: unknown;
  /** The matching saved palette, so My Projects shows the page on its row */
  palette_id?: unknown;
};

/** What WordPress says about the palettes shared with a project (plugin 1.7.0) */
export type SharedPalettes = {
  created: { id: number; title: string; yarn_url: string }[];
  /** reason: 'title' | 'link' | 'duplicate' (with the existing `id`) | 'error', or 'limit' (this server's daily limit) */
  skipped: { title: string; yarn_url: string; reason: string; id?: number }[];
};

/** The part of a palette link that names its colors: from /yarn? on, without v= */
function paletteLinkKey(link: unknown) {
  if (typeof link !== 'string') return '';
  const start = link.indexOf('/yarn?');
  if (start === -1) return '';
  const [path, query] = link.slice(start).split('?');
  return `${path}?${query
    .split('&')
    .filter((p) => p !== 'v' && !p.startsWith('v='))
    .join('&')}`;
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
  { showOwner = false } = {},
  now = Date.now(),
): Promise<Response> {
  let payload: {
    project_url?: unknown;
    title?: unknown;
    project_name?: unknown;
    share_palettes?: unknown;
  };
  try {
    payload = JSON.parse(payloadText);
  } catch {
    return galleryError(400, 'INVALID_REQUEST', 'Invalid gallery payload');
  }

  // Every planner link has one; '' just leaves the page unconnected to a project
  const projectId = projectIdFromLink(payload?.project_url) ?? '';

  // Palettes shared with it count towards the daily limit: past it, they're
  // left out (and said so), never the project
  const requested = Array.isArray(payload?.share_palettes)
    ? (payload.share_palettes as SharePaletteRequest[])
    : [];
  let overLimit: SharePaletteRequest[] = [];
  let forwarded = payloadText;
  if (requested.length) {
    const allowance = Math.max(
      0,
      PALETTES_PER_DAY -
        (await countPalettesSince(gallery.db, gallery.userId, now - DAY)),
    );
    if (requested.length > allowance) {
      overLimit = requested.slice(allowance);
      forwarded = JSON.stringify({
        ...payload,
        share_palettes: requested.slice(0, allowance),
      });
    }
  }

  // Otherwise forwarded as sent, so a large payload is parsed once and never re-encoded
  const response = await gallery.api.publish(forwarded, gallery.userId);

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
    await recordPublished(gallery, {
      postId: response.id,
      projectId,
      title,
      publishedAt: now,
      link,
      showOwner,
    });

    // Its palettes, each recorded as the account's own palette page (on its
    // saved palette's row when there is one), with the project's name choice.
    // Absent when the plugin is older: they weren't shared.
    const shared = (response as { shared_palettes?: SharedPalettes })
      .shared_palettes;
    if (shared && Array.isArray(shared.created)) {
      for (const palette of shared.created) {
        if (typeof palette?.id !== 'number') continue;
        const asked = requested.find(
          (r) =>
            paletteLinkKey(r.yarn_url) === paletteLinkKey(palette.yarn_url),
        );
        const paletteId =
          typeof asked?.palette_id === 'string' &&
          SAVED_PALETTE_ID.test(asked.palette_id)
            ? asked.palette_id
            : '';
        await recordPost(gallery.db, gallery.userId, {
          postId: palette.id,
          projectId: paletteId,
          title: cleanName(palette.title, MAX_PALETTE_TITLE_LENGTH),
          publishedAt: now,
          kind: 'palette',
          link: typeof palette.yarn_url === 'string' ? palette.yarn_url : null,
          showOwner,
        });
      }
      shared.skipped = [
        ...(Array.isArray(shared.skipped) ? shared.skipped : []),
        ...overLimit.map((r) => ({
          title: cleanName(r.title, MAX_PALETTE_TITLE_LENGTH),
          yarn_url: typeof r.yarn_url === 'string' ? r.yarn_url : '',
          reason: 'limit',
        })),
      ];
    }
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
