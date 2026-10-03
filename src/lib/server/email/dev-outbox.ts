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

import type { R2Bucket } from '@cloudflare/workers-types';
import type { EmailMessage, EmailSender } from './types';

// A fake email sender for local development and tests: messages are stored in the
// local R2 bucket instead of being sent, and read back through /api/dev/outbox.
const OUTBOX_PREFIX = '_dev/outbox/';

export type StoredEmail = EmailMessage & { sentAt: string };

function outboxPrefix(to: string): string {
  return `${OUTBOX_PREFIX}${encodeURIComponent(to.trim().toLowerCase())}/`;
}

export class DevOutboxSender implements EmailSender {
  constructor(private bucket: R2Bucket) {}

  async send(message: EmailMessage): Promise<void> {
    const sentAt = new Date();
    // Zero-padded time first, so keys list in the order they were sent
    const key = `${outboxPrefix(message.to)}${String(sentAt.getTime()).padStart(15, '0')}-${crypto.randomUUID()}.json`;
    const stored: StoredEmail = { ...message, sentAt: sentAt.toISOString() };
    await this.bucket.put(key, JSON.stringify(stored), {
      httpMetadata: { contentType: 'application/json' },
    });
  }
}

/** Messages sent to an address, newest first. */
export async function readDevOutbox(
  bucket: R2Bucket,
  to: string,
  limit = 20,
): Promise<StoredEmail[]> {
  const listed = await bucket.list({ prefix: outboxPrefix(to) });
  const keys = listed.objects
    .map((object) => object.key)
    .sort()
    .reverse()
    .slice(0, limit);

  const messages: StoredEmail[] = [];
  for (const key of keys) {
    const object = await bucket.get(key);
    if (object) messages.push(JSON.parse(await object.text()) as StoredEmail);
  }
  return messages;
}
