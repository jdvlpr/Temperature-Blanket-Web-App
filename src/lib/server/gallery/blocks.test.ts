import { createTestD1 } from '#lib/server/test-d1.js';
import { describe, expect, it } from 'vitest';
import {
  blockFromPost,
  hiddenPostIds,
  listBlocks,
  mergeBlocks,
  unblockFromPost,
} from './blocks';
import { recordPost, setPostHidden } from './store';

async function setup() {
  const { d1, sqlite } = createTestD1();
  const now = new Date().toISOString();
  for (const id of ['viewer', 'ada', 'bo'])
    sqlite.exec(
      `insert into "user" values ('${id}', '${id}', '${id}@example.test', 1, null, '${now}', '${now}')`,
    );
  // Ada: two pages showing her name, two anonymous; Bo: one of each
  const pages: [number, string, boolean][] = [
    [1, 'ada', true],
    [2, 'ada', true],
    [3, 'ada', false],
    [4, 'ada', false],
    [5, 'bo', true],
    [6, 'bo', false],
    [7, 'viewer', true],
  ];
  for (const [postId, userId, showOwner] of pages)
    await recordPost(d1, userId, {
      postId,
      projectId: `p${postId}`,
      title: `Page ${postId}`,
      publishedAt: postId,
      showOwner,
    });
  return { d1 };
}

describe('gallery blocks', () => {
  it('hides only the pages that match the page blocked from: named or anonymous', async () => {
    const { d1 } = await setup();
    expect(await blockFromPost(d1, 'viewer', 3, 10)).toBe('blocked');
    expect((await hiddenPostIds(d1, { userId: 'viewer' })).sort()).toEqual([
      3, 4,
    ]);

    expect(await blockFromPost(d1, 'viewer', 1, 11)).toBe('blocked');
    expect((await hiddenPostIds(d1, { userId: 'viewer' })).sort()).toEqual([
      1, 2, 3, 4,
    ]);
    expect(await listBlocks(d1, 'viewer')).toEqual([
      { postId: 1, kind: 'project', title: 'Page 1', createdAt: 11 },
      { postId: 3, kind: 'project', title: 'Page 3', createdAt: 10 },
    ]);
  });

  it('blocks a person once per scope, never oneself or a page without a publisher', async () => {
    const { d1 } = await setup();
    await blockFromPost(d1, 'viewer', 1, 10);
    expect(await blockFromPost(d1, 'viewer', 2, 11)).toBe('blocked');
    expect((await listBlocks(d1, 'viewer')).map((b) => b.postId)).toEqual([1]);
    expect(await blockFromPost(d1, 'viewer', 7)).toBe('own-page');
    expect(await blockFromPost(d1, 'viewer', 999)).toBe('no-publisher');
  });

  it('unblocks from the page blocked from or any page the block hides', async () => {
    const { d1 } = await setup();
    await blockFromPost(d1, 'viewer', 1);
    await unblockFromPost(d1, 'viewer', 2);
    expect(await hiddenPostIds(d1, { userId: 'viewer' })).toEqual([]);
    await blockFromPost(d1, 'viewer', 3);
    await unblockFromPost(d1, 'viewer', 3);
    expect(await listBlocks(d1, 'viewer')).toEqual([]);
  });

  it('works for guests from the pages they blocked from, and merges them on sign-in', async () => {
    const { d1 } = await setup();
    expect(
      (await hiddenPostIds(d1, { guestPostIds: [4, 5, 999] })).sort(),
    ).toEqual(
      [1, 2, 3, 4]
        .filter((id) => id > 2)
        .concat([5])
        .sort(),
    );
    expect(await mergeBlocks(d1, 'viewer', [4, 5, 7, 999])).toBe(2);
    expect((await hiddenPostIds(d1, { userId: 'viewer' })).sort()).toEqual([
      3, 4, 5,
    ]);
  });

  it('leaves out pages that are hidden already', async () => {
    const { d1 } = await setup();
    await blockFromPost(d1, 'viewer', 1);
    await setPostHidden(d1, 'ada', 2, 5);
    expect(await hiddenPostIds(d1, { userId: 'viewer' })).toEqual([1]);
  });
});
