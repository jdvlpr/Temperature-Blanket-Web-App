import { createTestD1 } from '#lib/server/test-d1.js';
import { describe, expect, it, vi } from 'vitest';
import {
  paletteLink,
  PALETTES_PER_DAY,
  projectIdFromLink,
  publishFromAccount,
  publishPaletteFromAccount,
  releaseGalleryPosts,
  renamePaletteFromAccount,
  type GalleryContext,
} from './index';
import {
  getSettings,
  listPosts,
  PUBLIC_ID_PATTERN,
  recordPost,
  updateSettings,
} from './store';
import { galleryApi, type PublishResponse } from './wordpress';

vi.mock('#lib/server/auth/index.js', () => ({ requireAccount: vi.fn() }));

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
    const response = await publishFromAccount(gallery, body, {}, 1234);

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
        // As published, for the page's colors on My Projects
        link: 'https://temperature-blanket.com/?project=p1#h',
        showOwner: false,
      },
    ]);
    expect((await getSettings(d1, 'u1')).publicId).toBeNull();
  });

  it('includes it on the public gallery when chosen, and remembers the choice', async () => {
    const { d1, gallery } = await setup(() => answered({ code: 200, id: 78 }));
    const body = JSON.stringify({
      ...JSON.parse(payload('https://t.com/?project=p1#h')),
      project_name: '  Grandma’s\u202e blanket ',
    });
    await publishFromAccount(gallery, body, { showOwner: true }, 5);

    expect(await listPosts(d1, 'u1')).toEqual([
      expect.objectContaining({
        postId: 78,
        title: 'Grandma’s blanket',
        showOwner: true,
      }),
    ]);
    const settings = await getSettings(d1, 'u1');
    expect(settings.showOwnerDefault).toBe(true);
    expect(settings.publicId).toMatch(PUBLIC_ID_PATTERN);
  });

  it.each([
    ['not saved to the account', 'https://t.com/?project=other#h', 'other'],
    ['deleted from the account', 'https://t.com/?project=p2#h', 'p2'],
    ['without a project ID', 'https://t.com/#h', ''],
  ])('publishes a project %s too', async (_, url, projectId) => {
    const { d1, gallery, calls } = await setup(() =>
      answered({ code: 200, id: 5 }),
    );
    const response = await publishFromAccount(gallery, payload(url), {}, 9);
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
      {
        paletteId: 'pal-1',
        title: ' Autumn\u202e ',
        yarnUrl: link,
        showOwner: true,
      },
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
        showOwner: true,
      },
    ]);
    expect((await getSettings(d1, 'u1')).showOwnerDefault).toBe(true);
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

describe('renaming a palette page', () => {
  async function withPages(answer: (call: Call) => Response) {
    const ctx = await setup(answer);
    await recordPost(ctx.d1, 'u1', {
      postId: 7,
      projectId: 'pal1',
      title: 'Old name',
      publishedAt: 1,
      kind: 'palette',
    });
    await recordPost(ctx.d1, 'u1', {
      postId: 8,
      projectId: 'p1',
      title: 'A project',
      publishedAt: 2,
    });
    return ctx;
  }
  const titleOf = async (d1: GalleryContext['db'], postId: number) =>
    (await listPosts(d1, 'u1')).find((p) => p.postId === postId)?.title;

  it('renames it as the user, with a cleaned name, and records it', async () => {
    const { gallery, calls, d1 } = await withPages(() =>
      answered({ code: 200, id: 7, title: 'New name' }),
    );
    const response = await renamePaletteFromAccount(
      gallery,
      7,
      '  New\u200b   name ',
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ title: 'New name' });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(
      'https://wp.example/wp-json/tbgalleryapi/v1/palette/7/title',
    );
    expect(calls[0].headers['Project-Owner-Id']).toBe('u1');
    expect(JSON.parse(calls[0].body)).toEqual({ title: 'New name' });
    expect(await titleOf(d1, 7)).toBe('New name');
  });

  it("refuses someone else's page, a project page, or no name, without asking WordPress", async () => {
    const { gallery, calls } = await withPages(() => answered({ code: 200 }));
    expect((await renamePaletteFromAccount(gallery, 99, 'x')).status).toBe(404);
    expect((await renamePaletteFromAccount(gallery, 8, 'x')).status).toBe(404);
    expect(
      (await renamePaletteFromAccount(gallery, 7, ' \u200b ')).status,
    ).toBe(400);
    expect((await renamePaletteFromAccount(gallery, 7, 42)).status).toBe(400);
    expect(calls).toHaveLength(0);
  });

  it('tells an older gallery plugin (no route) from a missing palette', async () => {
    const older = await withPages(() =>
      answered(
        { code: 'rest_no_route', message: 'No route' } as PublishResponse,
        404,
      ),
    );
    const response = await renamePaletteFromAccount(older.gallery, 7, 'New');
    expect(response.status).toBe(501);
    expect((await response.json()).code).toBe('RENAME_UNSUPPORTED');
    expect(await titleOf(older.d1, 7)).toBe('Old name');

    const missing = await withPages(() =>
      answered({ code: 404, message: 'No such palette.' }, 404),
    );
    expect(
      (await renamePaletteFromAccount(missing.gallery, 7, 'New')).status,
    ).toBe(404);
    expect(await titleOf(missing.d1, 7)).toBe('Old name');
  });

  it('says the gallery is unavailable when WordPress fails', async () => {
    const { gallery } = await withPages(
      () => new Response('oops', { status: 500 }),
    );
    expect((await renamePaletteFromAccount(gallery, 7, 'New')).status).toBe(
      502,
    );
  });
});

