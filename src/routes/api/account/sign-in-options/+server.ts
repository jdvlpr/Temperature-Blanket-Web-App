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

// Which sign-in providers are configured, for the sign-in and account pages.

import { readAuthSettings } from '$lib/server/auth/settings';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const prerender = false;

export const GET: RequestHandler = async ({ platform }) => {
  const result = readAuthSettings(platform?.env);
  if (result.status !== 'ready')
    return json({ message: 'Not found' }, { status: 404 });
  return json({
    google: Boolean(result.settings.google),
    ravelry: Boolean(result.settings.ravelry),
  });
};
