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

// The signed-in user's gallery pages: list them with the gallery settings and
// whether publishing is on (GET),
// publish one (POST, the same payload as /api/project) or change settings (PATCH).

import type { RequestHandler } from './$types';

export const prerender = false;

const NO_STORE = { 'Cache-Control': 'no-store' };

export const GET: RequestHandler = async (event) => {
  const { requireGallery } = await import('$lib/server/gallery');
  const { listPosts, getSettings } = await import('$lib/server/gallery/store');
  const gallery = await requireGallery(event);
  if (gallery instanceof Response) return gallery;

  const [posts, settings] = await Promise.all([
    listPosts(gallery.db, gallery.userId),
    getSettings(gallery.db, gallery.userId),
  ]);
  // Whether publishing is on too, so the page only offers what will work, and
  // the display name as it is now (this browser's copy may be out of date)
  const publishing = event.platform?.env?.GALLERY_PUBLISH_ENABLED === 'true';
  return Response.json(
    { posts, settings, publishing, name: gallery.name ?? '' },
    { headers: NO_STORE },
  );
};

export const POST: RequestHandler = async (event) => {
  const { requireGallery, publishFromAccount } =
    await import('$lib/server/gallery');
  const gallery = await requireGallery(event, { publishing: true });
  if (gallery instanceof Response) return gallery;

  return publishFromAccount(gallery, await event.request.text());
};

export const PATCH: RequestHandler = async (event) => {
  const { requireGallery, galleryError } = await import('$lib/server/gallery');
  const { updateSettings } = await import('$lib/server/gallery/store');
  const gallery = await requireGallery(event);
  if (gallery instanceof Response) return gallery;

  const body = await event.request.json().catch(() => null);
  const changes: { showName?: boolean; removeOnDelete?: boolean } = {};
  for (const key of ['showName', 'removeOnDelete'] as const)
    if (typeof body?.[key] === 'boolean') changes[key] = body[key];
  if (!Object.keys(changes).length)
    return galleryError(400, 'INVALID_REQUEST', 'Nothing to change');

  const settings = await updateSettings(gallery.db, gallery.userId, changes);
  return Response.json({ settings }, { headers: NO_STORE });
};
