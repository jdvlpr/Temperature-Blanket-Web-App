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

// Reports of gallery pages (migration 0018, "galleryReport"), from anyone, and
// the site owner's moderation on /gallery/reports: Hide Page (WordPress's
// trash, as its publisher), Dismiss, and Stop Publishing for This Person
// ("galleryOwner"."bannedAt"). A report never hides a page by itself.

import type { D1Database } from '@cloudflare/workers-types';
import type { GalleryPostKind } from './store';
import type { GalleryApi } from './wordpress';

/** Reports from one IP address an hour, at most */
export const REPORTS_PER_IP = 10;
export const REPORT_MESSAGE_MAX = 1000;
export const REPORT_EMAIL_MAX = 254;

export const REPORT_REASONS = ['words', 'photo', 'spam', 'other'] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];
export type ReportStatus = 'new' | 'hidden' | 'dismissed';

export type ReportInput = {
  postId: number;
  kind: GalleryPostKind;
  reason: ReportReason;
  message: string;
  email: string | null;
};

const isEmail = (text: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);

/** A report from the request's body, or why it isn't one */
export function parseReport(
  body: unknown,
): { ok: true; report: ReportInput } | { ok: false; message: string } {
  const input = (body ?? {}) as Record<string, unknown>;
  const postId = input.postId;
  if (
    typeof postId !== 'number' ||
    !Number.isSafeInteger(postId) ||
    postId <= 0
  )
    return { ok: false, message: 'Invalid gallery page' };
  if (input.kind !== 'project' && input.kind !== 'palette')
    return { ok: false, message: 'Invalid gallery page' };
  if (!REPORT_REASONS.includes(input.reason as ReportReason))
    return { ok: false, message: 'Choose a reason' };
  const message = typeof input.message === 'string' ? input.message.trim() : '';
  if (message.length > REPORT_MESSAGE_MAX)
    return { ok: false, message: 'That message is too long' };
  const email = typeof input.email === 'string' ? input.email.trim() : '';
  if (email && (email.length > REPORT_EMAIL_MAX || !isEmail(email)))
    return { ok: false, message: 'That email address doesn’t look right' };
  return {
    ok: true,
    report: {
      postId,
      kind: input.kind,
      reason: input.reason as ReportReason,
      message,
      email: email || null,
    },
  };
}

/**
 * Saves a report. A signed-in reporter reports a page once
 * ('reported-already' after that); a guest's email is kept for a reply, a
 * signed-in one's comes from the account.
 */
export async function saveReport(
  db: D1Database,
  report: ReportInput,
  userId: string | null,
  now = Date.now(),
): Promise<'saved' | 'reported-already'> {
  const { meta } = await db
    .prepare(
      `insert or ignore into "galleryReport"
        ("id", "createdAt", "postId", "kind", "reason", "message", "email", "userId", "publisherId")
       values (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8,
         (select "userId" from "galleryPost" where "postId" = ?3))`,
    )
    .bind(
      crypto.randomUUID(),
      now,
      report.postId,
      report.kind,
      report.reason,
      report.message,
      userId ? null : report.email,
      userId,
    )
    .run();
  return meta.changes ? 'saved' : 'reported-already';
}

export type ReportItem = {
  id: string;
  createdAt: number;
  reason: ReportReason;
  message: string;
  /** For a reply: a guest's, or the reporting account's */
  email: string | null;
  signedIn: boolean;
  status: ReportStatus;
};

/** A reported page and its reports, newest first */
export type ReportedPage = {
  postId: number;
  kind: GalleryPostKind;
  /** Its name as the app recorded it, when published from an account */
  title: string | null;
  /** Published from an account, so it can be hidden from here and its publisher stopped */
  hasPublisher: boolean;
  publishingStopped: boolean;
  /** Already hidden (by the site's owner, or with its item in the Trash) */
  hidden: boolean;
  newCount: number;
  lastAt: number;
  reports: ReportItem[];
};

type ReportRow = {
  id: string;
  createdAt: number;
  postId: number;
  kind: GalleryPostKind;
  reason: ReportReason;
  message: string;
  email: string | null;
  userId: string | null;
  accountEmail: string | null;
  status: ReportStatus;
  publisherId: string | null;
  title: string | null;
  hiddenAt: number | null;
  postUserId: string | null;
  bannedAt: number | null;
};

/**
 * Reported pages, those with new reports first, then by their newest report:
 * every one, or (`status`) those with a report in that state. At most `limit`
 * reports are read.
 */
export async function listReportedPages(
  db: D1Database,
  status?: ReportStatus,
  limit = 1000,
): Promise<ReportedPage[]> {
  const { results } = await db
    .prepare(
      `select r.*, u."email" as "accountEmail", p."title", p."hiddenAt",
         p."userId" as "postUserId", o."bannedAt"
       from "galleryReport" r
       left join "user" u on u."id" = r."userId"
       left join "galleryPost" p on p."postId" = r."postId"
       left join "galleryOwner" o on o."userId" = coalesce(p."userId", r."publisherId")
       ${status ? `where r."postId" in (select "postId" from "galleryReport" where "status" = ?1)` : ''}
       order by r."createdAt" desc
       limit ${status ? '?2' : '?1'}`,
    )
    .bind(...(status ? [status, limit] : [limit]))
    .all<ReportRow>();

  const pages = new Map<number, ReportedPage>();
  for (const row of results) {
    let page = pages.get(row.postId);
    if (!page) {
      page = {
        postId: row.postId,
        kind: row.kind,
        title: row.title,
        hasPublisher: !!(row.postUserId ?? row.publisherId),
        publishingStopped: row.bannedAt !== null,
        hidden: row.hiddenAt !== null,
        newCount: 0,
        lastAt: row.createdAt,
        reports: [],
      };
      pages.set(row.postId, page);
    }
    if (row.status === 'new') page.newCount++;
    page.reports.push({
      id: row.id,
      createdAt: row.createdAt,
      reason: row.reason,
      message: row.message,
      email: row.email ?? row.accountEmail,
      signedIn: row.userId !== null,
      status: row.status,
    });
  }
  return [...pages.values()].sort(
    (a, b) =>
      Number(b.newCount > 0) - Number(a.newCount > 0) || b.lastAt - a.lastAt,
  );
}

