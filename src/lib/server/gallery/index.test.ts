import { createTestD1 } from '$lib/server/test-d1';
import { describe, expect, it, vi } from 'vitest';
import {
  paletteLink,
  PALETTES_PER_DAY,
  projectIdFromLink,
  publishFromAccount,
  publishPaletteFromAccount,
  releaseGalleryPosts,
  type GalleryContext,
} from './index';
import { listPosts, recordPost, updateSettings } from './store';
import { galleryApi, type PublishResponse } from './wordpress';

vi.mock('$lib/server/auth', () => ({ requireAccount: vi.fn() }));

type Call = { url: string; headers: Record<string, string>; body: string };

/** The WordPress routes, answering from `answer` and recording each call. */
function fakeWordPress(answer: (call: Call) => Response) {
  const calls: Call[] = [];
  const api = galleryApi({
    baseUrl: 'https://wp.example',
    key: 'shared-key',
    fetch: async (url, init) => {
      const call = {
        url,
        headers: init?.headers as Record<string, string>,
        body: String(init?.body),
      };
      calls.push(call);
      return answer(call);
    },
  });
  return { api, calls };
}

async function setup(answer: (call: Call) => Response) {
  const { d1, sqlite } = createTestD1();
  const now = new Date().toISOString();
  sqlite.exec(
    `insert into "user" values ('u1', 'Ada', 'u1@example.test', 1, null, '${now}', '${now}')`,
  );
  // A saved project p1 and a deleted one p2
  for (const [id, deletedAt] of [
    ['p1', null],
    ['p2', 5],
  ] as const)
    sqlite
      .prepare(
        `insert into "project" values ('u1', ?, 1, ?, 1, 1, 1, 10, 'Saved title', null, null)`,
      )
      .run(id, deletedAt);
  const wordpress = fakeWordPress(answer);
  const gallery: GalleryContext = { db: d1, userId: 'u1', api: wordpress.api };
  return { d1, gallery, calls: wordpress.calls };
}

const payload = (projectUrl: string, title = 'Somewhere from 2025 to 2026') =>
  JSON.stringify({ project_url: projectUrl, title, img: 'data:…' });

const answered = (body: PublishResponse, status = 200) =>
  Response.json(body, { status });

describe('projectIdFromLink', () => {
  it('reads the project parameter', () => {
    expect(
      projectIdFromLink('https://temperature-blanket.com/?project=abc-1&v=6#x'),
    ).toBe('abc-1');
    expect(projectIdFromLink('https://temperature-blanket.com/#x')).toBeNull();
    expect(projectIdFromLink('https://t.com/?project=a/b')).toBeNull();
    expect(projectIdFromLink('not a url')).toBeNull();
    expect(projectIdFromLink(42)).toBeNull();
  });
});

