import type { R2Bucket } from '@cloudflare/workers-types';
import { createTestD1 } from '$lib/server/test-d1';
import { describe, expect, it } from 'vitest';
import {
  cleanUpUserSync,
  DELETION_RECORD_TTL_MS,
  deleteProject,
  deleteUserProjectData,
  getProjectData,
  listChanges,
  MAX_BYTES_PER_USER,
  MAX_PROJECTS_PER_USER,
  saveProject,
  type SaveInput,
} from './store';

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
