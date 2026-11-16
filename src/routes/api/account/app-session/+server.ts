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
//   DELETE (Bearer)           → 204                           signs the app out

import { json } from '@sveltejs/kit';
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
    return json(
      {
        code: 'INVALID_CODE',
        message: 'This sign-in has expired. Try signing in again.',
      },
      { status: 400, headers: NO_STORE },
    );
  return json(session, { headers: NO_STORE });
};

export const GET: RequestHandler = async (event) => {
  const { requireAccount } = await import('#lib/server/auth/index.js');
  const account = await requireAccount(event);
  if (account instanceof Response) return account;
  const { id, name, email } = account.user;
  return json({ user: { id, name, email } }, { headers: NO_STORE });
};

export const DELETE: RequestHandler = async (event) => {
  const { appSessionContext, requireAccount } =
    await import('#lib/server/auth/index.js');
  const { bearerToken, endAppSession } =
    await import('#lib/server/auth/app-session.js');

  // Only the app's own session, and only a real one
  const bearer = bearerToken(event.request.headers);
  if (!bearer)
    return json(
      { message: 'Not signed in' },
      { status: 401, headers: NO_STORE },
    );
  const account = await requireAccount(event);
  if (account instanceof Response) return account;
  const context = await appSessionContext();
  if (context instanceof Response) return context;

  await endAppSession(context, bearer);
  return new Response(null, { status: 204, headers: NO_STORE });
};
