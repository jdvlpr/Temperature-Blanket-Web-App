import { createTestD1 } from '#lib/server/test-d1.js';
import { describe, expect, it } from 'vitest';
import { listPosts, ownsPost, recordPost } from './store';
import { matchGalleryToItem } from './visibility';
import type { GalleryApi } from './wordpress';

function setup() {
  const { d1, sqlite } = createTestD1();
  const now = new Date().toISOString();
  sqlite.exec(
    `insert into "user" values ('u1', 'Ada', 'u1@example.test', 1, null, '${now}', '${now}')`,
  );
  const calls: string[] = [];
  let answer: 'ok' | 'gone' = 'ok';
  const api = {
    trash: async (postId: number) => (calls.push(`trash ${postId}`), answer),
    restore: async (postId: number) => (
      calls.push(`restore ${postId}`),
      answer
    ),
  } as unknown as GalleryApi;
  return { d1, api, calls, setAnswer: (a: 'ok' | 'gone') => (answer = a) };
}

const page = { postId: 10, projectId: 'p1', title: 'P', publishedAt: 1 };

describe('gallery pages follow their item', () => {
  it('hides the page in the Trash and brings the same page back', async () => {
    const { d1, api, calls } = setup();
    await recordPost(d1, 'u1', page);

    await matchGalleryToItem(d1, api, 'u1', 'project', 'p1', 'trash');
    expect(await listPosts(d1, 'u1')).toEqual([]);
    expect(await ownsPost(d1, 'u1', 10)).toBe(false);
    // Already hidden: nothing more to do
    await matchGalleryToItem(d1, api, 'u1', 'project', 'p1', 'trash');

    await matchGalleryToItem(d1, api, 'u1', 'project', 'p1', 'live');
    expect((await listPosts(d1, 'u1')).map((p) => p.postId)).toEqual([10]);
    // Live already: nothing to do
    await matchGalleryToItem(d1, api, 'u1', 'project', 'p1', 'live');
    expect(calls).toEqual(['trash 10', 'restore 10']);
  });

  it('forgets a page WordPress emptied from its trash', async () => {
    const { d1, api, setAnswer } = setup();
    await recordPost(d1, 'u1', page);
    await matchGalleryToItem(d1, api, 'u1', 'project', 'p1', 'trash');
    setAnswer('gone');
    await matchGalleryToItem(d1, api, 'u1', 'project', 'p1', 'live');
    expect(await listPosts(d1, 'u1')).toEqual([]);
    expect(await ownsPost(d1, 'u1', 10)).toBe(false);
  });

  it('forgets the page when deleted forever, and leaves other kinds alone', async () => {
    const { d1, api, calls } = setup();
    await recordPost(d1, 'u1', page);
    await recordPost(d1, 'u1', { ...page, postId: 11, kind: 'palette' });
    await matchGalleryToItem(d1, api, 'u1', 'project', 'p1', 'trash');
    await matchGalleryToItem(d1, api, 'u1', 'project', 'p1', 'purged');
    await matchGalleryToItem(d1, api, 'u1', 'project', 'p1', 'live');
    expect((await listPosts(d1, 'u1')).map((p) => p.postId)).toEqual([11]);
    expect(calls).toEqual(['trash 10']);
  });

  it('keeps the page live when WordPress can’t be reached', async () => {
    const { d1 } = setup();
    await recordPost(d1, 'u1', page);
    const failing = {
      trash: async () => {
        throw new Error('down');
      },
    } as unknown as GalleryApi;
    await expect(
      matchGalleryToItem(d1, failing, 'u1', 'project', 'p1', 'trash'),
    ).rejects.toThrow();
    expect((await listPosts(d1, 'u1')).map((p) => p.postId)).toEqual([10]);
  });
});
