import { createTestD1 } from '#lib/server/test-d1.js';
import { describe, expect, it } from 'vitest';
import { RavelryApiError, type RavelryProject } from './api';
import type { RavelrySession } from './index';
import { linkLine } from './project';
import {
  getProjectLink,
  listPhotos,
  readPacks,
  rememberRavelryUser,
  saveProjectLink,
} from './store';
import { LIST_EVERY, syncLinks } from './sync';

const T0 = Date.now();

function setup(projects: RavelryProject[]) {
  const { d1, sqlite } = createTestD1();
  const now = new Date().toISOString();
  sqlite.exec(
    `insert into "user" values ('u1', '', 'u1@example.test', 1, null, '${now}', '${now}')`,
  );
  const calls: string[] = [];
  const api = {
    listProjects: async () => {
      calls.push('list');
      return {
        projects: projects.map((p) => ({
          id: p.id,
          permalink: p.permalink,
          updated_at: p.updated_at,
          photos_count: p.photos?.length ?? 0,
          first_photo: p.photos?.[0] ?? null,
        })),
        paginator: { page: 1, page_count: 1 },
      };
    },
    showProject: async (_: string, id: number) => {
      calls.push(`show ${id}`);
      const found = projects.find((p) => p.id === id);
      if (!found) throw new RavelryApiError(404, 'gone');
      return found;
    },
  };
  const session = {
    db: d1,
    userId: 'u1',
    username: 'knitter',
    api,
  } as unknown as RavelrySession;
  return { d1, session, calls };
}

const project = (id: number, extra: Partial<RavelryProject> = {}) =>
  ({
    id,
    name: `P${id}`,
    permalink: `p${id}`,
    updated_at: '2026/10/01 10:00:00 -0400',
    notes: `My notes\n\n${linkLine('https://x.test/gallery/1')}`,
    photos: [{ id: id * 10 }],
    packs: [{ id: 5, personal_name: 'Brand Yarn', colorway: 'Red' }],
    ...extra,
  }) as RavelryProject;

async function link(d1: D1, projectId: string, ravelryProjectId: number) {
  await saveProjectLink(d1, 'u1', {
    projectId,
    ravelryProjectId,
    ravelryUsername: 'knitter',
    permalink: `p${ravelryProjectId}`,
    picturePhotoId: null,
  });
}
type D1 = ReturnType<typeof createTestD1>['d1'];

describe('syncLinks', () => {
  it('reads changed projects, keeps notes and photos, and unlinks deleted ones', async () => {
    const { d1, session, calls } = setup([project(1)]);
    await rememberRavelryUser(d1, 'u1', { id: 9, username: 'knitter' });
    await link(d1, 'a', 1);
    await link(d1, 'b', 2); // deleted on Ravelry

    expect(await syncLinks(session, { now: T0 })).toBe(true);
    expect(calls).toEqual(['list', 'show 1']);
    const a = await getProjectLink(d1, 'u1', 'a');
    expect(a?.notes).toBe('My notes');
    expect(readPacks(a?.packs)).toEqual([
      {
        packId: 5,
        name: 'Brand Yarn',
        colorway: 'Red',
        yarnId: null,
        ours: false,
      },
    ]);
    expect((await listPhotos(d1, 'u1', 'a')).map((p) => p.photoId)).toEqual([
      10,
    ]);
    expect(await getProjectLink(d1, 'u1', 'b')).toBeNull();
  });

  it('lists at most every few hours, and reads only what changed', async () => {
    const projects = [project(1)];
    const { d1, session, calls } = setup(projects);
    await rememberRavelryUser(d1, 'u1', { id: 9, username: 'knitter' });
    await link(d1, 'a', 1);
    await syncLinks(session, { now: T0 });
    calls.length = 0;

    expect(await syncLinks(session, { now: T0 + 1000 })).toBe(false);
    expect(calls).toEqual([]);

    // Unchanged: listed, not read
    await syncLinks(session, { now: T0 + LIST_EVERY + 1 });
    expect(calls).toEqual(['list']);
    calls.length = 0;

    // A photo added on Ravelry
    projects[0] = project(1, { photos: [{ id: 10 }, { id: 11 }] });
    await syncLinks(session, { now: T0 + 2 * LIST_EVERY + 2 });
    expect(calls).toEqual(['list', 'show 1']);
    expect((await listPhotos(d1, 'u1', 'a')).map((p) => p.photoId)).toEqual([
      10, 11,
    ]);
  });
});