/** How many pages have new reports, for the owner's badge */
export async function countNewReportedPages(db: D1Database): Promise<number> {
  const row = await db
    .prepare(
      `select count(distinct "postId") as "count" from "galleryReport" where "status" = 'new'`,
    )
    .first<{ count: number }>();
  return row?.count ?? 0;
}

/** Marks a page's reports: its new ones dismissed, or all of them hidden or new again */
export async function setReportsStatus(
  db: D1Database,
  postId: number,
  status: ReportStatus,
) {
  await db
    .prepare(
      `update "galleryReport" set "status" = ?1 where "postId" = ?2
       ${status === 'dismissed' ? `and "status" = 'new'` : ''}`,
    )
    .bind(status, postId)
    .run();
}

/** Who published a page from their account: its record, or the one its reports kept */
async function publisherOf(
  db: D1Database,
  postId: number,
): Promise<string | null> {
  const row = await db
    .prepare(
      `select coalesce(
         (select "userId" from "galleryPost" where "postId" = ?1),
         (select "publisherId" from "galleryReport" where "postId" = ?1 and "publisherId" is not null limit 1)
       ) as "userId"`,
    )
    .bind(postId)
    .first<{ userId: string | null }>();
  return row?.userId ?? null;
}

/** Hides a page in the app's records: left out everywhere, never restored with its item */
async function markModerated(db: D1Database, postId: number, now: number) {
  await db
    .prepare(
      `update "galleryPost" set "hiddenAt" = coalesce("hiddenAt", ?1), "moderatedAt" = ?1
       where "postId" = ?2`,
    )
    .bind(now, postId)
    .run();
}

/**
 * Hide Page: moves it to WordPress's trash as its publisher, and keeps it
 * hidden. 'no-publisher' for a page published without an account (before
 * publishing needed one): WordPress only trashes pages for their owner, so
 * that one is hidden in WordPress's admin instead.
 */
export async function hideReportedPage(
  db: D1Database,
  api: GalleryApi,
  postId: number,
  now = Date.now(),
): Promise<'hidden' | 'no-publisher'> {
  const publisher = await publisherOf(db, postId);
  if (!publisher) return 'no-publisher';
  // 'gone' too: already removed on WordPress
  await api.trash(postId, publisher);
  await markModerated(db, postId, now);
  await setReportsStatus(db, postId, 'hidden');
  return 'hidden';
}

/**
 * Stop Publishing for This Person: the page's publisher can't publish or
 * update pages any more, and every page of theirs is hidden. Returns how many
 * pages were hidden, or 'no-publisher'.
 */
export async function stopPublishing(
  db: D1Database,
  api: GalleryApi,
  postId: number,
  now = Date.now(),
): Promise<{ hidden: number } | 'no-publisher'> {
  const publisher = await publisherOf(db, postId);
  if (!publisher) return 'no-publisher';
  await db
    .prepare(
      `insert into "galleryOwner" ("userId", "bannedAt") values (?1, ?2)
       on conflict ("userId") do update set "bannedAt" = coalesce("galleryOwner"."bannedAt", ?2)`,
    )
    .bind(publisher, now)
    .run();

  const { results } = await db
    .prepare(
      `select "postId" from "galleryPost" where "userId" = ? and "moderatedAt" is null`,
    )
    .bind(publisher)
    .all<{ postId: number }>();
  const ids = new Set(results.map((row) => row.postId));
  // The reported page even when the app no longer has its record
  ids.add(postId);
  let hidden = 0;
  for (const id of ids) {
    try {
      await api.trash(id, publisher);
      await markModerated(db, id, now);
      hidden++;
    } catch (e) {
      // The rest still go; Stop Publishing can be pressed again
      console.error('Could not hide gallery page', id, e);
    }
  }
  await db
    .prepare(
      `update "galleryReport" set "status" = 'hidden'
       where "status" = 'new' and ("publisherId" = ?1 or "postId" in
         (select "postId" from "galleryPost" where "userId" = ?1))`,
    )
    .bind(publisher)
    .run();
  await setReportsStatus(db, postId, 'hidden');
  return { hidden };
}

/** Lets the page's publisher publish again (their hidden pages stay hidden) */
export async function allowPublishing(
  db: D1Database,
  postId: number,
): Promise<boolean> {
  const publisher = await publisherOf(db, postId);
  if (!publisher) return false;
  await db
    .prepare(`update "galleryOwner" set "bannedAt" = null where "userId" = ?`)
    .bind(publisher)
    .run();
  return true;
}
