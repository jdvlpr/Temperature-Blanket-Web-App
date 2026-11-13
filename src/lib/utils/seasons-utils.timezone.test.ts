// Seasons must match the same days in every timezone. Weather days are UTC
// midnight, which west of UTC is the evening before, so pin one there.
process.env.TZ = 'America/Los_Angeles';

import { describe, expect, it, vi } from 'vitest';
import { isDateInRange } from './seasons-utils.svelte';

vi.mock('#lib/state/preview-state.svelte.js', () => ({
  previews: { active: null },
}));
vi.mock('#lib/storage/preferences.svelte.js', () => ({
  preferences: { value: { seasons: [] } },
}));

const day = (iso: string) => new Date(`${iso}T00:00:00Z`);

describe('isDateInRange west of UTC', () => {
  it('puts a season’s first and last days inside it', () => {
    expect(isDateInRange(day('2025-03-01'), '03-01', '05-31')).toBe(true);
    expect(isDateInRange(day('2025-05-31'), '03-01', '05-31')).toBe(true);
    expect(isDateInRange(day('2025-06-01'), '03-01', '05-31')).toBe(false);
    expect(isDateInRange(day('2025-02-28'), '03-01', '05-31')).toBe(false);
  });

  it('keeps days apart across daylight saving time', () => {
    // US clocks change Mar 9, 2025; a season starting the day after must not take it
    expect(isDateInRange(day('2025-03-09'), '03-10', '05-31')).toBe(false);
    expect(isDateInRange(day('2025-03-10'), '03-10', '05-31')).toBe(true);
  });
});
