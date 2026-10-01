import type { SavedPalette } from '$lib/storage/palettes.svelte';
import type { StoredProject } from '$lib/storage/projects.svelte';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  rehomeHref,
  syncAccount,
  unchangedSince,
  type Seen,
  SyncHttpError,
  type AccountSyncState,
  type LocalStore,
  type PaletteLocal,
  type ProjectSyncState,
  type SyncServer,
} from './engine';
import type { PaletteRecord, ProjectMeta } from './protocol';

// An in-memory server with the same rules as src/lib/server/sync/store.ts
class FakeServer {
  rev = 0;
  minValidRev = 0;
  rows = new Map<string, ProjectMeta & { json: string | null }>();
  failNext: SyncHttpError | null = null;
  quotaFor = new Set<string>();

  purgeDeletions() {
    for (const [id, row] of this.rows)
      if (row.deleted) {
        this.minValidRev = Math.max(this.minValidRev, row.rev);
        this.rows.delete(id);
      }
  }

  private meta(id: string): ProjectMeta | null {
    const row = this.rows.get(id);
    if (!row) return null;
    const meta: Partial<typeof row> = { ...row };
    delete meta.json;
    return meta as ProjectMeta;
  }

  api(): SyncServer {
    const check = () => {
      const failure = this.failNext;
      this.failNext = null;
      if (failure) throw failure;
    };
    return {
      changes: async (since) => {
        check();
        if (since > 0 && since < this.minValidRev)
          return { fullResyncRequired: true, rev: this.rev };
        const changes = [...this.rows.keys()]
          .map((id) => this.meta(id)!)
          .filter((m) => m.rev > since)
          .sort((a, b) => a.rev - b.rev);
        // Pages of two, to exercise paging
        const page = changes.slice(0, 2);
        return {
          fullResyncRequired: false,
          changes: page,
          nextSince: page.at(-1)?.rev ?? since,
          hasMore: changes.length > 2,
        };
      },
      download: async (id) => {
        check();
        const row = this.rows.get(id);
        return row?.json ? { rev: row.rev, json: row.json } : null;
      },
      upload: async (id, upload) => {
        check();
        if (this.quotaFor.has(id))
          throw new SyncHttpError(413, 'QUOTA_EXCEEDED', 'Quota');
        const rev = ++this.rev;
        const row = this.rows.get(id);
        const ok = upload.baseRev === null ? !row : row?.rev === upload.baseRev;
        if (!ok) return { ok: false, current: this.meta(id) };
        this.rows.set(id, {
          id,
          rev,
          deleted: false,
          title: upload.title,
          sizeBytes: upload.json.length,
          schemaVersion: 1,
          clientUpdatedAt: upload.clientUpdatedAt,
          serverUpdatedAt: 0,
          contentHash: upload.contentHash,
          json: upload.json,
        });
        return { ok: true, meta: this.meta(id)! };
      },
      remove: async (id, baseRev) => {
        check();
        const rev = ++this.rev;
        const row = this.rows.get(id);
        if (!row || row.deleted) return { ok: true };
        if (row.rev !== baseRev) return { ok: false, current: this.meta(id)! };
        this.rows.set(id, {
          ...row,
          rev,
          deleted: true,
          json: null,
          contentHash: null,
        });
        return { ok: true };
      },
    };
  }
}

// One browser's saved projects
class FakeDevice implements LocalStore {
  projects = new Map<
    string,
    { project: StoredProject; sync?: ProjectSyncState }
  >();
  states = new Map<string, AccountSyncState>();
  clock = 1000;

  constructor(
    public origin: string,
    public server: FakeServer,
    public userId = 'u1',
  ) {}

  async list() {
    return [...this.projects].map(([id, { sync }]) => ({ id, sync }));
  }
  async read(id: string) {
    return this.projects.get(id)?.project ?? null;
  }
  async put(
    id: string,
    project: StoredProject,
    sync: ProjectSyncState,
    seen: Seen,
  ) {
    if (!unchangedSince(await this.item(id), seen)) return false;
    this.projects.set(id, { project: structuredClone(project), sync });
    return true;
  }
  private async item(id: string) {
    const item = this.projects.get(id);
    return item && { id, sync: item.sync };
  }
  async updateSync(
    id: string,
    update: (s: ProjectSyncState | undefined) => ProjectSyncState,
  ) {
    const item = this.projects.get(id);
    if (item) item.sync = update(item.sync);
  }
  async remove(id: string, seen: Seen) {
    const item = await this.item(id);
    if (!item || !unchangedSince(item, seen)) return false;
    this.projects.delete(id);
    return true;
  }
  async accountState(userId: string) {
    return this.states.get(userId) ?? { since: 0, pendingDeletes: [] };
  }
  async setAccountState(userId: string, state: AccountSyncState) {
    this.states.set(userId, structuredClone(state));
  }

