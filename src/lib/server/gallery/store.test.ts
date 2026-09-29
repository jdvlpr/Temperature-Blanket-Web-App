import { createTestD1 } from '$lib/server/test-d1';
import { describe, expect, it } from 'vitest';
import {
  forgetPost,
  getSettings,
  listPosts,
  ownerNameForPost,
  ownsPost,
  recordPost,
  updateSettings,
} from './store';

function setup() {
  const { d1, sqlite } = createTestD1();
  const now = new Date().toISOString();
  for (const [id, name] of [
    ['u1', 'Ada Lovelace'],
    ['u2', ''],
  ])
    sqlite.exec(
      `insert into "user" values ('${id}', '${name}', '${id}@example.test', 1, null, '${now}', '${now}')`,
    );
  return { d1, sqlite };
}

const post = (postId: number, publishedAt = postId) => ({
  postId,
  projectId: `p${postId}`,
  title: `Project ${postId}`,
  publishedAt,
});

describe('gallery store', () => {
  it('lists only the user’s pages, newest first', async () => {
    const { d1 } = setup();
    await recordPost(d1, 'u1', post(10, 1));
    await recordPost(d1, 'u1', post(11, 2));
    await recordPost(d1, 'u2', post(12, 3));

    expect((await listPosts(d1, 'u1')).map((p) => p.postId)).toEqual([11, 10]);
    expect(await ownsPost(d1, 'u1', 10)).toBe(true);
    expect(await ownsPost(d1, 'u2', 10)).toBe(false);
  });

  it('forgets a page only for its owner', async () => {
    const { d1 } = setup();
    await recordPost(d1, 'u1', post(10));
    await forgetPost(d1, 'u2', 10);
    expect(await ownsPost(d1, 'u1', 10)).toBe(true);
    await forgetPost(d1, 'u1', 10);
    expect(await listPosts(d1, 'u1')).toEqual([]);
  });

  it('defaults settings off and updates them separately', async () => {
    const { d1 } = setup();
    expect(await getSettings(d1, 'u1')).toEqual({
      showName: false,
      removeOnDelete: false,
    });
    await updateSettings(d1, 'u1', { showName: true });
    expect(await updateSettings(d1, 'u1', { removeOnDelete: true })).toEqual({
      showName: true,
      removeOnDelete: true,
    });
    expect(await getSettings(d1, 'u2')).toEqual({
      showName: false,
      removeOnDelete: false,
    });
  });

  it('shows the owner’s current name only when they opted in', async () => {
    const { d1, sqlite } = setup();
    await recordPost(d1, 'u1', post(10));
    await recordPost(d1, 'u2', post(11));
    expect(await ownerNameForPost(d1, 10)).toBeNull();

    await updateSettings(d1, 'u1', { showName: true });
    expect(await ownerNameForPost(d1, 10)).toBe('Ada Lovelace');
    sqlite.exec(`update "user" set "name" = 'Ada King' where "id" = 'u1'`);
    expect(await ownerNameForPost(d1, 10)).toBe('Ada King');

    // Opted in without a name, or an anonymous page
    await updateSettings(d1, 'u2', { showName: true });
    expect(await ownerNameForPost(d1, 11)).toBeNull();
    expect(await ownerNameForPost(d1, 99)).toBeNull();
  });

  it('goes with the account', async () => {
    const { d1, sqlite } = setup();
    await recordPost(d1, 'u1', post(10));
    await updateSettings(d1, 'u1', { showName: true });
    sqlite.exec(`delete from "user" where "id" = 'u1'`);
    expect(await ownerNameForPost(d1, 10)).toBeNull();
    expect(
      sqlite.prepare(`select count(*) as n from "galleryPost"`).get(),
    ).toEqual({ n: 0 });
  });
});
