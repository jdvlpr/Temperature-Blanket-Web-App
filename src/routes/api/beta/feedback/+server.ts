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

// The beta's feedback (only in the beta's build; 404 elsewhere).
// POST: anyone sends it (modals/BetaFeedback.svelte). Signed in, it's tied to
// the account; signed out it needs a Turnstile token. At most FEEDBACK_PER_IP
// an hour from one IP address.
// GET ?status=new|done: the owner's list (BETA_FEEDBACK_OWNERS), for /beta/feedback.

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const prerender = false;

const PRIVATE = { 'Cache-Control': 'private, no-store' };

const failure = (status: number, code: string, message: string) =>
  json({ code, message }, { status, headers: PRIVATE });

export const POST: RequestHandler = async (event) => {
  if (!__SITE_BETA__) return failure(404, 'NOT_FOUND', 'Not found');
  const { getPlatform } = await import('#lib/server/cloudflare.js');
  const env = getPlatform()?.env;
  const db = env?.DB;
  if (!db)
    return failure(503, 'UNAVAILABLE', 'Feedback can’t be saved right now');

  const { parseFeedback } = await import('#lib/utils/beta-feedback.js');
  const parsed = parseFeedback(await event.request.json().catch(() => null));
  if (!parsed.ok) return failure(400, 'INVALID_FEEDBACK', parsed.message);

  const { optionalAccount } = await import('#lib/server/auth/index.js');
  const user = await optionalAccount(event);
  const ip = event.request.headers.get('cf-connecting-ip');

  // Guests prove they're not a robot first, so bots can't fill the counter
  if (!user) {
    const { verifyTurnstile, TURNSTILE_HEADER } =
      await import('#lib/server/turnstile.js');
    const turnstile = await verifyTurnstile({
      token: event.request.headers.get(TURNSTILE_HEADER),
      secret: env.TURNSTILE_SECRET_KEY,
      remoteIp: ip,
    });
    if (turnstile === 'rejected')
      return failure(
        403,
        'TURNSTILE_REJECTED',
        'We couldn’t check that you’re not a robot',
      );
    if (turnstile === 'unavailable')
      return failure(
        503,
        'TURNSTILE_UNAVAILABLE',
        'The check that you’re not a robot isn’t working',
      );
  }

  const { allowIpRequest } =
    await import('#lib/server/auth/code-request-limit.js');
  const { FEEDBACK_PER_IP, saveFeedback } =
    await import('#lib/server/beta-feedback.js');
  // No address under plain vite dev
  if (ip && !(await allowIpRequest(db, 'feedback', ip, FEEDBACK_PER_IP)))
    return failure(
      429,
      'TOO_MANY_REQUESTS',
      'That’s a lot of feedback at once. Try again in an hour',
    );

  const id = await saveFeedback(db, parsed.feedback, user?.id ?? null);
  return json({ id }, { status: 201, headers: PRIVATE });
};

export const GET: RequestHandler = async (event) => {
  if (!__SITE_BETA__) return failure(404, 'NOT_FOUND', 'Not found');
  const { requireFeedbackOwner } =
    await import('#lib/server/beta-feedback-owner.js');
  const owner = await requireFeedbackOwner(event);
  if (owner instanceof Response) return owner;

  const { listFeedback } = await import('#lib/server/beta-feedback.js');
  const status = event.url.searchParams.get('status');
  const feedback = await listFeedback(
    owner.db,
    status === 'new' || status === 'done' ? status : undefined,
  );
  return json({ feedback }, { headers: PRIVATE });
};
