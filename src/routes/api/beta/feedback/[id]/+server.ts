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

// PATCH { status: 'new' | 'done' }: the owner marks one piece of the beta's
// feedback done, or new again (/beta/feedback).

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const prerender = false;

const PRIVATE = { 'Cache-Control': 'private, no-store' };

export const PATCH: RequestHandler = async (event) => {
  if (!__SITE_BETA__) return json({ message: 'Not found' }, { status: 404 });
  const { requireFeedbackOwner } =
    await import('#lib/server/beta-feedback-owner.js');
  const owner = await requireFeedbackOwner(event);
  if (owner instanceof Response) return owner;

  const body = await event.request.json().catch(() => null);
  const status = body?.status;
  if (status !== 'new' && status !== 'done')
    return json(
      { code: 'INVALID_REQUEST', message: 'Invalid status' },
      { status: 400, headers: PRIVATE },
    );

  const { setFeedbackStatus } = await import('#lib/server/beta-feedback.js');
  if (!(await setFeedbackStatus(owner.db, event.params.id, status)))
    return json(
      { code: 'NOT_FOUND', message: 'No such feedback' },
      { status: 404, headers: PRIVATE },
    );
  return new Response(null, { status: 204, headers: PRIVATE });
};
