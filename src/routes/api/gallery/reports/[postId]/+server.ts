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

// The site owner acts on a reported page (/gallery/reports): POST { action }:
// 'hide' (WordPress's trash, as its publisher; 409 NO_PUBLISHER for a page
// published without an account, hidden in WordPress's admin instead),
// 'dismiss' (its new reports), 'reopen' (its reports new again), 'stop'
// (Stop Publishing for This Person: hides all their pages) or 'allow' (lets
// them publish again; their pages stay hidden).

import type { RequestHandler } from './$types';

export const prerender = false;

const PRIVATE = { 'Cache-Control': 'private, no-store' };

const failure = (status: number, code: string, message: string) =>
  Response.json({ code, message }, { status, headers: PRIVATE });

export const POST: RequestHandler = async (event) => {
  const { requireFeedbackOwner } =
    await import('#lib/server/beta-feedback-owner.js');
  const owner = await requireFeedbackOwner(event);
  if (owner instanceof Response) return owner;

  const postId = Number(event.params.postId);
  if (!Number.isSafeInteger(postId) || postId <= 0)
    return failure(400, 'INVALID_REQUEST', 'Invalid gallery page');
  const action = (await event.request.json().catch(() => null))?.action;

  const reports = await import('#lib/server/gallery/reports.js');
  const { defaultGalleryApi } = await import('#lib/server/gallery/index.js');
  const noPublisher = () =>
    failure(
      409,
      'NO_PUBLISHER',
      'This page was published without an account. Hide it in WordPress’s admin',
    );

  try {
    if (action === 'hide') {
      const result = await reports.hideReportedPage(
        owner.db,
        defaultGalleryApi(),
        postId,
      );
      if (result === 'no-publisher') return noPublisher();
    } else if (action === 'stop') {
      const result = await reports.stopPublishing(
        owner.db,
        defaultGalleryApi(),
        postId,
      );
      if (result === 'no-publisher') return noPublisher();
      return Response.json(result, { headers: PRIVATE });
    } else if (action === 'allow') {
      if (!(await reports.allowPublishing(owner.db, postId)))
        return noPublisher();
    } else if (action === 'dismiss')
      await reports.setReportsStatus(owner.db, postId, 'dismissed');
    else if (action === 'reopen')
      await reports.setReportsStatus(owner.db, postId, 'new');
    else return failure(400, 'INVALID_REQUEST', 'Invalid action');
  } catch (e) {
    console.error('Could not act on reported gallery page', e);
    return failure(
      502,
      'GALLERY_UNAVAILABLE',
      'The gallery couldn’t be reached. Try again later.',
    );
  }
  return new Response(null, { status: 204, headers: PRIVATE });
};
