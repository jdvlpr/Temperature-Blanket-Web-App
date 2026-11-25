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

// Sign in with Apple in the iPhone app: the ID token Apple gave the device
// (and the nonce the app made) for a session of the app's own, the same as
// /api/account/app-session hands out. 404 until APPLE_APP_BUNDLE_ID is set.
//
//   POST { idToken, nonce } → { token, expiresAt, user }
//                           → 401 INVALID_TOKEN, 403 SIGN_UPS_PAUSED

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const prerender = false;

const NO_STORE = { 'Cache-Control': 'no-store' };

export const POST: RequestHandler = async (event) => {
  const { appleAppSession } = await import('#lib/server/auth/index.js');
  const body = await event.request.json().catch(() => null);
  const result = await appleAppSession(event, body?.idToken, body?.nonce);
  if (result instanceof Response) {
    result.headers.set('Cache-Control', 'no-store');
    return result;
  }
  return json(result, { headers: NO_STORE });
};
