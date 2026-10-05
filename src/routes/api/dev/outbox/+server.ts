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

// Dev only: the fake email outbox. GET ?to=<address> lists messages sent to that
// address (newest first); POST {to, subject, text} sends one through the configured sender.

import { getEmailSender } from '$lib/server/email';
import { readDevOutbox } from '$lib/server/email/dev-outbox';
import { requireDevRoutes, requireStorage } from '$lib/server/platform';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const prerender = false;

export const GET: RequestHandler = async ({ platform, url }) => {
  requireDevRoutes(platform);
  const { projects } = requireStorage(platform);
  const to = url.searchParams.get('to');
  if (!to) error(400, 'Missing ?to=');
  return json(await readDevOutbox(projects, to));
};

export const POST: RequestHandler = async ({ platform, request }) => {
  requireDevRoutes(platform);
  const body = (await request.json()) as {
    to?: string;
    subject?: string;
    text?: string;
  };
  if (!body.to || !body.subject || !body.text)
    error(400, 'Expected {to, subject, text}');
  await getEmailSender(platform).send({
    to: body.to,
    subject: body.subject,
    text: body.text,
  });
  return json({ sent: true });
};
