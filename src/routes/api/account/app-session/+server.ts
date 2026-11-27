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

// The iPhone app's session (see $lib/server/auth/app-session).
//
//   POST   { code, verifier } → { token, expiresAt, user }   signs the app in
//   GET    (Bearer)           → { user }                      who it's signed in as
//   PATCH  (Bearer) { name }  → { user }                      changes the display name
//   DELETE (Bearer)           → 204                           signs the app out
//   DELETE (Bearer) ?everywhere=1 → 204                       signs out every device and browser

import type { RequestHandler } from './$types';

export const prerender = false;

const NO_STORE = { 'Cache-Control': 'no-store' };

export const POST: RequestHandler = async (event) => {
  const { appSessionContext } = await import('#lib/server/auth/index.js');
  const { exchangeAppCode } = await import('#lib/server/auth/app-session.js');

  const context = await appSessionContext();
  if (context instanceof Response) return context;

  const body = await event.request.json().catch(() => null);
  const session = await exchangeAppCode(context, body?.code, body?.verifier);
  if (!session)
    return Response.json(
      {
        code: 'INVALID_CODE',
        message: 'This sign-in has expired. Try signing in again.',
      },
      { status: 400, headers: NO_STORE },
    );
  return Response.json(session, { headers: NO_STORE });
};

export const GET: RequestHandler = async (event) => {
  const { requireAccount } = await import('#lib/server/auth/index.js');
  const account = await requireAccount(event);
  if (account instanceof Response) return account;
  const { id, name, email, createdAt } = account.user;
  return Response.json(
    { user: { id, name, email, createdAt: createdAt.toISOString() } },
    { headers: NO_STORE },
  );
};

export const PATCH: RequestHandler = async (event) => {
  const { requireAccount } = await import('#lib/server/auth/index.js');
  const { bearerToken, withBearerSession } =
    await import('#lib/server/auth/app-session.js');
  const { MAX_DISPLAY_NAME_LENGTH } =
    await import('#lib/server/auth/options.js');
  const { cleanName } = await import('#lib/utils/string-utils.js');

  // The app's own session only: browsers use /api/auth/update-user
  if (!bearerToken(event.request.headers))
    return Response.json(
      { message: 'Not signed in' },
      { status: 401, headers: NO_STORE },
    );
  const account = await requireAccount(event);
  if (account instanceof Response) return account;

  const body = await event.request.json().catch(() => null);
  if (typeof body?.name !== 'string')
    return Response.json(
      { message: 'A name is needed' },
      { status: 400, headers: NO_STORE },
    );
  if (cleanName(body.name, Infinity).length > MAX_DISPLAY_NAME_LENGTH)
    return Response.json(
      { code: 'NAME_TOO_LONG', message: 'Use 80 characters or fewer.' },
      { status: 400, headers: NO_STORE },
    );

  // Through Better Auth, so its update hook cleans the name as on the website
  await account.auth.api.updateUser({
    headers: withBearerSession(event.request.headers),
    body: { name: body.name },
  });
  const after = await requireAccount(event);
  if (after instanceof Response) return after;
  const { id, name, email, createdAt } = after.user;
  return Response.json(
    { user: { id, name, email, createdAt: createdAt.toISOString() } },
    { headers: NO_STORE },
  );
};

export const DELETE: RequestHandler = async (event) => {
  const { appSessionContext, requireAccount } =
    await import('#lib/server/auth/index.js');
  const { bearerToken, endAppSession, withBearerSession } =
    await import('#lib/server/auth/app-session.js');

  // Only the app's own session, and only a real one
  const bearer = bearerToken(event.request.headers);
  if (!bearer)
    return Response.json(
      { message: 'Not signed in' },
      { status: 401, headers: NO_STORE },
    );
  const account = await requireAccount(event);
  if (account instanceof Response) return account;

  // Every session of the account, the app's own with them
  if (event.url.searchParams.get('everywhere') === '1') {
    await account.auth.api.revokeSessions({
      headers: withBearerSession(event.request.headers),
    });
    return new Response(null, { status: 204, headers: NO_STORE });
  }

  const context = await appSessionContext();
  if (context instanceof Response) return context;

  await endAppSession(context, bearer);
  return new Response(null, { status: 204, headers: NO_STORE });
};
