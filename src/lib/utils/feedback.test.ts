import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  preferences: { value: {} as Record<string, unknown> },
  reducedMotion: { current: false },
}));

vi.mock('$lib/storage/preferences.svelte', () => ({
  DEFAULT_EFFECTS: { motion: 'system' },
  preferences: mocks.preferences,
}));
vi.mock('svelte/motion', () => ({
  prefersReducedMotion: mocks.reducedMotion,
}));

import {
  getEffects,
  motion,
  motionDuration,
  setEffect,
} from './feedback.svelte';

beforeEach(() => {
  mocks.preferences.value = {};
  mocks.reducedMotion.current = false;
});

describe('effects preferences', () => {
  it('fills in defaults when nothing is saved', () => {
    expect(getEffects()).toEqual({ motion: 'system' });
  });

  it('keeps saved settings', () => {
    mocks.preferences.value = { effects: { motion: 'reduce' } };
    expect(getEffects()).toEqual({ motion: 'reduce' });
  });

  it('saves a setting', () => {
    setEffect('motion', 'reduce');
    expect(mocks.preferences.value.effects).toEqual({ motion: 'reduce' });
  });
});

describe('reduced motion', () => {
  it('follows the device by default', () => {
    expect(motion.reduced).toBe(false);
    expect(motionDuration(150)).toBe(150);
    mocks.reducedMotion.current = true;
    expect(motion.reduced).toBe(true);
    expect(motionDuration(150)).toBe(0);
  });

  it('is reduced when chosen in Preferences, whatever the device says', () => {
    setEffect('motion', 'reduce');
    expect(motion.reduced).toBe(true);
  });
});
