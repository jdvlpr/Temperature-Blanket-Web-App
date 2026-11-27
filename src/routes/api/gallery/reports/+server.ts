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

// The site owner's reported gallery pages (BETA_FEEDBACK_OWNERS), for
// /gallery/reports: GET ?status=new|hidden|dismissed lists them with their
// reports; GET ?count=new answers just { newCount }, for the account menu's
// badge.

import type { RequestHandler } from './$types';

export const prerender = false;

const PRIVATE = { 'Cache-Control': 'private, no-store' };

export const GET: RequestHandler = async (event) => {
  const { requireFeedbackOwner } =
    await import('#lib/server/beta-feedback-owner.js');
  const owner = await requireFeedbackOwner(event);
  if (owner instanceof Response) return owner;

  const { countNewReportedPages, listReportedPages } =
    await import('#lib/server/gallery/reports.js');
  if (event.url.searchParams.get('count') === 'new')
    return Response.json(
      { newCount: await countNewReportedPages(owner.db) },
      { headers: PRIVATE },
    );
  const status = event.url.searchParams.get('status');
  const pages = await listReportedPages(
    owner.db,
    status === 'new' || status === 'hidden' || status === 'dismissed'
      ? status
      : undefined,
  );
  return Response.json({ pages }, { headers: PRIVATE });
};
