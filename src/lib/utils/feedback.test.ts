import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  preferences: { value: {} as Record<string, unknown> },
  reducedMotion: { current: false },
}));

vi.mock('$app/environment', () => ({ browser: true }));
vi.mock('$lib/storage/preferences.svelte', () => ({
  DEFAULT_EFFECTS: { sound: false, haptics: true, motion: 'system' },
  preferences: mocks.preferences,
}));
vi.mock('svelte/motion', () => ({
  prefersReducedMotion: mocks.reducedMotion,
}));

import {
  canVibrate,
  dragConsiderFeedback,
  feedback,
  getEffects,
  motion,
  motionDuration,
  setEffect,
} from './feedback.svelte';

let vibrate: ReturnType<typeof vi.fn>;
let createOscillator: ReturnType<typeof vi.fn>;

function stubDevice({ coarsePointer }: { coarsePointer: boolean }) {
  vibrate = vi.fn();
  vi.stubGlobal('navigator', { vibrate });
  vi.stubGlobal('window', {
    matchMedia: (query: string) => ({
      matches: query === '(pointer: coarse)' ? coarsePointer : false,
    }),
    AudioContext: class {
      state = 'running';
      currentTime = 0;
      destination = {};
      createOscillator = createOscillator;
      createGain = () => ({
        gain: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn((node) => node),
      });
    },
  });
}

beforeEach(() => {
  mocks.preferences.value = {};
  mocks.reducedMotion.current = false;
  createOscillator = vi.fn(() => ({
    type: 'sine',
    frequency: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn((node) => node),
    start: vi.fn(),
    stop: vi.fn(),
  }));
  stubDevice({ coarsePointer: true });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('effects preferences', () => {
  it('fills in defaults when nothing is saved', () => {
    expect(getEffects()).toEqual({
      sound: false,
      haptics: true,
      motion: 'system',
    });
  });

  it('keeps saved settings and fills in the rest', () => {
    mocks.preferences.value = { effects: { sound: true } };
    expect(getEffects()).toEqual({
      sound: true,
      haptics: true,
      motion: 'system',
    });
  });

  it('saves one setting without dropping the others', () => {
    setEffect('motion', 'reduce');
    expect(mocks.preferences.value.effects).toEqual({
      sound: false,
      haptics: true,
      motion: 'reduce',
    });
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

describe('feedback', () => {
  it('vibrates on touch devices when vibration is on', () => {
    feedback('drop');
    expect(vibrate).toHaveBeenCalledOnce();
  });

  it("doesn't vibrate on desktop, where browsers ignore it", () => {
    stubDevice({ coarsePointer: false });
    expect(canVibrate()).toBe(false);
    feedback('drop');
    expect(vibrate).not.toHaveBeenCalled();
  });

  it("doesn't vibrate when vibration is off", () => {
    setEffect('haptics', false);
    feedback('drop');
    expect(vibrate).not.toHaveBeenCalled();
  });

  it('is silent unless sounds are on', () => {
    feedback('success');
    expect(createOscillator).not.toHaveBeenCalled();
    setEffect('sound', true);
    feedback('success');
    expect(createOscillator).toHaveBeenCalledTimes(2); // two notes
  });
});

describe('drag feedback', () => {
  const items = (...ids: number[]) => ids.map((id) => ({ id }));

  it('picks up on drag start, then ticks only when the color moves to a new spot', () => {
    dragConsiderFeedback(items(0, 1, 2), { trigger: 'dragStarted', id: '1' });
    expect(vibrate).toHaveBeenCalledTimes(1);

    // Pointer moves within the same spot
    dragConsiderFeedback(items(0, 1, 2), {
      trigger: 'draggedOverIndex',
      id: '1',
    });
    expect(vibrate).toHaveBeenCalledTimes(1);

    // Moves into a new spot
    dragConsiderFeedback(items(1, 0, 2), {
      trigger: 'draggedOverIndex',
      id: '1',
    });
    expect(vibrate).toHaveBeenCalledTimes(2);

    // Leaves the palette, then comes back to the same spot
    dragConsiderFeedback(items(0, 2), { trigger: 'draggedLeftAll', id: '1' });
    dragConsiderFeedback(items(1, 0, 2), {
      trigger: 'draggedEntered',
      id: '1',
    });
    expect(vibrate).toHaveBeenCalledTimes(2);
  });
});
