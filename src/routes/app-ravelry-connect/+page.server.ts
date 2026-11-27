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

// The iPhone app's browser sheet asks before connecting Ravelry (see
// $lib/server/ravelry/app-connect). Reading the page doesn't spend the code.

import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = async (event) => {
  const { appSessionContext } = await import('#lib/server/auth/index.js');
  const { readRavelryConnectCode, appRavelryCallback } =
    await import('#lib/server/ravelry/app-connect.js');
  const context = await appSessionContext();
  if (context instanceof Response) error(404, 'Not found');
  const code = event.url.searchParams.get('code');
  const connect = await readRavelryConnectCode(
    context as unknown as Parameters<typeof readRavelryConnectCode>[0],
    code,
  );
  // The app's own scheme, so SvelteKit is told it's meant to leave the site
  if (!connect)
    redirect(303, appRavelryCallback('expired'), { external: true });
  // Never cached: it shows whose account this is
  event.setHeaders({ 'Cache-Control': 'no-store' });
  return { name: connect.name, email: connect.email, code: code! };
};