describe('publishFromAccount', () => {
  it('forwards the payload as the user and records the page', async () => {
    const { d1, gallery, calls } = await setup(() =>
      answered({
        code: 200,
        message: 'Success!',
        id: 77,
        link: 'l',
        title: 't',
      }),
    );
    const body = payload('https://temperature-blanket.com/?project=p1#h');
    const response = await publishFromAccount(gallery, body, 1234);

    expect(await response.json()).toMatchObject({ code: 200, linked: true });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(
      'https://wp.example/wp-json/tbgalleryapi/v1/project',
    );
    expect(calls[0].headers['Project-Owner-Id']).toBe('u1');
    expect(calls[0].headers['Project-Creation-Auth-Key']).toBe('shared-key');
    expect(calls[0].body).toBe(body);
    expect(await listPosts(d1, 'u1')).toEqual([
      {
        postId: 77,
        projectId: 'p1',
        title: 'Somewhere from 2025 to 2026',
        publishedAt: 1234,
        kind: 'project',
        link: null,
      },
    ]);
  });

  it.each([
    ['not saved to the account', 'https://t.com/?project=other#h', 'other'],
    ['deleted from the account', 'https://t.com/?project=p2#h', 'p2'],
    ['without a project ID', 'https://t.com/#h', ''],
  ])('publishes a project %s too', async (_, url, projectId) => {
    const { d1, gallery, calls } = await setup(() =>
      answered({ code: 200, id: 5 }),
    );
    const response = await publishFromAccount(gallery, payload(url), 9);
    expect(await response.json()).toMatchObject({ linked: true });
    expect(calls).toHaveLength(1);
    expect(await listPosts(d1, 'u1')).toEqual([
      expect.objectContaining({ postId: 5, projectId }),
    ]);
  });

  it('passes WordPress refusals through without recording', async () => {
    const duplicate = {
      code: 409,
      message: 'Already submitted',
      data: '{"permalink":"p"}',
    };
    const { d1, gallery } = await setup(() => answered(duplicate, 500));
    const response = await publishFromAccount(
      gallery,
      payload('https://t.com/?project=p1#h'),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(duplicate);
    expect(await listPosts(d1, 'u1')).toEqual([]);
  });

  it('says so when an older plugin returns no post ID', async () => {
    const { d1, gallery } = await setup(() => answered({ code: 200 }));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = await publishFromAccount(
      gallery,
      payload('https://t.com/?project=p1#h'),
    );
    expect(await response.json()).toMatchObject({ linked: false });
    expect(await listPosts(d1, 'u1')).toEqual([]);
  });

  it('rejects a body that isn’t JSON', async () => {
    const { gallery } = await setup(() => answered({ code: 200 }));
    expect((await publishFromAccount(gallery, '{')).status).toBe(400);
  });
});

describe('releaseGalleryPosts', () => {
  const posts = async (d1: GalleryContext['db']) => {
    for (const postId of [1, 2])
      await recordPost(d1, 'u1', {
        postId,
        projectId: 'p1',
        title: 't',
        publishedAt: postId,
      });
  };

  it('keeps pages without an owner by default', async () => {
    const { d1, gallery, calls } = await setup(() => answered({ code: 200 }));
    await posts(d1);
    await releaseGalleryPosts(d1, gallery.api, 'u1');
    expect(calls.map((c) => c.url)).toEqual([
      'https://wp.example/wp-json/tbgalleryapi/v1/owner/clear',
    ]);
    expect(calls[0].headers['Project-Owner-Id']).toBe('u1');
  });

  it('removes them when chosen, then clears the owner', async () => {
    const { d1, gallery, calls } = await setup(({ url }) =>
      url.endsWith('/2/trash')
        ? new Response('', { status: 502 })
        : answered({ code: 200 }),
    );
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await posts(d1);
    await updateSettings(d1, 'u1', { removeOnDelete: true });
    await releaseGalleryPosts(d1, gallery.api, 'u1');

    expect(calls.map((c) => c.url.split('/v1')[1])).toEqual([
      '/project/2/trash',
      '/project/1/trash',
      '/owner/clear',
    ]);
    // The one WordPress couldn't remove is still listed
    expect((await listPosts(d1, 'u1')).map((p) => p.postId)).toEqual([2]);
  });

  it('does nothing for an account without pages, and never throws', async () => {
    const { d1, gallery, calls } = await setup(() => {
      throw new Error('down');
    });
    await releaseGalleryPosts(d1, gallery.api, 'u1');
    expect(calls).toHaveLength(0);

    vi.spyOn(console, 'error').mockImplementation(() => {});
    await posts(d1);
    await expect(
      releaseGalleryPosts(d1, gallery.api, 'u1'),
    ).resolves.toBeUndefined();
  });
});

describe('galleryApi.trash', () => {
  it('treats a missing page as gone and other failures as errors', async () => {
    const statuses = [200, 404, 500];
    const { api } = fakeWordPress(
      () => new Response('{}', { status: statuses.shift() }),
    );
    expect(await api.trash(1, 'u1')).toBe('ok');
    expect(await api.trash(1, 'u1')).toBe('gone');
    await expect(api.trash(1, 'u1')).rejects.toThrow();
  });
});

describe('sharing a palette', () => {
  const origin = 'https://temperature-blanket.com';
  const link = `${origin}/yarn?s=ff0000abc-def&v=6`;

  it("only takes this site's Yarn Palette Creator links", () => {
    expect(paletteLink(link, origin)).toBe(link);
    expect(paletteLink(`${origin}/yarn`, origin)).toBeNull();
    expect(paletteLink(`${origin}/gallery?s=x`, origin)).toBeNull();
    expect(paletteLink('https://evil.example/yarn?s=x', origin)).toBeNull();
    expect(paletteLink('javascript:alert(1)', origin)).toBeNull();
    expect(paletteLink(42, origin)).toBeNull();
  });

  it('sends a cleaned name as the user and records the palette', async () => {
    const { d1, gallery, calls } = await setup(() =>
      answered({ code: 200, message: 'Success!', id: 91, title: 'Autumn' }),
    );
    const response = await publishPaletteFromAccount(
      gallery,
      { paletteId: 'pal-1', title: ' Autumn\u202e ', yarnUrl: link },
      origin,
      1000,
    );
    expect(await response.json()).toMatchObject({ id: 91, linked: true });
    expect(calls[0].url).toBe(
      'https://wp.example/wp-json/tbgalleryapi/v1/palette',
    );
    expect(calls[0].headers['Project-Owner-Id']).toBe('u1');
    expect(JSON.parse(calls[0].body)).toEqual({
      title: 'Autumn',
      yarn_url: link,
    });
    expect(await listPosts(d1, 'u1')).toEqual([
      {
        postId: 91,
        projectId: 'pal-1',
        title: 'Autumn',
        publishedAt: 1000,
        kind: 'palette',
        link,
      },
    ]);
  });

  it('refuses a missing name or link before calling WordPress', async () => {
    const { gallery, calls } = await setup(() => answered({ code: 200 }));
    for (const body of [
      { title: '  ', yarnUrl: link },
      { title: 'Autumn', yarnUrl: 'https://evil.example/yarn?s=x' },
    ]) {
      const response = await publishPaletteFromAccount(gallery, body, origin);
      expect(response.status).toBe(400);
    }
    expect(calls).toHaveLength(0);
  });

  it('passes WordPress answers through and records nothing', async () => {
    const { d1, gallery } = await setup(() =>
      answered(
        { code: 409, message: 'This palette is already in the gallery.' },
        409,
      ),
    );
    const response = await publishPaletteFromAccount(
      gallery,
      { title: 'Autumn', yarnUrl: link },
      origin,
    );
    expect(await response.json()).toMatchObject({ code: 409 });
    expect(await listPosts(d1, 'u1')).toEqual([]);
  });

  it('allows a limited number a day', async () => {
    const { d1, gallery, calls } = await setup(() => answered({ code: 200 }));
    const now = 10 * 24 * 60 * 60 * 1000;
    for (let i = 0; i < PALETTES_PER_DAY; i++)
      await recordPost(d1, 'u1', {
        postId: 500 + i,
        projectId: '',
        title: 'P',
        publishedAt: now - 60_000,
        kind: 'palette',
        link,
      });
    const response = await publishPaletteFromAccount(
      gallery,
      { title: 'One more', yarnUrl: link },
      origin,
      now,
    );
    expect(response.status).toBe(429);
    expect(calls).toHaveLength(0);
  });
});
