import { createTestD1 } from '$lib/server/test-d1';
import { describe, expect, it } from 'vitest';
import {
  ensurePublicId,
  forgetPost,
  getSettings,
  listPosts,
  newPublicId,
  ownerForPost,
  ownerPage,
  PUBLIC_ID_PATTERN,
  ownsPost,
  recordPost,
  setPostShowOwner,
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
      showOwnerDefault: false,
      removeOnDelete: false,
      publicId: null,
    });
    await updateSettings(d1, 'u1', { showOwnerDefault: true });
    expect(
      await updateSettings(d1, 'u1', { removeOnDelete: true }),
    ).toMatchObject({ showOwnerDefault: true, removeOnDelete: true });
    expect(await getSettings(d1, 'u2')).toEqual({
      showOwnerDefault: false,
      removeOnDelete: false,
      publicId: null,
    });
  });

  it('shows the owner’s current name only on pages they included', async () => {
    const { d1, sqlite } = setup();
    await recordPost(d1, 'u1', { ...post(10), showOwner: true });
    await recordPost(d1, 'u1', post(11));
    await recordPost(d1, 'u2', { ...post(12), showOwner: true });
    // No owner page yet: nothing has been included through the app
    expect(await ownerForPost(d1, 10)).toBeNull();

    const publicId = await ensurePublicId(d1, 'u1');
    expect(publicId).toMatch(PUBLIC_ID_PATTERN);
    expect(await ownerForPost(d1, 10)).toEqual({
      name: 'Ada Lovelace',
      publicId,
    });
    expect(await ownerForPost(d1, 11)).toBeNull();
    sqlite.exec(`update "user" set "name" = 'Ada King' where "id" = 'u1'`);
    expect((await ownerForPost(d1, 10))?.name).toBe('Ada King');

    // Included without a display name, or an anonymous page
    await ensurePublicId(d1, 'u2');
    expect(await ownerForPost(d1, 12)).toBeNull();
    expect(await ownerForPost(d1, 99)).toBeNull();
  });

  it('includes and takes off one page at a time, for its owner only', async () => {
    const { d1 } = setup();
    await recordPost(d1, 'u1', post(10));
    expect(await setPostShowOwner(d1, 'u2', 10, true)).toBe(false);
    expect(await ownerForPost(d1, 10)).toBeNull();

    expect(await setPostShowOwner(d1, 'u1', 10, true)).toBe(true);
    const { publicId } = await getSettings(d1, 'u1');
    expect(await ownerForPost(d1, 10)).toEqual({
      name: 'Ada Lovelace',
      publicId,
    });
    expect(await setPostShowOwner(d1, 'u1', 10, false)).toBe(true);
    expect(await ownerForPost(d1, 10)).toBeNull();
    expect(await setPostShowOwner(d1, 'u1', 99, true)).toBe(false);
  });

  it('keeps the owner page ID once made', async () => {
    const { d1 } = setup();
    await updateSettings(d1, 'u1', { removeOnDelete: true });
    expect((await getSettings(d1, 'u1')).publicId).toBeNull();
    const publicId = await ensurePublicId(d1, 'u1');
    await updateSettings(d1, 'u1', { showOwnerDefault: false });
    expect(await ensurePublicId(d1, 'u1')).toBe(publicId);
    expect(await getSettings(d1, 'u1')).toEqual({
      showOwnerDefault: false,
      removeOnDelete: true,
      publicId,
    });
  });

  it('lists only included pages on the owner page, which needs one', async () => {
    const { d1 } = setup();
    await recordPost(d1, 'u1', { ...post(10, 1), showOwner: true });
    await recordPost(d1, 'u1', post(11, 2));
    await recordPost(d1, 'u1', {
      ...post(13, 4),
      kind: 'palette',
      showOwner: true,
    });
    await recordPost(d1, 'u2', { ...post(12, 3), showOwner: true });
    const publicId = await ensurePublicId(d1, 'u1');

    expect(await ownerPage(d1, publicId)).toEqual({
      name: 'Ada Lovelace',
      postIds: [10],
      paletteIds: [13],
    });
    expect(await ownerPage(d1, 'AAAAAAAAAAAA')).toBeNull();
    await setPostShowOwner(d1, 'u1', 10, false);
    await setPostShowOwner(d1, 'u1', 13, false);
    expect(await ownerPage(d1, publicId)).toBeNull();
  });

  it('makes page IDs of the expected shape', () => {
    const ids = new Set(Array.from({ length: 200 }, newPublicId));
    expect(ids.size).toBe(200);
    for (const id of ids) expect(id).toMatch(PUBLIC_ID_PATTERN);
  });

  it('goes with the account', async () => {
    const { d1, sqlite } = setup();
    await recordPost(d1, 'u1', { ...post(10), showOwner: true });
    await ensurePublicId(d1, 'u1');
    sqlite.exec(`delete from "user" where "id" = 'u1'`);
    expect(await ownerForPost(d1, 10)).toBeNull();
    expect(
      sqlite.prepare(`select count(*) as n from "galleryPost"`).get(),
    ).toEqual({ n: 0 });
  });
});
