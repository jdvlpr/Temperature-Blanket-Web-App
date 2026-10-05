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

// Shares one of the signed-in user's palettes to the gallery (POST
// { paletteId, title, yarnUrl }). There's no anonymous route for palettes.

import type { RequestHandler } from './$types';

export const prerender = false;

export const POST: RequestHandler = async (event) => {
  const { requireGallery, publishPaletteFromAccount, galleryError } =
    await import('$lib/server/gallery');
  const gallery = await requireGallery(event, { publishing: true });
  if (gallery instanceof Response) return gallery;

  const body = await event.request.json().catch(() => null);
  if (!body) return galleryError(400, 'INVALID_REQUEST', 'Invalid palette');
  return publishPaletteFromAccount(gallery, body, event.url.origin);
};
