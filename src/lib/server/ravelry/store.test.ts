import { createTestD1 } from '#lib/server/test-d1.js';
import { describe, expect, it } from 'vitest';
import {
  forgetProjectLink,
  forgetRavelryStatements,
  getProjectLink,
  listPhotos,
  listProjectLinks,
  photosForGalleryPost,
  ravelryUsername,
  rememberRavelryUser,
  replacePhotos,
  saveProjectLink,
} from './store';

function setup() {
  const { d1, sqlite } = createTestD1();
  const now = new Date().toISOString();
  for (const id of ['u1', 'u2'])
    sqlite.exec(
      `insert into "user" values ('${id}', '', '${id}@example.test', 1, null, '${now}', '${now}')`,
    );
  return { d1, sqlite };
}

const link = (projectId = 'p1') => ({
  projectId,
  ravelryProjectId: 42,
  ravelryUsername: 'knitter',
  permalink: 'my-blanket',
  picturePhotoId: null,
});

const photo = (id: number, sort_order = id) => ({
  id,
  sort_order,
  square_url: `https://images.example/${id}-sq.jpg`,
  medium2_url: `https://images.example/${id}-m2.jpg`,
});

describe('ravelry store', () => {
  it('keeps the latest username', async () => {
    const { d1 } = setup();
    await rememberRavelryUser(d1, 'u1', { id: 1, username: 'old' });
    await rememberRavelryUser(d1, 'u1', { id: 1, username: 'new' });
    expect(await ravelryUsername(d1, 'u1')).toBe('new');
    expect(await ravelryUsername(d1, 'u2')).toBeNull();
  });

  it('links a project once per account, keeping when it was first posted', async () => {
    const { d1 } = setup();
    await saveProjectLink(d1, 'u1', link());
    const first = await getProjectLink(d1, 'u1', 'p1');
    await saveProjectLink(d1, 'u1', { ...link(), permalink: 'renamed' });
    const again = await getProjectLink(d1, 'u1', 'p1');
    expect(again?.permalink).toBe('renamed');
    expect(again?.postedAt).toBe(first?.postedAt);
    expect(await getProjectLink(d1, 'u2', 'p1')).toBeNull();
    expect((await listProjectLinks(d1, 'u1')).length).toBe(1);
  });

  it('replaces photos in Ravelry’s order and marks the app’s picture', async () => {
    const { d1 } = setup();
    await saveProjectLink(d1, 'u1', link());
    await replacePhotos(d1, 'u1', 'p1', [photo(7, 1), photo(5, 0)], 7);
    const photos = await listPhotos(d1, 'u1', 'p1');
    expect(photos.map((p) => [p.photoId, p.isPicture])).toEqual([
      [5, false],
      [7, true],
    ]);
    await replacePhotos(d1, 'u1', 'p1', [photo(5)], null);
    expect((await listPhotos(d1, 'u1', 'p1')).map((p) => p.photoId)).toEqual([
      5,
    ]);
  });

  it('unlinking forgets the photos too', async () => {
    const { d1 } = setup();
    await saveProjectLink(d1, 'u1', link());
    await replacePhotos(d1, 'u1', 'p1', [photo(1)], null);
    await forgetProjectLink(d1, 'u1', 'p1');
    expect(await getProjectLink(d1, 'u1', 'p1')).toBeNull();
    expect(await listPhotos(d1, 'u1', 'p1')).toEqual([]);
  });

  it('finds a gallery page’s Ravelry photos through its project', async () => {
    const { d1, sqlite } = setup();
    sqlite.exec(
      `insert into "galleryPost" ("postId", "userId", "projectId", "title", "publishedAt") values (100, 'u1', 'p1', 'T', 1)`,
    );
    expect(await photosForGalleryPost(d1, 100)).toBeNull();
    await saveProjectLink(d1, 'u1', link());
    await replacePhotos(d1, 'u1', 'p1', [photo(1)], null);
    const found = await photosForGalleryPost(d1, 100);
    expect(found?.url).toBe(
      'https://www.ravelry.com/projects/knitter/my-blanket',
    );
    expect(found?.photos.map((p) => p.photoId)).toEqual([1]);
  });

  it('forgets everything Ravelry for one account only', async () => {
    const { d1 } = setup();
    for (const user of ['u1', 'u2']) {
      await rememberRavelryUser(d1, user, { id: 1, username: user });
      await saveProjectLink(d1, user, link());
      await replacePhotos(d1, user, 'p1', [photo(1)], null);
    }
    await d1.batch(forgetRavelryStatements(d1, 'u1'));
    expect(await ravelryUsername(d1, 'u1')).toBeNull();
    expect(await listProjectLinks(d1, 'u1')).toEqual([]);
    expect(await listPhotos(d1, 'u1', 'p1')).toEqual([]);
    expect(await ravelryUsername(d1, 'u2')).toBe('u2');
  });
});
