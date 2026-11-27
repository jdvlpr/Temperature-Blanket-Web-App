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

// Continue on /app-ravelry-connect: spends the code, sets the state cookie
// Better Auth made for the link, and goes to Ravelry. A form POST, so
// SvelteKit refuses it from any other site.

import type { RequestHandler } from './$types';

export const prerender = false;

export const POST: RequestHandler = async ({ request }) => {
  const { appSessionContext } = await import('#lib/server/auth/index.js');
  const { spendRavelryConnectCode, appRavelryCallback } =
    await import('#lib/server/ravelry/app-connect.js');
  const context = await appSessionContext();
  if (context instanceof Response) return context;
  const form = await request.formData().catch(() => null);
  const connect = await spendRavelryConnectCode(
    context as unknown as Parameters<typeof spendRavelryConnectCode>[0],
    form?.get('code'),
  );
  const headers = new Headers({ 'Cache-Control': 'no-store' });
  if (!connect) {
    headers.set('Location', appRavelryCallback('expired'));
    return new Response(null, { status: 303, headers });
  }
  for (const cookie of connect.cookies) headers.append('Set-Cookie', cookie);
  headers.set('Location', connect.url);
  return new Response(null, { status: 303, headers });
};
