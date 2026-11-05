// Copyright (c) 2026, Thomas (https://github.com/jdvlpr)
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

// The site's owner, for reading the beta's feedback: signed in with an
// account whose verified email is in BETA_FEEDBACK_OWNERS.

import { json, type RequestEvent } from '@sveltejs/kit';
import type { D1Database } from '@cloudflare/workers-types';
import { optionalAccount } from '#lib/server/auth/index.js';
import { isFeedbackOwner } from '#lib/server/beta-feedback.js';
import { getPlatform } from '#lib/server/cloudflare.js';

const PRIVATE = { 'Cache-Control': 'private, no-store' };

/** The database, for the owner; else a 401 (signed out) or 403 Response */
export async function requireFeedbackOwner(
  event: RequestEvent,
): Promise<{ db: D1Database } | Response> {
  const env = getPlatform()?.env;
  const user = await optionalAccount(event);
  if (!user)
    return json(
      { code: 'NOT_SIGNED_IN', message: 'Not signed in' },
      { status: 401, headers: PRIVATE },
    );
  if (!env?.DB || !isFeedbackOwner(user, env.BETA_FEEDBACK_OWNERS))
    return json(
      { code: 'NOT_OWNER', message: 'Only the site’s owner can read feedback' },
      { status: 403, headers: PRIVATE },
    );
  return { db: env.DB };
}
