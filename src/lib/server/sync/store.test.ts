import type { R2Bucket } from '@cloudflare/workers-types';
import { createTestD1 } from '$lib/server/test-d1';
import { describe, expect, it } from 'vitest';
import {
  cleanUpUserSync,
  DELETION_RECORD_TTL_MS,
  deleteProject,
  deleteUserProjectData,
  getProjectData,
  getTrashedProjectData,
  listChanges,
  listTrash,
  MAX_BYTES_PER_USER,
  MAX_PALETTES_PER_USER,
  MAX_PROJECTS_PER_USER,
  purgeTrash,
  savePalette,
  savePreferences,
  saveProject,
  type SaveInput,
} from './store';
import { TRASH_DAYS } from '$lib/storage/trash';
import type { PaletteInput } from '$lib/sync/protocol';

/** An in-memory R2 bucket covering put/get/delete/list. */
function createTestBucket() {
  const objects = new Map<string, Uint8Array>();
  const bucket = {
    put: async (key: string, body: ArrayBuffer) => {
      objects.set(key, new Uint8Array(body));
      return {};
    },
    get: async (key: string) => {
      const data = objects.get(key);
      return data
        ? { body: new Blob([data as Uint8Array<ArrayBuffer>]).stream() }
        : null;
    },
    delete: async (keys: string | string[]) => {
      for (const key of [keys].flat()) objects.delete(key);
    },
    // Two keys a page; like R2, the cursor continues after the last key listed
    list: async ({
      prefix = '',
      cursor,
    }: {
      prefix?: string;
      cursor?: string;
    }) => {
      const keys = [...objects.keys()]
        .filter((k) => k.startsWith(prefix) && (!cursor || k > cursor))
        .sort();
      const page = keys.slice(0, 2);
      const truncated = keys.length > 2;
      return {
        objects: page.map((key) => ({ key })),
        truncated,
        cursor: truncated ? page.at(-1) : undefined,
      };
    },
  };
  return { bucket: bucket as unknown as R2Bucket, objects };
}

function setup() {
  const { d1, sqlite } = createTestD1();
  const { bucket, objects } = createTestBucket();
  const now = new Date().toISOString();
  for (const id of ['u1', 'u2'])
    sqlite.exec(
      `insert into "user" values ('${id}', '', '${id}@example.test', 1, null, '${now}', '${now}')`,
    );
  return { d1, sqlite, bucket, objects };
}

const input = (overrides: Partial<SaveInput> = {}): SaveInput => {
  const body = new TextEncoder().encode(overrides.title ?? 'data').buffer;
  return {
    userId: 'u1',
    projectId: 'p1',
    baseRev: null,
    clientUpdatedAt: 1000,
    schemaVersion: 1,
    title: 'Blanket',
    contentHash: 'a'.repeat(64),
    sizeBytes: body.byteLength,
    body,
    ...overrides,
  };
};

const text = async (stream: unknown) =>
  new Response(stream as ReadableStream).text();

