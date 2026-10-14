import { createTestD1 } from '#lib/server/test-d1.js';
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
  postKind,
  recordPost,
  relinkPalettePages,
  renamePost,
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

  it('moves a palette’s pages, every version, to another saved palette', async () => {
    const { d1 } = setup();
    const palette = (postId: number, projectId: string) => ({
      ...post(postId),
      projectId,
      kind: 'palette' as const,
    });
    await recordPost(d1, 'u1', palette(10, 'old'));
    await recordPost(d1, 'u1', palette(11, 'old'));
    await recordPost(d1, 'u1', palette(12, 'other'));
    await recordPost(d1, 'u1', { ...post(13), projectId: 'old' });
    await recordPost(d1, 'u2', palette(14, 'old'));

    expect(await relinkPalettePages(d1, 'u2', 10, 'new')).toBe(false);
    expect(await relinkPalettePages(d1, 'u1', 13, 'new')).toBe(false);
    expect(await relinkPalettePages(d1, 'u1', 11, 'new')).toBe(true);

    const ids = async (userId: string) =>
      Object.fromEntries(
        (await listPosts(d1, userId)).map((p) => [p.postId, p.projectId]),
      );
    expect(await ids('u1')).toEqual({
      10: 'new',
      11: 'new',
      12: 'other',
      13: 'old',
    });
    expect(await ids('u2')).toEqual({ 14: 'old' });
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

describe('renaming a palette page', () => {
  it("renames only the user's own palette pages", async () => {
    const { d1 } = setup();
    await recordPost(d1, 'u1', { ...post(1), kind: 'palette' });
    await recordPost(d1, 'u1', post(2));
    expect(await postKind(d1, 'u1', 1)).toBe('palette');
    expect(await postKind(d1, 'u1', 2)).toBe('project');
    expect(await postKind(d1, 'u2', 1)).toBeNull();

    expect(await renamePost(d1, 'u2', 1, 'Theirs')).toBe(false);
    expect(await renamePost(d1, 'u1', 2, 'A project')).toBe(false);
    expect(await renamePost(d1, 'u1', 1, 'Renamed')).toBe(true);
    const titles = (await listPosts(d1, 'u1')).map((p) => [p.postId, p.title]);
    expect(titles).toEqual(
      expect.arrayContaining([
        [1, 'Renamed'],
        [2, 'Project 2'],
      ]),
    );
  });
});
