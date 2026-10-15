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

import type { RequestHandler } from './$types';

export const prerender = false;

/** Whether Ravelry can be connected, and to whom it is (checked with Ravelry). */
export const GET: RequestHandler = async (event) => {
  const {
    requireRavelry,
    ravelryAvailable,
    linkedRavelryAccount,
    ravelryAccessToken,
    RavelryReconnect,
    NO_STORE,
  } = await import('#lib/server/ravelry/index.js');
  if (!ravelryAvailable())
    return Response.json({ available: false }, { headers: NO_STORE });
  const ctx = await requireRavelry(event);
  if (ctx instanceof Response) return ctx;

  if (!(await linkedRavelryAccount(ctx.db, ctx.userId)))
    return Response.json(
      { available: true, connected: false },
      { headers: NO_STORE },
    );

  const { ravelryApi, RavelryApiError } =
    await import('#lib/server/ravelry/api.js');
  const { rememberRavelryUser } = await import('#lib/server/ravelry/store.js');
  try {
    const user = await ravelryApi(await ravelryAccessToken(ctx)).currentUser();
    // Kept for the API's paths; a renamed Ravelry account is picked up here
    await rememberRavelryUser(ctx.db, ctx.userId, user);
    return Response.json(
      {
        available: true,
        connected: true,
        username: user.username,
        photoUrl: user.photo_url ?? null,
      },
      { headers: NO_STORE },
    );
  } catch (e) {
    // Linked, but Ravelry no longer accepts it: offer to connect again
    if (
      e instanceof RavelryReconnect ||
      (e instanceof RavelryApiError && e.reconnect)
    )
      return Response.json(
        { available: true, connected: true, needsReconnect: true },
        { headers: NO_STORE },
      );
    throw e;
  }
};

/** Disconnects Ravelry. What's on Ravelry stays as it is. */
export const DELETE: RequestHandler = async (event) => {
  const { requireRavelry, disconnectRavelry, NO_STORE } =
    await import('#lib/server/ravelry/index.js');
  const ctx = await requireRavelry(event);
  if (ctx instanceof Response) return ctx;
  await disconnectRavelry(ctx.db, ctx.userId);
  return Response.json({ connected: false }, { headers: NO_STORE });
};
