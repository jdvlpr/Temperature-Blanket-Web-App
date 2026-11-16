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

// The page the iPhone app opens to sign in (see $lib/server/auth/app-session).
// Signed out, it goes to the sign-in page and comes back; signed in, it asks
// before handing the app a code.

import { error, fail, redirect, type RequestEvent } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const prerender = false;

async function loadAccount(event: RequestEvent) {
  const { browserAccount } = await import('#lib/server/auth/index.js');
  const { isAppChallenge } = await import('#lib/server/auth/app-session.js');

  const account = await browserAccount(event);
  if (account instanceof Response) error(404, 'Not found');
  const challenge = event.url.searchParams.get('challenge');
  if (!isAppChallenge(challenge))
    error(400, 'Open this page from the Temperature Blanket app.');
  return { account, challenge };
}

export const load: PageServerLoad = async (event) => {
  const { account, challenge } = await loadAccount(event);
  if (!account)
    redirect(
      303,
      `/auth/sign-in?redirect=${encodeURIComponent(`/app-sign-in?challenge=${challenge}`)}`,
    );
  // Never cached: it shows who's signed in
  event.setHeaders({ 'Cache-Control': 'no-store' });
  return { name: account.name, email: account.email };
};

export const actions: Actions = {
  default: async (event) => {
    const { account, challenge } = await loadAccount(event);
    if (!account) return fail(401, { message: 'You’re signed out.' });

    const { appSessionContext } = await import('#lib/server/auth/index.js');
    const { APP_CALLBACK, createAppCode } =
      await import('#lib/server/auth/app-session.js');
    const context = await appSessionContext();
    if (context instanceof Response) error(404, 'Not found');

    const code = await createAppCode(context, account.id, challenge);
    // The page opens it: a form can't be redirected to an app's own scheme
    // everywhere
    return { appLink: `${APP_CALLBACK}?code=${code}` };
  },
};