describe('saveProject', () => {
  it('creates, then updates only from the current revision', async () => {
    const { d1, bucket, objects } = setup();

    const created = await saveProject(d1, bucket, input());
    expect(created).toMatchObject({
      status: 'saved',
      meta: { id: 'p1', rev: 1, deleted: false },
    });

    const updated = await saveProject(
      d1,
      bucket,
      input({ baseRev: 1, title: 'Renamed' }),
    );
    expect(updated).toMatchObject({
      status: 'saved',
      meta: { rev: 2, title: 'Renamed' },
    });

    // A save based on the old revision is rejected, and its upload removed
    const stale = await saveProject(
      d1,
      bucket,
      input({ baseRev: 1, title: 'Stale' }),
    );
    expect(stale).toMatchObject({
      status: 'conflict',
      current: { rev: 2, title: 'Renamed' },
    });

    const stored = await getProjectData(d1, bucket, 'u1', 'p1');
    expect(await text(stored?.body)).toBe('Renamed');
    // The replaced copy is kept for recovery; the rejected one is gone
    expect(objects.size).toBe(2);
  });

  it('rejects a second create of the same project', async () => {
    const { d1, bucket } = setup();
    await saveProject(d1, bucket, input());
    const again = await saveProject(
      d1,
      bucket,
      input({ title: 'Other device' }),
    );
    expect(again).toMatchObject({
      status: 'conflict',
      current: { rev: 1, title: 'Blanket' },
    });
  });

  it('keeps accounts apart', async () => {
    const { d1, bucket } = setup();
    await saveProject(d1, bucket, input());
    const other = await saveProject(d1, bucket, input({ userId: 'u2' }));
    expect(other).toMatchObject({ status: 'saved', meta: { rev: 1 } });
    expect(await getProjectData(d1, bucket, 'u2', 'p1')).not.toBeNull();
    const u1Changes = await listChanges(d1, 'u1', 0, 100);
    expect(u1Changes).toMatchObject({ changes: [{ id: 'p1' }] });
  });

  it('enforces the per-account quota', async () => {
    const { d1, sqlite, bucket } = setup();
    const insert = sqlite.prepare(
      `insert into "project" values ('u1', ?, 1, null, 0, 0, 1, 1, '', null, null)`,
    );
    for (let i = 0; i < MAX_PROJECTS_PER_USER; i++) insert.run(`seed-${i}`);
    expect(await saveProject(d1, bucket, input())).toEqual({
      status: 'quota',
      reason: 'projects',
    });

    // Replacing an existing project doesn't count it twice
    expect(
      await saveProject(d1, bucket, input({ projectId: 'seed-0', baseRev: 1 })),
    ).toMatchObject({ status: 'saved' });

    sqlite.exec(`delete from "project"`);
    sqlite.exec(
      `insert into "project" values ('u1', 'big', 1, null, 0, 0, 1, ${MAX_BYTES_PER_USER}, '', null, null)`,
    );
    expect(await saveProject(d1, bucket, input())).toEqual({
      status: 'quota',
      reason: 'bytes',
    });
  });
});

describe('deleteProject', () => {
  it('deletes from the current revision, and again is a no-op', async () => {
    const { d1, bucket } = setup();
    await saveProject(d1, bucket, input());
    const deleted = await deleteProject(d1, 'u1', 'p1', 1);
    expect(deleted).toMatchObject({
      status: 'deleted',
      meta: { rev: 2, deleted: true },
    });
    expect(await getProjectData(d1, bucket, 'u1', 'p1')).toBeNull();
    expect(await deleteProject(d1, 'u1', 'p1', 1)).toMatchObject({
      status: 'deleted',
    });
    expect(await deleteProject(d1, 'u1', 'nope', 1)).toEqual({
      status: 'not-found',
    });
  });

  it('never beats a newer edit', async () => {
    const { d1, bucket } = setup();
    await saveProject(d1, bucket, input());
    await saveProject(d1, bucket, input({ baseRev: 1, title: 'Edited' }));
    expect(await deleteProject(d1, 'u1', 'p1', 1)).toMatchObject({
      status: 'conflict',
      current: { rev: 2, deleted: false },
    });
  });

  it('is undone by an edit saved on the deletion record', async () => {
    const { d1, bucket } = setup();
    await saveProject(d1, bucket, input());
    await deleteProject(d1, 'u1', 'p1', 1);
    // A device that edited meanwhile tries a create, sees the deletion, saves over it
    const create = await saveProject(d1, bucket, input({ title: 'Kept' }));
    expect(create).toMatchObject({
      status: 'conflict',
      current: { rev: 2, deleted: true },
    });
    const restored = await saveProject(
      d1,
      bucket,
      input({ baseRev: 2, title: 'Kept' }),
    );
    expect(restored).toMatchObject({
      status: 'saved',
      meta: { rev: 4, deleted: false, title: 'Kept' },
    });
  });
});

