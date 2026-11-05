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

// The beta's feedback (modals/BetaFeedback.svelte → POST /api/beta/feedback,
// read on /beta/feedback): what it's about, whether this version is ready to
// replace the main site, the message, and what's sent with it. Shared by the
// dialog and the server, which checks it again (parseFeedback).

export const FEEDBACK_KINDS = [
  { value: 'broken', label: 'Something’s broken' },
  { value: 'confusing', label: 'Something’s confusing' },
  { value: 'idea', label: 'An idea' },
  { value: 'overall', label: 'How it’s going' },
] as const;

export type FeedbackKind = (typeof FEEDBACK_KINDS)[number]['value'];

/** Would they be happy if this version replaced the main site today? */
export const READY_ANSWERS = [
  { value: 'yes', label: 'Ready' },
  { value: 'mostly', label: 'Mostly' },
  { value: 'not-yet', label: 'Not yet' },
] as const;

export type ReadyAnswer = (typeof READY_ANSWERS)[number]['value'];

export const MESSAGE_MAX = 4000;
export const EMAIL_MAX = 254;
export const PAGE_MAX = 300;
/** The context's JSON, at most */
export const CONTEXT_MAX = 4000;
/** Recent errors sent with it, at most, and each one's length */
export const ERRORS_MAX = 5;
export const ERROR_TEXT_MAX = 300;

/** Sent with each message, shown in the dialog before sending */
export type FeedbackContext = {
  version: string;
  userAgent: string;
  /** Window size, CSS pixels: "390×844" */
  viewport: string;
  language: string;
  /** Whether the page's address had a query (a project link), never the query */
  hadQuery: boolean;
  /** Whether Microsoft Clarity is on, so the visit may have a recording */
  analytics: boolean;
  /** Errors in this visit, newest last (#lib/utils/recent-errors.ts) */
  errors: string[];
};

export type FeedbackInput = {
  kind: FeedbackKind;
  ready: ReadyAnswer | null;
  message: string;
  email: string | null;
  page: string;
  context: FeedbackContext;
};

const KIND_VALUES = new Set<string>(FEEDBACK_KINDS.map(({ value }) => value));
const READY_VALUES = new Set<string>(READY_ANSWERS.map(({ value }) => value));
// Loose on purpose: just enough to catch a typo, the reply is what checks it
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Whether it may be sent: a message, or just "how it's going" with an answer */
export const canSend = ({
  kind,
  ready,
  message,
}: Pick<FeedbackInput, 'kind' | 'ready' | 'message'>) =>
  message.trim().length > 0 || (kind === 'overall' && ready !== null);

export const isEmail = (text: string) =>
  text.length <= EMAIL_MAX && EMAIL_PATTERN.test(text);

const clip = (value: unknown, max: number) =>
  typeof value === 'string' ? value.slice(0, max) : '';

