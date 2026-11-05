import { createTestD1 } from '#lib/server/test-d1.js';
import type { FeedbackInput } from '#lib/utils/beta-feedback.js';
import { describe, expect, it } from 'vitest';
import { allowIpRequest } from './auth/code-request-limit';
import {
  isFeedbackOwner,
  listFeedback,
  saveFeedback,
  setFeedbackStatus,
} from './beta-feedback';

function setup() {
  const { d1, sqlite } = createTestD1();
  const now = new Date().toISOString();
  sqlite.exec(
    `insert into "user" values ('u1', '', 'ada@example.test', 1, null, '${now}', '${now}')`,
  );
  return { d1, sqlite };
}

const feedback = (overrides: Partial<FeedbackInput> = {}): FeedbackInput => ({
  kind: 'broken',
  ready: null,
  message: 'The chart is blank',
  email: null,
  page: '/weather',
  context: {
    version: '7.0.0',
    userAgent: 'Test',
    viewport: '390×844',
    language: 'en',
    hadQuery: false,
    analytics: false,
    errors: ['TypeError: x is undefined'],
  },
  ...overrides,
});

describe('beta feedback store', () => {
  it('lists newest first, with a signed-in sender’s account email', async () => {
    const { d1 } = setup();
    await saveFeedback(d1, feedback({ email: 'guest@example.test' }), null, 1);
    await saveFeedback(
      d1,
      feedback({ kind: 'overall', ready: 'mostly', message: '' }),
      'u1',
      2,
    );

    const items = await listFeedback(d1);
    expect(items.map((item) => item.createdAt)).toEqual([2, 1]);
    expect(items[0]).toMatchObject({
      kind: 'overall',
      ready: 'mostly',
      email: 'ada@example.test',
      signedIn: true,
      status: 'new',
    });
    expect(items[1]).toMatchObject({
      email: 'guest@example.test',
      signedIn: false,
      context: { errors: ['TypeError: x is undefined'] },
    });
  });

  it('marks done and new again, and filters by status', async () => {
    const { d1 } = setup();
    const first = await saveFeedback(d1, feedback(), null, 1);
    await saveFeedback(d1, feedback(), null, 2);

    expect(await setFeedbackStatus(d1, first, 'done')).toBe(true);
    expect((await listFeedback(d1, 'done')).map((i) => i.id)).toEqual([first]);
    expect(await listFeedback(d1, 'new')).toHaveLength(1);

    expect(await setFeedbackStatus(d1, first, 'new')).toBe(true);
    expect(await listFeedback(d1, 'new')).toHaveLength(2);
    expect(await setFeedbackStatus(d1, 'missing', 'done')).toBe(false);
  });

  it('keeps feedback when its sender’s account is deleted', async () => {
    const { d1, sqlite } = setup();
    sqlite.exec('pragma foreign_keys = on');
    await saveFeedback(d1, feedback(), 'u1', 1);
    sqlite.exec(`delete from "user" where "id" = 'u1'`);
    expect(await listFeedback(d1)).toMatchObject([
      { signedIn: false, email: null },
    ]);
  });

  it('limits feedback per IP, apart from sign-in codes', async () => {
    const { d1 } = setup();
    for (let i = 0; i < 3; i++)
      expect(await allowIpRequest(d1, 'feedback', '1.2.3.4', 3, 10)).toBe(true);
    expect(await allowIpRequest(d1, 'feedback', '1.2.3.4', 3, 10)).toBe(false);
    expect(await allowIpRequest(d1, 'feedback', '5.6.7.8', 3, 10)).toBe(true);
    // An hour on, it starts again
    expect(
      await allowIpRequest(d1, 'feedback', '1.2.3.4', 3, 10 + 60 * 60 * 1000),
    ).toBe(true);
  });
});

describe('isFeedbackOwner', () => {
  const owners = ' Ada@Example.test , bo@example.test ';

  it('is a listed, verified email, in any case', () => {
    expect(
      isFeedbackOwner(
        { email: 'ada@example.test', emailVerified: true },
        owners,
      ),
    ).toBe(true);
    expect(isFeedbackOwner({ email: 'BO@example.test' }, owners)).toBe(true);
  });

  it('is nobody else, and nobody without the list', () => {
    expect(isFeedbackOwner({ email: 'cy@example.test' }, owners)).toBe(false);
    expect(
      isFeedbackOwner(
        { email: 'ada@example.test', emailVerified: false },
        owners,
      ),
    ).toBe(false);
    expect(isFeedbackOwner({ email: 'ada@example.test' }, undefined)).toBe(
      false,
    );
    expect(isFeedbackOwner({ email: '' }, ',')).toBe(false);
    expect(isFeedbackOwner(null, owners)).toBe(false);
  });
});