describe('listChanges', () => {
  it('pages through changes in revision order', async () => {
    const { d1, bucket } = setup();
    for (const id of ['a', 'b', 'c'])
      await saveProject(d1, bucket, input({ projectId: id }));
    await deleteProject(d1, 'u1', 'a', 1);

    const first = await listChanges(d1, 'u1', 0, 2);
    expect(first).toMatchObject({
      changes: [{ id: 'b' }, { id: 'c' }],
      nextSince: 3,
      hasMore: true,
    });
    const second = await listChanges(d1, 'u1', 3, 2);
    expect(second).toMatchObject({
      changes: [{ id: 'a', rev: 4, deleted: true }],
      nextSince: 4,
      hasMore: false,
    });
    expect(await listChanges(d1, 'u1', 4, 2)).toMatchObject({
      changes: [],
      nextSince: 4,
    });
  });
});

describe('cleanUpUserSync', () => {
  it('purges old deletion records and replaced copies, once a day', async () => {
    const { d1, sqlite, bucket, objects } = setup();
    const t0 = Date.parse('2026-01-01T00:00:00Z');
    await saveProject(d1, bucket, input({ projectId: 'gone' }), t0);
    await deleteProject(d1, 'u1', 'gone', 1, t0);
    await saveProject(d1, bucket, input({ projectId: 'kept' }), t0);
    await saveProject(d1, bucket, input({ projectId: 'kept', baseRev: 3 }), t0);
    expect(objects.size).toBe(3);

    const later = t0 + DELETION_RECORD_TTL_MS + 1;
    await cleanUpUserSync(d1, bucket, 'u1', later);

    expect(sqlite.prepare(`select "projectId" from "project"`).all()).toEqual([
      { projectId: 'kept' },
    ]);
    expect(objects.size).toBe(1);
    // A device last synced before the purge must compare everything
    expect(await listChanges(d1, 'u1', 1, 100)).toMatchObject({
      fullResyncRequired: true,
    });
    expect(await listChanges(d1, 'u1', 2, 100)).toMatchObject({
      fullResyncRequired: false,
    });

    // Not again within a day, even with an old copy waiting
    await saveProject(d1, bucket, input({ projectId: 'kept', baseRev: 4 }), t0);
    await cleanUpUserSync(d1, bucket, 'u1', later + 1000);
    expect(objects.size).toBe(2);
  });
});

