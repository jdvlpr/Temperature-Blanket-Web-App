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

// A Ravelry photo (?url=), from this site, so the photo color picker's canvas
// can read its pixels whatever Ravelry's image host sends for CORS. Only for
// an account with Ravelry connected, only Ravelry's image hosts over HTTPS,
// no redirects, images only, and not too big: never an open proxy.

import type { RequestHandler } from './$types';

export const prerender = false;

const MAX_BYTES = 10 * 1024 * 1024;
// Photos only: never SVG, which could run script from this site
const PHOTO_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);
const ALLOWED_HOST = /^([a-z0-9-]+\.)*(ravelrycdn\.com|ravelry\.com)$/;

export const GET: RequestHandler = async (event) => {
  const { requireRavelry, linkedRavelryAccount, ravelryError } =
    await import('#lib/server/ravelry/index.js');
  const ctx = await requireRavelry(event);
  if (ctx instanceof Response) return ctx;
  if (!(await linkedRavelryAccount(ctx.db, ctx.userId)))
    return ravelryError(404, 'NOT_CONNECTED', 'Ravelry isn’t connected');

  let url: URL;
  try {
    url = new URL(event.url.searchParams.get('url') ?? '');
  } catch {
    return ravelryError(400, 'INVALID_REQUEST', 'Not a photo link');
  }
  if (url.protocol !== 'https:' || !ALLOWED_HOST.test(url.hostname))
    return ravelryError(400, 'INVALID_REQUEST', 'Not a Ravelry photo');

  const response = await fetch(url, { redirect: 'manual' });
  const type = (response.headers.get('content-type') ?? '')
    .split(';')[0]
    .trim();
  const length = Number(response.headers.get('content-length') ?? 0);
  if (!response.ok || !PHOTO_TYPES.has(type) || length > MAX_BYTES)
    return ravelryError(502, 'PHOTO_UNAVAILABLE', 'That photo isn’t available');

  const body = await response.arrayBuffer();
  if (body.byteLength > MAX_BYTES)
    return ravelryError(502, 'PHOTO_UNAVAILABLE', 'That photo is too big');
  return new Response(body, {
    headers: {
      'Content-Type': type,
      // Stash photos rarely change; kept in this browser for a day
      'Cache-Control': 'private, max-age=86400',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
