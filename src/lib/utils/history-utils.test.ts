// Copyright (c) 2024 - 2026, Thomas (https://github.com/jdvlpr)
//
// This file is part of Temperature-Blanket-Web-App.
//
// Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
// under the terms of the GNU General Public License as published by the Free Software Foundation,
// either version 3 of the License, or (at your option) any later version.
//
// Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
// without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
// See the GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App.
// If not, see <https://www.gnu.org/licenses/>.

import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockProject,
  mockPreviews,
  mockWeather,
  mockPreferences,
  mockLocations,
  mockToast,
  mockGauges,
} = vi.hoisted(() => ({
  mockProject: {
    history: {
      current: '',
      previous: '',
      next: '',
      isFirst: false,
      isLast: false,
      isUpdating: false,
      undo: vi.fn(),
      redo: vi.fn(),
      push: vi.fn(),
    },
    url: { hash: '' },
    status: { saved: false },
  },
  mockPreviews: {
    all: [{ id: 'rows' }, { id: 'clnr' }] as any[],
    active: undefined as any,
    load: vi.fn(),
  },
  mockWeather: {
    grouping: 'day' as string,
    monthGroupingStartDay: undefined as number | undefined,
    setGrouping: vi.fn((g: string) => {
      mockWeather.grouping = g;
    }),
    data: [] as any[],
    source: { name: '', useSecondary: false },
  },
  mockPreferences: {
    value: { units: 'imperial', seasons: [] as any[] },
  },
  mockLocations: { allValid: true },
  mockToast: { trigger: vi.fn() },
  mockGauges: {
    allGaugesAttributes: [] as any[],
    gauges: {
      addById: vi.fn(),
      remove: vi.fn(),
      allCreated: [] as any[],
      getSnapshot: vi.fn(),
    },
  },
}));

vi.mock('$app/environment', () => ({ browser: true }));

vi.mock('$lib/state/gauges-state.svelte', () => ({
  allGaugesAttributes: mockGauges.allGaugesAttributes,
  gauges: mockGauges.gauges,
}));

vi.mock('$lib/state/location-state.svelte', () => ({
  locations: mockLocations,
}));

vi.mock('$lib/state/preview-state.svelte', () => ({
  previews: mockPreviews,
}));

vi.mock('$lib/state/project-state.svelte', () => ({
  project: mockProject,
}));

vi.mock('$lib/state/page-state.svelte', () => ({
  toast: mockToast,
}));

vi.mock('$lib/state/weather-state.svelte', () => ({
  weather: mockWeather,
}));

vi.mock('$lib/storage/preferences.svelte', () => ({
  preferences: mockPreferences,
}));

// Only `parseGaugeURLHash` is used by history-utils, and the real module
// transitively pulls in the full yarn colorway dataset via ensureYarnData -
// stub it out rather than loading that for a test that keeps gauges empty.
vi.mock('$lib/utils/load-project-utils.svelte', () => ({
  parseGaugeURLHash: vi.fn(),
}));

vi.mock('$lib/utils/seasons-utils.svelte', () => ({
  seasonsFromUrlHash: vi.fn(),
}));

const { loadFromHistory, updateHistory } =
  await import('./history-utils.svelte');

describe('loadFromHistory - preview switching', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPreviews.all = [{ id: 'rows' }, { id: 'clnr' }];
    mockWeather.grouping = 'day';
  });

  it('lazy-loads and activates the preview named in the history state being restored', async () => {
    const fakeRowsInstance = { id: 'rows', load: vi.fn() };
    mockPreviews.load.mockResolvedValue(fakeRowsInstance);

    mockProject.history.current = '&clnr=1';
    mockProject.history.previous = '&rows=1';

    await loadFromHistory({ action: 'Undo' });

    expect(mockProject.history.undo).toHaveBeenCalledOnce();
    expect(mockPreviews.load).toHaveBeenCalledExactlyOnceWith('rows');
    expect(fakeRowsInstance.load).toHaveBeenCalledExactlyOnceWith('1');
    expect(mockToast.trigger).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        message: expect.stringContaining('Undo: Preview'),
      }),
    );
  });

  it('does not reload the preview when the target history state names the same preview value', async () => {
    mockProject.history.current = '&clnr=1';
    mockProject.history.next = '&clnr=1';

    await loadFromHistory({ action: 'Redo' });

    expect(mockProject.history.redo).toHaveBeenCalledOnce();
    expect(mockPreviews.load).not.toHaveBeenCalled();
  });
});

describe('updateHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mutate in place - the mocked `gauges-state.svelte` module binds this
    // array reference once, so reassigning `mockGauges.allGaugesAttributes`
    // wouldn't be visible to `updateHistory`'s import of it.
    mockGauges.allGaugesAttributes.length = 0;
    mockGauges.allGaugesAttributes.push({ id: 'temp' });
    mockLocations.allValid = true;
    mockWeather.data = [{}];
    mockProject.url.hash = '';
  });

  it('pushes a live value that matches the stale "next" (redo) entry, not just a brand new value', () => {
    // After an Undo, `next` points at the entry that's about to be discarded
    // if the user makes a new edit instead of redoing. If the new edit's
    // hash happens to coincide with that stale entry, it must still be
    // pushed - otherwise the edit is silently dropped and Undo stays stuck.
    mockProject.url.hash = 'l=1&temp=b';
    mockProject.history.current = '&temp=a';
    mockProject.history.previous = null;
    mockProject.history.next = '&temp=b';

    updateHistory();

    expect(mockProject.history.push).toHaveBeenCalledExactlyOnceWith('&temp=b');
  });

  it('does not push a live value that matches current', () => {
    mockProject.url.hash = 'l=1&temp=a';
    mockProject.history.current = '&temp=a';
    mockProject.history.previous = null;
    mockProject.history.next = null;

    updateHistory();

    expect(mockProject.history.push).not.toHaveBeenCalled();
  });
});
