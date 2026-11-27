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

// The iPhone app starts connecting Ravelry (see $lib/server/ravelry/app-connect).

import type { RequestHandler } from './$types';

export const prerender = false;

/** A page for the app's browser sheet that connects Ravelry to this account. */
export const POST: RequestHandler = async (event) => {
  const { requireRavelry, NO_STORE } =
    await import('#lib/server/ravelry/index.js');
  const { withBearerSession } = await import('#lib/server/auth/app-session.js');
  const { appSessionContext } = await import('#lib/server/auth/index.js');
  const { createRavelryConnectCode, isStateCookie } =
    await import('#lib/server/ravelry/app-connect.js');
  const ctx = await requireRavelry(event);
  if (ctx instanceof Response) return ctx;
  const context = await appSessionContext();
  if (context instanceof Response) return context;

  const headers = withBearerSession(ctx.headers);
  const session = await ctx.auth.api.getSession({ headers });
  if (!session)
    return Response.json({ message: 'Not signed in' }, { status: 401 });

  // Better Auth starts the link as it does for the website's Connect: the
  // state names this account, whichever browser comes back from Ravelry
  const started = (await ctx.auth.api.linkSocialAccount({
    headers,
    body: {
      // A generic OAuth provider, which 1.7.7 registers as a social one
      provider: 'ravelry' as never,
      callbackURL: '/app-ravelry-connect/done',
      errorCallbackURL: '/app-ravelry-connect/done',
      disableRedirect: true,
    },
    returnHeaders: true,
  })) as { headers: Headers; response: { url?: string } };
  const url = started.response?.url;
  const cookies = started.headers.getSetCookie().filter(isStateCookie);
  if (!url || !cookies.length)
    return Response.json(
      { message: 'Ravelry couldn’t be connected' },
      { status: 500 },
    );

  const code = await createRavelryConnectCode(
    context as unknown as Parameters<typeof createRavelryConnectCode>[0],
    { name: session.user.name, email: session.user.email, url, cookies },
  );
  return Response.json(
    { url: `${event.url.origin}/app-ravelry-connect?code=${code}` },
    { headers: NO_STORE },
  );
};