  /** Saves a project as the app does: changed, owned by the signed-in account. */
  edit(id: string, title: string, owner: string | null = this.userId) {
    const existing = this.projects.get(id);
    this.clock += 1000;
    this.projects.set(id, {
      project: {
        ...projectFixture(id, this.origin),
        ...existing?.project,
        title,
      },
      sync: owner
        ? {
            ownerUserId: owner,
            rev: existing?.sync?.rev ?? null,
            dirty: true,
            updatedAt: this.clock,
            lastSyncedAt: existing?.sync?.lastSyncedAt ?? null,
            error: null,
          }
        : undefined,
    });
  }

  /** Deletes a project as the app does: synced ones go in the outbox. */
  async delete(id: string) {
    const sync = this.projects.get(id)?.sync;
    this.projects.delete(id);
    if (sync?.rev != null) {
      const state = await this.accountState(sync.ownerUserId);
      state.pendingDeletes.push({ id, baseRev: sync.rev });
      await this.setAccountState(sync.ownerUserId, state);
    }
  }

  sync() {
    let n = 0;
    return syncAccount(this.userId, this, this.server.api(), {
      origin: this.origin,
      sha256,
      now: () => (this.clock += 1),
      newId: () => `copy-${this.origin.length}-${++n}`,
    });
  }

  titles() {
    return Object.fromEntries(
      [...this.projects].map(([id, { project }]) => [id, project.title]),
    );
  }

  status(id: string) {
    const sync = this.projects.get(id)?.sync;
    if (!sync) return 'device-only';
    if (sync.error) return 'error';
    return sync.dirty ? 'waiting' : 'synced';
  }
}

const sha256 = async (text: string) =>
  createHash('sha256').update(text).digest('hex');

const projectFixture = (id: string, origin: string): StoredProject => ({
  createdAt: '2026-01-01T00:00:00.000Z',
  date: 'saved',
  href: `${origin}/?project=${id}#l=Somewhere`,
  isCustomWeatherData: true,
  title: '',
  weatherData: [],
  weatherSource: { name: 'Meteostat', useSecondary: false } as never,
});

function twoDevices() {
  const server = new FakeServer();
  return {
    server,
    phone: new FakeDevice('https://phone.example', server),
    laptop: new FakeDevice('https://laptop.example.test', server),
  };
}

