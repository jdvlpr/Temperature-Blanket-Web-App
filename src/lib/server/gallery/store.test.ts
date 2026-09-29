import { createTestD1 } from '$lib/server/test-d1';
import { describe, expect, it } from 'vitest';
import {
  forgetPost,
  getSettings,
  listPosts,
  newPublicId,
  ownerForPost,
  ownerPage,
  PUBLIC_ID_PATTERN,
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
      publicId: null,
    });
    await updateSettings(d1, 'u1', { showName: true });
    expect(
      await updateSettings(d1, 'u1', { removeOnDelete: true }),
    ).toMatchObject({ showName: true, removeOnDelete: true });
    expect(await getSettings(d1, 'u2')).toEqual({
      showName: false,
      removeOnDelete: false,
      publicId: null,
    });
  });

  it('shows the owner’s current name only when they opted in', async () => {
    const { d1, sqlite } = setup();
    await recordPost(d1, 'u1', post(10));
    await recordPost(d1, 'u2', post(11));
    expect(await ownerForPost(d1, 10)).toBeNull();

    const { publicId } = await updateSettings(d1, 'u1', { showName: true });
    expect(publicId).toMatch(PUBLIC_ID_PATTERN);
    expect(await ownerForPost(d1, 10)).toEqual({
      name: 'Ada Lovelace',
      publicId,
    });
    sqlite.exec(`update "user" set "name" = 'Ada King' where "id" = 'u1'`);
    expect((await ownerForPost(d1, 10))?.name).toBe('Ada King');

    // Opted in without a name, or an anonymous page
    await updateSettings(d1, 'u2', { showName: true });
    expect(await ownerForPost(d1, 11)).toBeNull();
    expect(await ownerForPost(d1, 99)).toBeNull();
  });

  it('keeps the owner page ID through name changes and opting out', async () => {
    const { d1 } = setup();
    expect(
      (await updateSettings(d1, 'u1', { removeOnDelete: true })).publicId,
    ).toBeNull();
    const { publicId } = await updateSettings(d1, 'u1', { showName: true });
    await updateSettings(d1, 'u1', { showName: false });
    expect((await getSettings(d1, 'u1')).publicId).toBe(publicId);
    expect((await updateSettings(d1, 'u1', { showName: true })).publicId).toBe(
      publicId,
    );
  });

  it('lists an owner page only while the owner shows their name', async () => {
    const { d1 } = setup();
    await recordPost(d1, 'u1', post(10, 1));
    await recordPost(d1, 'u1', post(11, 2));
    await recordPost(d1, 'u2', post(12, 3));
    const { publicId } = await updateSettings(d1, 'u1', { showName: true });

    expect(await ownerPage(d1, publicId!)).toEqual({
      name: 'Ada Lovelace',
      postIds: [11, 10],
    });
    expect(await ownerPage(d1, 'AAAAAAAAAAAA')).toBeNull();
    await updateSettings(d1, 'u1', { showName: false });
    expect(await ownerPage(d1, publicId!)).toBeNull();
  });

  it('makes page IDs of the expected shape', () => {
    const ids = new Set(Array.from({ length: 200 }, newPublicId));
    expect(ids.size).toBe(200);
    for (const id of ids) expect(id).toMatch(PUBLIC_ID_PATTERN);
  });

  it('goes with the account', async () => {
    const { d1, sqlite } = setup();
    await recordPost(d1, 'u1', post(10));
    await updateSettings(d1, 'u1', { showName: true });
    sqlite.exec(`delete from "user" where "id" = 'u1'`);
    expect(await ownerForPost(d1, 10)).toBeNull();
    expect(
      sqlite.prepare(`select count(*) as n from "galleryPost"`).get(),
    ).toEqual({ n: 0 });
  });
});
