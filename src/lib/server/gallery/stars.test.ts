import { createTestD1 } from '#lib/server/test-d1.js';
import { describe, expect, it } from 'vitest';
import {
  addStar,
  listStars,
  listStarsAndOwn,
  removeStar,
  removeStars,
  STAR_LIMIT,
} from './stars';
import { recordPost } from './store';

function setup() {
  const { d1, sqlite } = createTestD1();
  const now = new Date().toISOString();
  for (const id of ['u1', 'u2'])
    sqlite.exec(
      `insert into "user" values ('${id}', '', '${id}@example.test', 1, null, '${now}', '${now}')`,
    );
  return { d1, sqlite };
}

describe('gallery stars', () => {
  it('lists only the user’s stars, newest first, of one kind or both', async () => {
    const { d1 } = setup();
    await addStar(d1, 'u1', 10, 'project', 1);
    await addStar(d1, 'u1', 11, 'palette', 2);
    await addStar(d1, 'u1', 12, 'project', 3);
    await addStar(d1, 'u2', 13, 'project', 4);

    expect((await listStars(d1, 'u1')).map((s) => s.postId)).toEqual([
      12, 11, 10,
    ]);
    expect(await listStars(d1, 'u1', 'project')).toEqual([
      { postId: 12, kind: 'project', createdAt: 3 },
      { postId: 10, kind: 'project', createdAt: 1 },
    ]);
    expect((await listStars(d1, 'u2')).map((s) => s.postId)).toEqual([13]);
  });

  it('stars a page once, keeping when it was first starred', async () => {
    const { d1 } = setup();
    expect(await addStar(d1, 'u1', 10, 'project', 1)).toBe('added');
    expect(await addStar(d1, 'u1', 10, 'project', 2)).toBe('starred-already');
    expect(await listStars(d1, 'u1')).toEqual([
      { postId: 10, kind: 'project', createdAt: 1 },
    ]);
  });

  it('won’t star the user’s own page', async () => {
    const { d1 } = setup();
    await recordPost(d1, 'u1', {
      postId: 10,
      projectId: 'p10',
      title: 'Mine',
      publishedAt: 1,
    });
    expect(await addStar(d1, 'u1', 10, 'project')).toBe('own-page');
    expect(await addStar(d1, 'u2', 10, 'project')).toBe('added');
    expect(await listStarsAndOwn(d1, 'u1')).toEqual({ stars: [], own: [10] });
    expect(
      (await listStarsAndOwn(d1, 'u2')).stars.map((s) => s.postId),
    ).toEqual([10]);
  });

  it('stops at the limit', async () => {
    const { d1, sqlite } = setup();
    const insert = sqlite.prepare(
      `insert into "galleryStar" values ('u1', ?, 'project', ?)`,
    );
    for (let i = 1; i <= STAR_LIMIT; i++) insert.run(i, i);
    expect(await addStar(d1, 'u1', STAR_LIMIT + 1, 'project')).toBe(
      'star-limit',
    );
    expect(await addStar(d1, 'u1', 1, 'project')).toBe('starred-already');
    await removeStar(d1, 'u1', 1);
    expect(await addStar(d1, 'u1', STAR_LIMIT + 1, 'project')).toBe('added');
  });

  it('removes stars only for their user, many at once', async () => {
    const { d1 } = setup();
    for (let i = 1; i <= 200; i++) await addStar(d1, 'u1', i, 'palette', i);
    await addStar(d1, 'u2', 1, 'palette');
    await removeStars(d1, 'u1', [
      ...Array.from({ length: 150 }, (_, i) => i + 1),
    ]);
    await removeStars(d1, 'u1', []);
    expect((await listStars(d1, 'u1')).length).toBe(50);
    expect((await listStars(d1, 'u2')).length).toBe(1);
  });

  it('goes with the account', async () => {
    const { d1, sqlite } = setup();
    await addStar(d1, 'u1', 10, 'project');
    sqlite.exec(`delete from "user" where "id" = 'u1'`);
    expect(await listStars(d1, 'u1')).toEqual([]);
  });
});