/** A page's path alone, never its query or hash */
export function pathOnly(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/')) return '/';
  return value.split(/[?#]/)[0].slice(0, PAGE_MAX);
}

/** The context as sent, trimmed to what's expected, whatever came */
export function cleanContext(value: unknown): FeedbackContext {
  const raw = (value && typeof value === 'object' ? value : {}) as Record<
    string,
    unknown
  >;
  const errors = Array.isArray(raw.errors) ? raw.errors : [];
  const context: FeedbackContext = {
    version: clip(raw.version, 40),
    userAgent: clip(raw.userAgent, 400),
    viewport: clip(raw.viewport, 20),
    language: clip(raw.language, 40),
    hadQuery: raw.hadQuery === true,
    analytics: raw.analytics === true,
    errors: errors
      .filter((error): error is string => typeof error === 'string')
      .slice(-ERRORS_MAX)
      .map((error) => error.slice(0, ERROR_TEXT_MAX)),
  };
  // Still too long (it can't be, with these limits, but never store more)
  while (JSON.stringify(context).length > CONTEXT_MAX && context.errors.length)
    context.errors.shift();
  return context;
}

/** The feedback from a request's body, or why it can't be taken */
export function parseFeedback(
  body: unknown,
): { ok: true; feedback: FeedbackInput } | { ok: false; message: string } {
  if (!body || typeof body !== 'object')
    return { ok: false, message: 'Invalid feedback' };
  const raw = body as Record<string, unknown>;
  if (typeof raw.kind !== 'string' || !KIND_VALUES.has(raw.kind))
    return { ok: false, message: 'Choose what it’s about' };
  const kind = raw.kind as FeedbackKind;
  const ready =
    typeof raw.ready === 'string' && READY_VALUES.has(raw.ready)
      ? (raw.ready as ReadyAnswer)
      : null;
  if (typeof raw.message !== 'string' || raw.message.length > MESSAGE_MAX)
    return {
      ok: false,
      message: `Keep it under ${MESSAGE_MAX.toLocaleString('en')} characters`,
    };
  const message = raw.message.trim();
  if (!canSend({ kind, ready, message }))
    return { ok: false, message: 'Write a message' };
  const email =
    typeof raw.email === 'string' && raw.email.trim() ? raw.email.trim() : null;
  if (email !== null && !isEmail(email))
    return { ok: false, message: 'That email address doesn’t look right' };
  return {
    ok: true,
    feedback: {
      kind,
      ready,
      message,
      email,
      page: pathOnly(raw.page),
      context: cleanContext(raw.context),
    },
  };
}

// The one-time toast (#lib/utils/beta-feedback-toast.ts)

/** Local Storage: milliseconds the beta has been in view, over every visit */
export const FEEDBACK_TIME_KEY = 'beta_feedback_time';
/** Local Storage: set once the toast has shown, or feedback was sent */
export const FEEDBACK_ASKED_KEY = 'beta_feedback_asked';
/** In view this long before the toast asks */
export const FEEDBACK_ASK_AFTER_MS = 5 * 60 * 1000;

/** Whether the toast may ask now */
export const shouldAskForFeedback = ({
  timeInView,
  asked,
  busy,
}: {
  timeInView: number;
  asked: boolean;
  /** A dialog, another toast or the beta's warning is showing */
  busy: boolean;
}) => !asked && !busy && timeInView >= FEEDBACK_ASK_AFTER_MS;

// The owner's page (/beta/feedback)

export type FeedbackStatus = 'new' | 'done';

export type FeedbackItem = {
  id: string;
  createdAt: number;
  kind: FeedbackKind;
  ready: ReadyAnswer | null;
  message: string;
  /** Given, or the signed-in sender's account's */
  email: string | null;
  signedIn: boolean;
  page: string;
  context: FeedbackContext;
  status: FeedbackStatus;
};

export type ReadinessCounts = Record<ReadyAnswer, number> & { total: number };

/** How many said each, from feedback made since `since` (ms), every one if 0 */
export function readinessCounts(
  items: { createdAt: number; ready: ReadyAnswer | null }[],
  since = 0,
): ReadinessCounts {
  const counts: ReadinessCounts = { yes: 0, mostly: 0, 'not-yet': 0, total: 0 };
  for (const { createdAt, ready } of items)
    if (ready && createdAt >= since) {
      counts[ready]++;
      counts.total++;
    }
  return counts;
}

const ISSUE_MESSAGE_MAX = 1500;

const ISSUES_URL =
  'https://github.com/jdvlpr/Temperature-Blanket-Web-App/issues/new';

/**
 * A new GitHub issue for one piece of feedback, filled in: what it's about,
 * the message, the page and what was sent with it. Never who sent it (an
 * email or account): the repository is public.
 */
export function issueUrl(item: {
  kind: FeedbackKind;
  ready: ReadyAnswer | null;
  message: string;
  page: string;
  context: FeedbackContext;
}): string {
  const kind = FEEDBACK_KINDS.find(({ value }) => value === item.kind)!;
  const ready = READY_ANSWERS.find(({ value }) => value === item.ready);
  const firstLine = item.message.split('\n')[0].trim();
  const title = `Beta feedback: ${firstLine.slice(0, 80) || kind.label}`;
  const body = [
    `**${kind.label}**${ready ? ` · Ready to replace the main site: ${ready.label}` : ''}`,
    '',
    // Kept short so the link isn't too long for GitHub
    (item.message.length > ISSUE_MESSAGE_MAX
      ? `${item.message.slice(0, ISSUE_MESSAGE_MAX)}…`
      : item.message
    )
      .split('\n')
      .map((line) => `> ${line}`)
      .join('\n'),
    '',
    `- Page: \`${item.page}\``,
    `- Version: ${item.context.version}`,
    `- Browser: ${item.context.userAgent}`,
    `- Screen: ${item.context.viewport}`,
    ...(item.context.errors.length
      ? ['', 'Errors:', '```', ...item.context.errors, '```']
      : []),
  ].join('\n');
  const params = new URLSearchParams({ title, body, labels: 'needs-triage' });
  return `${ISSUES_URL}?${params}`;
}