describe('palettes shared with a project', () => {
  const link = (code: string) =>
    `https://temperature-blanket.com/yarn?s=${code}&f=x`;
  const body = (palettes: unknown[]) =>
    JSON.stringify({
      project_url: 'https://temperature-blanket.com/?project=p1#x',
      title: 'Somewhere',
      share_palettes: palettes,
    });

  it('records each created palette as the account’s, on its saved palette', async () => {
    const { gallery, d1, calls } = await setup(() =>
      answered({
        code: 200,
        id: 50,
        shared_palettes: {
          created: [{ id: 51, title: 'Warm', yarn_url: link('aa') }],
          skipped: [
            { title: 'Cool', yarn_url: link('bb'), reason: 'duplicate', id: 9 },
          ],
        },
      } as PublishResponse),
    );
    const payloadText = body([
      // the app's own origin and version: matched by the colors part
      {
        title: 'Warm',
        yarn_url: 'https://localhost:5173/yarn?s=aa&v=7&f=x',
        palette_id: 'pal1',
      },
      { title: 'Cool', yarn_url: link('bb') },
    ]);
    const response = await publishFromAccount(gallery, payloadText, {
      showOwner: true,
    });
    const answer = await response.json();
    // Under the limit, forwarded exactly as sent
    expect(calls[0].body).toBe(payloadText);
    expect(answer.shared_palettes.skipped).toHaveLength(1);
    const posts = await listPosts(d1, 'u1');
    expect(posts.find((p) => p.postId === 51)).toMatchObject({
      kind: 'palette',
      projectId: 'pal1',
      title: 'Warm',
      link: link('aa'),
      showOwner: true,
    });
    expect(posts.map((p) => p.postId).sort()).toEqual([50, 51]);
  });

  it('leaves out palettes past the daily limit, never the project', async () => {
    const { gallery, d1, calls } = await setup(() =>
      answered({
        code: 200,
        id: 60,
        shared_palettes: { created: [], skipped: [] },
      } as PublishResponse),
    );
    for (let i = 0; i < PALETTES_PER_DAY - 1; i++)
      await recordPost(d1, 'u1', {
        postId: 100 + i,
        projectId: '',
        title: 'Earlier',
        publishedAt: Date.now(),
        kind: 'palette',
      });
    const response = await publishFromAccount(
      gallery,
      body([
        { title: 'One', yarn_url: link('aa') },
        { title: 'Two', yarn_url: link('bb') },
      ]),
    );
    expect(JSON.parse(calls[0].body).share_palettes).toEqual([
      { title: 'One', yarn_url: link('aa') },
    ]);
    const answer = await response.json();
    expect(answer.code).toBe(200);
    expect(answer.shared_palettes.skipped).toEqual([
      { title: 'Two', yarn_url: link('bb'), reason: 'limit' },
    ]);
  });

  it('records no palettes when an older plugin doesn’t answer about them', async () => {
    const { gallery, d1 } = await setup(() => answered({ code: 200, id: 70 }));
    await publishFromAccount(
      gallery,
      body([{ title: 'One', yarn_url: link('aa') }]),
    );
    expect((await listPosts(d1, 'u1')).map((p) => p.postId)).toEqual([70]);
  });
});
