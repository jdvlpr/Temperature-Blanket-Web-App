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

// POST { postId, kind, reason, message?, email? }: anyone reports a gallery
// page (Report Page…, on the website and in the app). At most REPORTS_PER_IP
// an hour from one IP address (a hash, never the address); a signed-in
// reporter reports a page once (a second time answers 200 too). The site's
// owner reads them on /gallery/reports. A report never hides a page by itself.

import type { RequestHandler } from './$types';

export const prerender = false;

const PRIVATE = { 'Cache-Control': 'private, no-store' };

const failure = (status: number, code: string, message: string) =>
  Response.json({ code, message }, { status, headers: PRIVATE });

export const POST: RequestHandler = async (event) => {
  const { getPlatform } = await import('#lib/server/cloudflare.js');
  const db = getPlatform()?.env?.DB;
  if (!db)
    return failure(503, 'UNAVAILABLE', 'Reports can’t be sent right now');

  const { parseReport, REPORTS_PER_IP, saveReport } =
    await import('#lib/server/gallery/reports.js');
  const parsed = parseReport(await event.request.json().catch(() => null));
  if (!parsed.ok) return failure(400, 'INVALID_REPORT', parsed.message);

  const ip = event.request.headers.get('cf-connecting-ip');
  const { allowIpRequest } =
    await import('#lib/server/auth/code-request-limit.js');
  // No address under plain vite dev
  if (ip && !(await allowIpRequest(db, 'report', ip, REPORTS_PER_IP)))
    return failure(
      429,
      'TOO_MANY_REQUESTS',
      'That’s a lot of reports at once. Try again in an hour',
    );

  const { optionalAccount } = await import('#lib/server/auth/index.js');
  const user = await optionalAccount(event);
  const result = await saveReport(db, parsed.report, user?.id ?? null);
  return Response.json(
    { reported: true, already: result === 'reported-already' },
    { status: result === 'saved' ? 201 : 200, headers: PRIVATE },
  );
};