describe('syncAccount', () => {
  it('copies projects between devices, on the device’s own site', async () => {
    const { phone, laptop } = twoDevices();
    phone.edit('a', 'Toronto 2026');
    phone.edit('b', 'Oslo 2025');
    phone.edit('c', 'Lima 2024');

    expect((await phone.sync()).uploaded).toEqual(['a', 'b', 'c']);
    expect(phone.status('a')).toBe('synced');

    const report = await laptop.sync();
    expect(report.downloaded.sort()).toEqual(['a', 'b', 'c']);
    expect(laptop.titles()).toEqual(phone.titles());
    expect((await laptop.read('a'))?.href).toBe(
      'https://laptop.example.test/?project=a#l=Somewhere',
    );
    expect(laptop.status('a')).toBe('synced');

    // Nothing to do the second time
    expect(await laptop.sync()).toMatchObject({ uploaded: [], downloaded: [] });
  });

  it('brings edits across', async () => {
    const { phone, laptop } = twoDevices();
    phone.edit('a', 'Draft');
    await phone.sync();
    await laptop.sync();
    laptop.edit('a', 'Final');
    await laptop.sync();
    expect((await phone.sync()).downloaded).toEqual(['a']);
    expect(phone.titles()).toEqual({ a: 'Final' });
  });

  it('keeps when a project was last edited, so every device lists it alike', async () => {
    const { phone, laptop } = twoDevices();
    phone.edit('a', 'Older');
    phone.edit('b', 'Newer');
    await phone.sync();
    // The laptop downloads much later
    laptop.clock = 1_000_000;
    await laptop.sync();
    for (const id of ['a', 'b'])
      expect(laptop.projects.get(id)?.sync?.updatedAt).toBe(
        phone.projects.get(id)?.sync?.updatedAt,
      );
  });

  it('keeps both versions when both devices changed a project', async () => {
    const { phone, laptop } = twoDevices();
    phone.edit('a', 'Original');
    await phone.sync();
    await laptop.sync();

    phone.edit('a', 'Phone version');
    laptop.edit('a', 'Laptop version');
    await phone.sync();
    const report = await laptop.sync();

    expect(report.copies).toHaveLength(1);
    const copyId = report.copies[0];
    expect(laptop.titles()).toEqual({
      a: 'Phone version',
      [copyId]: expect.stringMatching(
        /^Laptop version \(copy from this device, .+\)$/,
      ),
    });
    expect((await laptop.read(copyId))?.href).toContain(`project=${copyId}`);
    // The copy was uploaded in the same pass
    expect(laptop.status(copyId)).toBe('synced');

    await phone.sync();
    expect(phone.titles()).toEqual(laptop.titles());
  });

  it('lists a named project by its name, and marks a copy on the name', async () => {
    const { server, phone, laptop } = twoDevices();
    phone.edit('a', 'Lisbon, 2025');
    phone.projects.get('a')!.project.name = 'Gift Blanket';
    await phone.sync();
    expect(server.rows.get('a')?.title).toBe('Gift Blanket');
    await laptop.sync();

    phone.edit('a', 'Lisbon, 2025');
    laptop.edit('a', 'Lisbon, 2026');
    await phone.sync();
    const report = await laptop.sync();

    const copy = await laptop.read(report.copies[0]);
    expect(copy?.name).toMatch(/^Gift Blanket \(copy from this device, .+\)$/);
    expect(copy?.title).toBe('Lisbon, 2026');
  });

  it('keeps one copy when both devices made the same change', async () => {
    const { phone, laptop } = twoDevices();
    phone.edit('a', 'Original');
    await phone.sync();
    await laptop.sync();
    phone.edit('a', 'Same');
    laptop.edit('a', 'Same');
    await phone.sync();
    expect((await laptop.sync()).copies).toEqual([]);
    expect(laptop.status('a')).toBe('synced');
  });

  it('keeps both versions after a lost race to create the same project', async () => {
    const { phone, laptop } = twoDevices();
    phone.edit('a', 'Phone');
    laptop.edit('a', 'Laptop');
    await phone.sync();
    const report = await laptop.sync();
    expect(Object.values(laptop.titles()).sort()).toEqual([
      expect.stringMatching(/^Laptop \(copy/),
      'Phone',
    ]);
    expect(report.copies).toHaveLength(1);
  });

  it('removes projects deleted on another device', async () => {
    const { phone, laptop } = twoDevices();
    phone.edit('a', 'Doomed');
    phone.edit('b', 'Kept');
    await phone.sync();
    await laptop.sync();

    await phone.delete('a');
    await phone.sync();
    expect((await phone.accountState('u1')).pendingDeletes).toEqual([]);
    expect((await laptop.sync()).removed).toEqual(['a']);
    expect(laptop.titles()).toEqual({ b: 'Kept' });
  });

  it('lets an edit beat a deletion, whichever syncs first', async () => {
    // The deletion reaches the server first
    const first = twoDevices();
    first.phone.edit('a', 'v1');
    await first.phone.sync();
    await first.laptop.sync();
    await first.phone.delete('a');
    first.laptop.edit('a', 'Edited after all');
    await first.phone.sync();
    await first.laptop.sync();
    await first.phone.sync();
    expect(first.phone.titles()).toEqual({ a: 'Edited after all' });
    expect(first.laptop.status('a')).toBe('synced');

    // The edit reaches the server first
    const second = twoDevices();
    second.phone.edit('a', 'v1');
    await second.phone.sync();
    await second.laptop.sync();
    await second.phone.delete('a');
    second.laptop.edit('a', 'Edited after all');
    await second.laptop.sync();
    await second.phone.sync();
    expect(second.phone.titles()).toEqual({ a: 'Edited after all' });
  });

  it('compares everything after missing purged deletion records', async () => {
    const { server, phone, laptop } = twoDevices();
    phone.edit('gone', 'Deleted long ago');
    phone.edit('edited', 'Edited offline');
    phone.edit('kept', 'Kept');
    await phone.sync();
    await laptop.sync();

    laptop.edit('edited', 'Edited offline, again');
    await phone.delete('gone');
    await phone.delete('edited');
    await phone.sync();
    server.purgeDeletions();

    await laptop.sync();
    expect(Object.keys(laptop.titles()).sort()).toEqual(['edited', 'kept']);
    expect(server.rows.get('edited')).toMatchObject({ deleted: false });
  });

  it('marks a project over quota and carries on with the rest', async () => {
    const { server, phone } = twoDevices();
    phone.edit('big', 'Too much');
    phone.edit('ok', 'Fine');
    server.quotaFor.add('big');
    const report = await phone.sync();
    expect(report.failed).toEqual([{ id: 'big', code: 'QUOTA_EXCEEDED' }]);
    expect(phone.status('big')).toBe('error');
    expect(phone.status('ok')).toBe('synced');
  });

  it('stops when sync is paused or the session ended, keeping local work', async () => {
    const { server, phone } = twoDevices();
    phone.edit('a', 'Unsynced');
    server.failNext = new SyncHttpError(503, 'SYNC_PAUSED', 'Paused');
    await expect(phone.sync()).rejects.toMatchObject({ code: 'SYNC_PAUSED' });
    server.failNext = new SyncHttpError(401, undefined, 'Not signed in');
    await expect(phone.sync()).rejects.toMatchObject({ status: 401 });
    expect(phone.status('a')).toBe('waiting');
    await phone.sync();
    expect(phone.status('a')).toBe('synced');
  });

  it('keeps a project changed while it was uploading marked as changed', async () => {
    const { server, phone } = twoDevices();
    phone.edit('a', 'First');
    const api = server.api();
    const upload = api.upload;
    api.upload = async (id, u) => {
      const result = await upload(id, u);
      phone.edit('a', 'Saved during upload');
      return result;
    };
    await syncAccount('u1', phone, api, { origin: phone.origin, sha256 });
    expect(phone.projects.get('a')?.sync).toMatchObject({
      rev: 1,
      dirty: true,
    });
    await phone.sync();
    expect(server.rows.get('a')?.title).toBe('Saved during upload');
  });

  it('never replaces a project saved while its download was on the way', async () => {
    const { server, phone, laptop } = twoDevices();
    phone.edit('a', 'v1');
    await phone.sync();
    await laptop.sync();
    phone.edit('a', 'v2');
    await phone.sync();

    const api = server.api();
    const download = api.download;
    let edited = false;
    api.download = async (id) => {
      const data = await download(id);
      if (!edited) laptop.edit('a', 'Saved on the laptop meanwhile');
      edited = true;
      return data;
    };
    await syncAccount('u1', laptop, api, { origin: laptop.origin, sha256 });

    // Not overwritten: both changed, so both are kept
    expect(Object.values(laptop.titles()).sort()).toEqual([
      expect.stringMatching(/^Saved on the laptop meanwhile \(copy/),
      'v2',
    ]);
  });

  it('never removes a project saved while its deletion arrived', async () => {
    const { server, phone, laptop } = twoDevices();
    phone.edit('a', 'v1');
    await phone.sync();
    await laptop.sync();
    await phone.delete('a');
    await phone.sync();

    const api = server.api();
    const changes = api.changes;
    let edited = false;
    api.changes = async (since) => {
      const page = await changes(since);
      if (!edited) laptop.edit('a', 'Saved on the laptop meanwhile');
      edited = true;
      return page;
    };
    await syncAccount('u1', laptop, api, { origin: laptop.origin, sha256 });
    expect(laptop.titles()).toEqual({ a: 'Saved on the laptop meanwhile' });
    // And the edit wins over the deletion
    expect(server.rows.get('a')).toMatchObject({ deleted: false });
  });

  it("leaves guest projects and other accounts' projects alone", async () => {
    const { server, phone } = twoDevices();
    phone.edit('guest', 'Guest', null);
    phone.edit('theirs', 'Someone else', 'u2');
    phone.edit('mine', 'Mine');
    expect((await phone.sync()).uploaded).toEqual(['mine']);
    expect([...server.rows.keys()]).toEqual(['mine']);
  });
});

describe('rehomeHref', () => {
  it('moves a link to this site and project', () => {
    expect(
      rehomeHref(
        'https://temperature-blanket.com/?project=1&v=6#g=1',
        'http://localhost:5173',
        '2',
      ),
    ).toBe('http://localhost:5173/?project=2&v=6#g=1');
    expect(rehomeHref('not a url', 'https://x.test', 'a')).toBe(
      'https://x.test/?project=a',
    );
  });
});

describe('syncAccount: palettes and the Trash', () => {
  const record = (id: string, rev: number): PaletteRecord => ({
    id,
    rev,
    name: id,
    code: 'palette:ff0000',
    createdAt: 1,
    updatedAt: 1,
    deletedAt: null,
    purged: false,
  });

  /** One device, an empty project list, and a server with only palettes */
  function setup(serverPalettes: PaletteRecord[] = []) {
    const server = new FakeServer();
    const device = new FakeDevice('https://phone.example', server);
    const calls: string[] = [];
    const api = server.api();
    const local: SavedPalette[] = [];
    const palettes: PaletteLocal = {
      list: async () => local,
      apply: async (_user, records) => {
        calls.push(`apply ${records.map((r) => r.id).join(',')}`);
      },
      settle: async (_user, sent, rec, applied) => {
        calls.push(`settle ${rec.id} ${sent} ${applied}`);
      },
      forgetMissing: async () => {
        calls.push('forget');
      },
    };
    const uploads: string[] = [];
    const sync = (overrides: Partial<SyncServer> = {}) =>
      syncAccount(
        'u1',
        device,
        {
          ...api,
          changes: async (since) => {
            const page = await api.changes(since);
            if (page.fullResyncRequired) return page;
            return {
              ...page,
              palettes: serverPalettes.filter((p) => p.rev > since),
              nextSince: Math.max(
                page.nextSince,
                ...serverPalettes.map((p) => p.rev),
              ),
            };
          },
          uploadPalettes: async (batch) =>
            batch.map(({ id, ...input }) => {
              uploads.push(id);
              return {
                id,
                palette: { ...record(id, 9), ...input },
                applied: true,
              };
            }),
          ...overrides,
        },
        { origin: device.origin, sha256, palettes },
      );
    return { server, device, calls, local, uploads, sync };
  }

  it('takes in the account’s palettes and marks them seen', async () => {
    const { device, calls, sync } = setup([record('a', 3), record('b', 4)]);
    await sync();
    expect(calls).toEqual(['apply a,b']);
    expect((await device.accountState('u1')).since).toBe(4);
    calls.length = 0;
    await sync();
    expect(calls).toEqual([]);
  });

  it('uploads palettes changed here in one request, and one failing doesn’t stop the rest', async () => {
    const { local, calls, uploads, sync } = setup();
    const palette = (id: string, owner = 'u1', dirty = true): SavedPalette => ({
      id,
      name: '',
      code: 'palette:00ff00',
      createdAt: 1,
      updatedAt: 7,
      sync: { ownerUserId: owner, rev: null, dirty },
    });
    local.push(
      palette('bad'),
      palette('good'),
      palette('clean', 'u1', false),
      palette('theirs', 'u2'),
    );
    const report = await sync({
      uploadPalettes: async (batch) =>
        batch.map(({ id, ...input }) => {
          uploads.push(id);
          return id === 'bad'
            ? { id, error: 'INVALID_REQUEST' as const }
            : { id, palette: { ...record(id, 9), ...input }, applied: true };
        }),
    });
    expect(uploads).toEqual(['bad', 'good']);
    expect(calls).toEqual(['settle good 7 true']);
    expect(report.palettesFailed).toEqual(['bad']);
  });

  it('empties a project deleted for good from the account’s Trash once its deletion is sent', async () => {
    const { server, device, sync } = setup();
    device.edit('a', 'Doomed');
    await sync();
    await device.delete('a');
    const state = await device.accountState('u1');
    await device.setAccountState('u1', { ...state, pendingPurges: ['a'] });

    const order: string[] = [];
    const api = server.api();
    await sync({
      remove: async (id, baseRev) => {
        order.push(`remove ${id}`);
        return api.remove(id, baseRev);
      },
      purgeTrashed: async (id) => {
        order.push(`purge ${id}`);
      },
    });
    expect(order).toEqual(['remove a', 'purge a']);
    expect((await device.accountState('u1')).pendingPurges).toEqual([]);
  });
});
