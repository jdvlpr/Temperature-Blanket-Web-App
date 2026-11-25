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

// The iPhone app's Delete Account (the website's account page uses Better
// Auth's /api/auth/delete-user).
//
//   DELETE (Bearer) → 204                              deleted, with every session
//                   → 403 { code: 'SESSION_NOT_FRESH' } sign in again first
//                   → 401                               not signed in

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const prerender = false;

const NO_STORE = { 'Cache-Control': 'no-store' };

export const DELETE: RequestHandler = async (event) => {
  const { deleteAppAccount } = await import('#lib/server/auth/index.js');
  const result = await deleteAppAccount(event);
  if (result instanceof Response) return result;
  if (result === 'not-fresh')
    return json(
      {
        code: 'SESSION_NOT_FRESH',
        message: 'Sign in again to delete your account.',
      },
      { status: 403, headers: NO_STORE },
    );
  return new Response(null, { status: 204, headers: NO_STORE });
};
