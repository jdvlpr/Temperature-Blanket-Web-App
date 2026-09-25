import type { R2Bucket } from '@cloudflare/workers-types';
import { describe, expect, it, vi } from 'vitest';
import { getEmailSender } from '.';
import { DevOutboxSender, readDevOutbox } from './dev-outbox';

// Just enough of R2 for the outbox: put, get and list by prefix
function fakeBucket() {
  const objects = new Map<string, string>();
  const bucket = {
    put: async (key: string, value: string) => {
      objects.set(key, value);
    },
    get: async (key: string) =>
      objects.has(key) ? { text: async () => objects.get(key)! } : null,
    list: async ({ prefix }: { prefix: string }) => ({
      objects: [...objects.keys()]
        .filter((key) => key.startsWith(prefix))
        .map((key) => ({ key })),
    }),
  };
  return { bucket: bucket as unknown as R2Bucket, objects };
}

describe('DevOutboxSender', () => {
  it('stores messages and reads them back newest first, per address', async () => {
    const { bucket } = fakeBucket();
    const sender = new DevOutboxSender(bucket);
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-09-25T10:00:00Z'));
      await sender.send({ to: 'A@Example.test', subject: 'First', text: '1' });
      vi.setSystemTime(new Date('2026-09-25T10:00:05Z'));
      await sender.send({ to: 'a@example.test', subject: 'Second', text: '2' });
      await sender.send({ to: 'b@example.test', subject: 'Other', text: '3' });
    } finally {
      vi.useRealTimers();
    }

    const messages = await readDevOutbox(bucket, 'a@example.test');
    expect(messages.map((m) => m.subject)).toEqual(['Second', 'First']);
    expect(messages[1].sentAt).toBe('2026-09-25T10:00:00.000Z');
    expect(await readDevOutbox(bucket, 'nobody@example.test')).toEqual([]);
  });

  it('respects the limit', async () => {
    const { bucket } = fakeBucket();
    const sender = new DevOutboxSender(bucket);
    for (let i = 0; i < 5; i++)
      await sender.send({ to: 'a@example.test', subject: `${i}`, text: '' });
    expect(await readDevOutbox(bucket, 'a@example.test', 2)).toHaveLength(2);
  });
});

describe('getEmailSender', () => {
  it('uses the dev outbox only when configured', () => {
    const { bucket } = fakeBucket();
    const sender = getEmailSender({
      env: {
        EMAIL_SENDER: 'dev-outbox',
        ENABLE_DEV_ROUTES: 'true',
        PROJECTS: bucket,
      },
    } as App.Platform);
    expect(sender).toBeInstanceOf(DevOutboxSender);
  });

  it('responds 503 with no sender configured, as in production', () => {
    const { bucket } = fakeBucket();
    for (const platform of [
      undefined,
      { env: {} },
      { env: { PROJECTS: bucket } },
      { env: { EMAIL_SENDER: 'dev-outbox' } },
      // The outbox is readable by anyone who can reach dev routes; never without them
      { env: { EMAIL_SENDER: 'dev-outbox', PROJECTS: bucket } },
    ]) {
      try {
        getEmailSender(platform as App.Platform | undefined);
        expect.unreachable();
      } catch (e) {
        expect((e as { status?: number }).status).toBe(503);
      }
    }
  });
});
