import { describe, expect, it, vi } from 'vitest';

const store = new Map<string, string>();
const localStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => void store.set(key, value),
  removeItem: (key: string) => void store.delete(key),
};
const listeners: ((event: StorageEvent) => void)[] = [];
vi.stubGlobal('localStorage', localStorage);
vi.stubGlobal('document', {});
vi.stubGlobal('window', {
  addEventListener: (type: string, listener: (event: StorageEvent) => void) =>
    type === 'storage' && listeners.push(listener),
  removeEventListener: () => {},
});

const { persistedState } = await import('./preferences.svelte');

// Another tab writing it
const fromAnotherTab = (key: string, value: unknown) => {
  const newValue = JSON.stringify(value);
  store.set(key, newValue);
  listeners.forEach((listener) =>
    listener({ storageArea: localStorage, key, newValue } as StorageEvent),
  );
};

// (Effects don't run in these tests, so each value starts out saved already,
// as it would be after its first save on a page)
const saved = <T>(key: string, value: T) => {
  store.set(key, JSON.stringify(value));
  return persistedState(key, value);
};

describe('a held persisted value', () => {
  it('keeps changes in this tab, and writes nothing once put back', () => {
    const units = saved('held-units', { units: 'metric' });
    const set = vi.spyOn(localStorage, 'setItem');

    units.hold();
    units.value = { units: 'imperial' };
    expect(store.get('held-units')).toBe('{"units":"metric"}');

    units.value = { units: 'metric' };
    units.release();
    expect(set).not.toHaveBeenCalled();
    set.mockRestore();
  });

  it('saves what changed in this tab once released', () => {
    const value = saved('held-kept', { n: 1 });
    value.hold();
    value.value = { n: 2 };
    expect(store.get('held-kept')).toBe('{"n":1}');
    value.release();
    expect(store.get('held-kept')).toBe('{"n":2}');
  });

  it("takes another tab's change once released, over this tab's", () => {
    const value = saved('held-incoming', { n: 1 });
    value.hold();
    value.value = { n: 2 };
    fromAnotherTab('held-incoming', { n: 3 });
    expect(value.value).toEqual({ n: 2 });
    value.release();
    expect(value.value).toEqual({ n: 3 });
    expect(store.get('held-incoming')).toBe('{"n":3}');
  });
});