describe('deleteUserProjectData', () => {
  it("deletes every copy under the user's prefix, and nobody else's", async () => {
    const { d1, bucket, objects } = setup();
    for (const id of ['a', 'b', 'c'])
      await saveProject(d1, bucket, input({ projectId: id }));
    await saveProject(d1, bucket, input({ userId: 'u2' }));
    await deleteUserProjectData(bucket, 'u1');
    expect([...objects.keys()]).toEqual([expect.stringMatching(/^u\/u2\//)]);
  });

  it('project rows go with the user', async () => {
    const { d1, sqlite, bucket } = setup();
    await saveProject(d1, bucket, input());
    sqlite.exec(`delete from "user" where "id" = 'u1'`);
    expect(sqlite.prepare(`select count(*) as n from "project"`).get()).toEqual(
      { n: 0 },
    );
    expect(
      sqlite.prepare(`select count(*) as n from "userSync"`).get(),
    ).toEqual({ n: 0 });
  });
});

const DAY = 24 * 60 * 60 * 1000;

describe('the Trash', () => {
  it('keeps a deleted project’s data for TRASH_DAYS, and restores it by a save', async () => {
    const { d1, bucket } = setup();
    const t0 = Date.parse('2026-01-01T00:00:00Z');
    await saveProject(d1, bucket, input({ title: 'Doomed' }), t0);
    await deleteProject(d1, 'u1', 'p1', 1, t0);

    expect(await listTrash(d1, 'u1', t0)).toEqual([
      { id: 'p1', rev: 2, title: 'Doomed', deletedAt: t0, sizeBytes: 6 },
    ]);
    const trashed = await getTrashedProjectData(d1, bucket, 'u1', 'p1', t0);
    expect(await text(trashed?.body)).toBe('Doomed');
    // Not a normal download, and not someone else's
    expect(await getProjectData(d1, bucket, 'u1', 'p1')).toBeNull();
    expect(await listTrash(d1, 'u2', t0)).toEqual([]);

    // Past TRASH_DAYS it's gone from the list, even before cleanup runs
    const late = t0 + TRASH_DAYS * DAY + 1;
    expect(await listTrash(d1, 'u1', late)).toEqual([]);
    expect(
      await getTrashedProjectData(d1, bucket, 'u1', 'p1', late),
    ).toBeNull();

    // Restoring is a save over the deletion
    await saveProject(d1, bucket, input({ baseRev: 2, title: 'Doomed' }), t0);
    expect(await listTrash(d1, 'u1', t0)).toEqual([]);
  });

  it('deletes for good, one or all, leaving the deletion records', async () => {
    const { d1, bucket, objects } = setup();
    for (const id of ['a', 'b', 'c'])
      await saveProject(d1, bucket, input({ projectId: id }));
    await deleteProject(d1, 'u1', 'a', 1);
    await deleteProject(d1, 'u1', 'b', 2);
    expect(objects.size).toBe(3);

    expect(await purgeTrash(d1, bucket, 'u1', 'a')).toBe(1);
    expect((await listTrash(d1, 'u1')).map((t) => t.id)).toEqual(['b']);
    expect(objects.size).toBe(2);

    expect(await purgeTrash(d1, bucket, 'u1', null)).toBe(1);
    expect(await listTrash(d1, 'u1')).toEqual([]);
    expect(objects.size).toBe(1);
    // Other devices still learn the projects were deleted
    const changes = await listChanges(d1, 'u1', 0, 100);
    expect(
      !changes.fullResyncRequired && changes.changes.map((c) => c.deleted),
    ).toEqual([false, true, true]);
  });

  it('cleanup deletes kept data past TRASH_DAYS', async () => {
    const { d1, bucket, objects } = setup();
    const t0 = Date.parse('2026-01-01T00:00:00Z');
    await saveProject(d1, bucket, input(), t0);
    await deleteProject(d1, 'u1', 'p1', 1, t0);
    await cleanUpUserSync(d1, bucket, 'u1', t0 + TRASH_DAYS * DAY + 1);
    expect(objects.size).toBe(0);
  });
});

const palette = (overrides: Partial<PaletteInput> = {}): PaletteInput => ({
  name: 'Dusk',
  code: 'palette:ff0000',
  createdAt: 1000,
  updatedAt: 1000,
  deletedAt: null,
  purged: false,
  ...overrides,
});

describe('savePalette', () => {
  it('saves newer changes, and keeps the account’s copy over older ones', async () => {
    const { d1 } = setup();
    expect(await savePalette(d1, 'u1', 'x', palette())).toMatchObject({
      status: 'saved',
      palette: { id: 'x', rev: 1, name: 'Dusk', purged: false },
    });
    const renamed = await savePalette(
      d1,
      'u1',
      'x',
      palette({ name: 'Dawn', updatedAt: 2000 }),
    );
    expect(renamed).toMatchObject({
      status: 'saved',
      palette: { rev: 2, name: 'Dawn' },
    });
    // An older change from a device that was offline
    expect(
      await savePalette(
        d1,
        'u1',
        'x',
        palette({ name: 'Old', updatedAt: 1500 }),
      ),
    ).toMatchObject({ status: 'kept', palette: { rev: 2, name: 'Dawn' } });
  });

  it('never changes a purged palette again', async () => {
    const { d1 } = setup();
    await savePalette(d1, 'u1', 'x', palette());
    const purged = await savePalette(
      d1,
      'u1',
      'x',
      palette({ updatedAt: 2000, deletedAt: 2000, purged: true }),
    );
    expect(purged).toMatchObject({
      status: 'saved',
      palette: { purged: true, code: '', name: '' },
    });
    expect(
      await savePalette(d1, 'u1', 'x', palette({ updatedAt: 9000 })),
    ).toMatchObject({ status: 'kept', palette: { purged: true, code: '' } });
  });

  it('caps live palettes, not deleted ones', async () => {
    const { d1, sqlite } = setup();
    const insert = sqlite.prepare(
      `insert into "palette" values ('u1', ?, 1, '', 'c', 1, 1, null, null)`,
    );
    for (let i = 0; i < MAX_PALETTES_PER_USER; i++) insert.run(`p${i}`);
    expect(await savePalette(d1, 'u1', 'new', palette())).toEqual({
      status: 'quota',
    });
    expect(
      await savePalette(d1, 'u1', 'new', palette({ deletedAt: 1000 })),
    ).toMatchObject({ status: 'saved' });
  });

  it('shares the changes feed with projects, in revision order', async () => {
    const { d1, bucket } = setup();
    await saveProject(d1, bucket, input({ projectId: 'a' }));
    await savePalette(d1, 'u1', 'x', palette());
    await saveProject(d1, bucket, input({ projectId: 'b' }));

    const first = await listChanges(d1, 'u1', 0, 2);
    expect(first).toMatchObject({
      changes: [{ id: 'a', rev: 1 }],
      palettes: [{ id: 'x', rev: 2 }],
      nextSince: 2,
      hasMore: true,
    });
    expect(await listChanges(d1, 'u1', 2, 2)).toMatchObject({
      changes: [{ id: 'b', rev: 3 }],
      palettes: [],
      hasMore: false,
    });
  });

  it('palette rows go with the user', async () => {
    const { d1, sqlite } = setup();
    await savePalette(d1, 'u1', 'x', palette());
    sqlite.exec(`delete from "user" where "id" = 'u1'`);
    expect(sqlite.prepare(`select count(*) as n from "palette"`).get()).toEqual(
      { n: 0 },
    );
  });
});

describe('savePreferences', () => {
  it('takes the newer change to each preference, in the changes feed', async () => {
    const { d1, bucket } = setup();
    expect(
      await savePreferences(d1, 'u1', {
        'theme.id': { value: 'rocket', updatedAt: 10 },
        defaultYarn: { value: 'a-b', updatedAt: 10 },
      }),
    ).toMatchObject({ rev: 1 });
    await saveProject(d1, bucket, input({ projectId: 'a' }));

    const merged = await savePreferences(d1, 'u1', {
      'theme.id': { value: 'modern', updatedAt: 5 },
      defaultYarn: { value: 'c-d', updatedAt: 20 },
    });
    expect(merged).toEqual({
      rev: 3,
      values: {
        'theme.id': { value: 'rocket', updatedAt: 10 },
        defaultYarn: { value: 'c-d', updatedAt: 20 },
      },
    });

    // Nothing newer: no new revision
    expect(
      await savePreferences(d1, 'u1', {
        defaultYarn: { value: 'x-y', updatedAt: 20 },
      }),
    ).toMatchObject({ rev: 3 });

    expect(await listChanges(d1, 'u1', 0, 10)).toMatchObject({
      changes: [{ id: 'a', rev: 2 }],
      preferences: merged,
      nextSince: 3,
    });
    expect(
      (await listChanges(d1, 'u1', 3, 10)) as { preferences?: unknown },
    ).toMatchObject({ preferences: undefined });
  });

  it('preference rows go with the user', async () => {
    const { d1, sqlite } = setup();
    await savePreferences(d1, 'u1', {
      defaultYarn: { value: 'a-b', updatedAt: 1 },
    });
    sqlite.exec(`delete from "user" where "id" = 'u1'`);
    expect(
      sqlite.prepare(`select count(*) as n from "userPreferences"`).get(),
    ).toEqual({ n: 0 });
  });
});
