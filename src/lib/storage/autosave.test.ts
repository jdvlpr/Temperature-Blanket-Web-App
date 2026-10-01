import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  project: {
    url: { href: 'https://x.test/?project=p1#a' },
    status: { saved: false },
  },
  sync: { active: true },
  owner: 'u1' as string | null,
  index: [] as {
    id: string;
    sync?: { ownerUserId: string; updatedAt?: number };
  }[],
  save: vi.fn(async () => null),
}));

vi.mock('$app/navigation', () => ({ replaceState: vi.fn() }));
vi.mock('$lib/state/project-state.svelte', () => ({ project: state.project }));
vi.mock('$lib/sync/status.svelte', () => ({ sync: state.sync }));
vi.mock('$lib/accounts/summary.svelte', () => ({
  account: { summary: { id: 'u1' } },
}));
vi.mock('$lib/storage/projects.svelte', () => ({
  ProjectStorage: {
    syncOwner: () => state.owner,
    getIndex: async () => state.index,
    save: state.save,
  },
}));

import {
  autosave,
  IDLE_MS,
  MAX_WAIT_MS,
  projectChanged,
  projectSaved,
  resetAutosave,
} from './autosave.svelte';

const edit = (hash: string) => {
  state.project.url.href = `https://x.test/?project=p1#${hash}`;
  projectChanged();
};

/** Opens p1 as the account's saved project */
async function open() {
  edit('a');
  await vi.waitFor(() => expect(autosave.on).toBe(true));
}

describe('autosave', () => {
  beforeEach(() => {
    resetAutosave();
    state.owner = 'u1';
    state.sync.active = true;
    state.index = [{ id: 'p1', sync: { ownerUserId: 'u1' } }];
    state.project.status.saved = false;
    state.save.mockClear();
  });
  afterEach(() => vi.useRealTimers());

  it('opening a saved project is not a change, and counts as saved', async () => {
    await open();
    expect(state.save).not.toHaveBeenCalled();
    expect(state.project.status.saved).toBe(true);
  });

  it('saves once, a moment after editing stops', async () => {
    await open();
    vi.useFakeTimers();
    edit('b');
    expect(autosave.state).toBe('waiting');
    await vi.advanceTimersByTimeAsync(IDLE_MS - 100);
    edit('c');
    await vi.advanceTimersByTimeAsync(IDLE_MS - 100);
    expect(state.save).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(200);
    expect(state.save).toHaveBeenCalledTimes(1);
    expect(autosave.state).toBe('saved');
    expect(state.project.status.saved).toBe(true);
  });

  it('while edits keep coming, still saves every so often', async () => {
    await open();
    vi.useFakeTimers();
    for (let t = 0; t <= MAX_WAIT_MS; t += IDLE_MS / 2) {
      edit(`e${t}`);
      await vi.advanceTimersByTimeAsync(IDLE_MS / 2);
    }
    expect(state.save).toHaveBeenCalledTimes(1);
  });

  it('undoing back to the saved project saves nothing', async () => {
    await open();
    vi.useFakeTimers();
    edit('b');
    edit('a');
    await vi.advanceTimersByTimeAsync(IDLE_MS * 2);
    expect(state.save).not.toHaveBeenCalled();
    expect(autosave.state).toBe('saved');
  });

  it('weather edits save even though the link is unchanged', async () => {
    await open();
    vi.useFakeTimers();
    projectChanged({ weather: true });
    await vi.advanceTimersByTimeAsync(IDLE_MS);
    expect(state.save).toHaveBeenCalledTimes(1);
  });

  it('leaves new projects and projects only in this browser alone', async () => {
    state.index = [{ id: 'p1' }];
    edit('a');
    await Promise.resolve();
    vi.useFakeTimers();
    edit('b');
    await vi.advanceTimersByTimeAsync(IDLE_MS * 2);
    expect(autosave.on).toBe(false);
    expect(state.save).not.toHaveBeenCalled();

    resetAutosave();
    state.index = [];
    edit('a');
    edit('b');
    await vi.advanceTimersByTimeAsync(IDLE_MS * 2);
    expect(state.save).not.toHaveBeenCalled();
  });

  it('after the first Save, later changes save by themselves', async () => {
    state.index = [];
    edit('a');
    await Promise.resolve();
    // Save stores it in the account
    state.index = [{ id: 'p1', sync: { ownerUserId: 'u1' } }];
    projectSaved();
    await vi.waitFor(() => expect(autosave.on).toBe(true));
    vi.useFakeTimers();
    edit('b');
    await vi.advanceTimersByTimeAsync(IDLE_MS);
    expect(state.save).toHaveBeenCalledTimes(1);
  });

  it('not signed in: nothing saves', async () => {
    state.owner = null;
    edit('a');
    await Promise.resolve();
    vi.useFakeTimers();
    edit('b');
    await vi.advanceTimersByTimeAsync(IDLE_MS * 2);
    expect(state.save).not.toHaveBeenCalled();
  });

  it('stops rather than overwrite a newer version from another device', async () => {
    state.index = [{ id: 'p1', sync: { ownerUserId: 'u1', updatedAt: 1 } }];
    await open();
    // A sync brings in the other device's edit
    state.index = [{ id: 'p1', sync: { ownerUserId: 'u1', updatedAt: 2 } }];
    vi.useFakeTimers();
    edit('b');
    await vi.advanceTimersByTimeAsync(IDLE_MS * 2);
    expect(state.save).not.toHaveBeenCalled();
    expect(autosave.state).toBe('conflict');
    expect(state.project.status.saved).toBe(false);
  });

  it('its own saves are not mistaken for another device', async () => {
    state.index = [{ id: 'p1', sync: { ownerUserId: 'u1', updatedAt: 1 } }];
    state.save.mockImplementation(async () => {
      state.index = [{ id: 'p1', sync: { ownerUserId: 'u1', updatedAt: 5 } }];
      return null;
    });
    await open();
    vi.useFakeTimers();
    edit('b');
    await vi.advanceTimersByTimeAsync(IDLE_MS);
    edit('c');
    await vi.advanceTimersByTimeAsync(IDLE_MS);
    expect(state.save).toHaveBeenCalledTimes(2);
    expect(autosave.state).toBe('saved');
    state.save.mockImplementation(async () => null);
  });

  it('opening another project starts over rather than saving it', async () => {
    await open();
    vi.useFakeTimers();
    state.index.push({ id: 'p2', sync: { ownerUserId: 'u1' } });
    state.project.url.href = 'https://x.test/?project=p2#z';
    projectChanged();
    await vi.advanceTimersByTimeAsync(IDLE_MS * 2);
    expect(state.save).not.toHaveBeenCalled();
  });
});
