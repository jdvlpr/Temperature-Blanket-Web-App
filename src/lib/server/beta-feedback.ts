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

// The beta's feedback in D1 (migration 0017, "betaFeedback"): saved from
// POST /api/beta/feedback, listed and marked done by the site's owner, whose
// accounts are BETA_FEEDBACK_OWNERS (emails, comma-separated; a secret).

import type { D1Database } from '@cloudflare/workers-types';
import type {
  FeedbackContext,
  FeedbackInput,
  FeedbackItem,
  FeedbackKind,
  FeedbackStatus,
  ReadyAnswer,
} from '#lib/utils/beta-feedback.js';

export type { FeedbackItem, FeedbackStatus };

/** Sent from one IP address an hour, at most */
export const FEEDBACK_PER_IP = 10;

/** Whether this account is one of the owner's: its verified email is listed */
export function isFeedbackOwner(
  user: { email: string; emailVerified?: boolean } | null | undefined,
  owners: string | undefined,
): boolean {
  if (!user?.email || user.emailVerified === false || !owners) return false;
  const email = user.email.trim().toLowerCase();
  return owners
    .split(',')
    .map((owner) => owner.trim().toLowerCase())
    .some((owner) => owner && owner === email);
}

export async function saveFeedback(
  db: D1Database,
  feedback: FeedbackInput,
  userId: string | null,
  now = Date.now(),
): Promise<string> {
  const id = crypto.randomUUID();
  await db
    .prepare(
      `insert into "betaFeedback"
        ("id", "createdAt", "kind", "ready", "message", "email", "userId", "page", "context")
       values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      now,
      feedback.kind,
      feedback.ready,
      feedback.message,
      feedback.email,
      userId,
      feedback.page,
      JSON.stringify(feedback.context),
    )
    .run();
  return id;
}

type FeedbackRow = {
  id: string;
  createdAt: number;
  kind: FeedbackKind;
  ready: ReadyAnswer | null;
  message: string;
  email: string | null;
  userId: string | null;
  accountEmail: string | null;
  page: string;
  context: string;
  status: FeedbackStatus;
};

function parseContext(text: string): FeedbackContext {
  try {
    return JSON.parse(text);
  } catch {
    return {
      version: '',
      userAgent: '',
      viewport: '',
      language: '',
      hadQuery: false,
      analytics: false,
      errors: [],
    };
  }
}

/** The newest first: every one, or those with this status */
export async function listFeedback(
  db: D1Database,
  status?: FeedbackStatus,
  limit = 500,
): Promise<FeedbackItem[]> {
  const { results } = await db
    .prepare(
      `select f.*, u."email" as "accountEmail"
       from "betaFeedback" f left join "user" u on u."id" = f."userId"
       ${status ? 'where f."status" = ?1' : ''}
       order by f."createdAt" desc
       limit ${status ? '?2' : '?1'}`,
    )
    .bind(...(status ? [status, limit] : [limit]))
    .all<FeedbackRow>();
  return results.map((row) => ({
    id: row.id,
    createdAt: row.createdAt,
    kind: row.kind,
    ready: row.ready,
    message: row.message,
    email: row.email ?? row.accountEmail,
    signedIn: row.userId !== null,
    page: row.page,
    context: parseContext(row.context),
    status: row.status,
  }));
}

/** Marks one done or new again; false when there's no such feedback */
export async function setFeedbackStatus(
  db: D1Database,
  id: string,
  status: FeedbackStatus,
): Promise<boolean> {
  const result = await db
    .prepare('update "betaFeedback" set "status" = ? where "id" = ?')
    .bind(status, id)
    .run();
  return (result.meta.changes ?? 0) > 0;
}
