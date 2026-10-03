// Small, optional sound and vibration feedback for user actions, plus the app-wide reduced motion check.
// Feedback is always an extra: every event here also has a visible change and, where useful, a screen reader announcement.
// Sounds are synthesized with the Web Audio API, so there are no audio files to download.

import { browser } from '$app/environment';
import {
  DEFAULT_EFFECTS,
  preferences,
  type EffectsPreferences,
} from '$lib/storage/preferences.svelte';
import { prefersReducedMotion } from 'svelte/motion';
import { scale } from 'svelte/transition';
import { SHADOW_ITEM_MARKER_PROPERTY_NAME } from 'svelte-dnd-action';

/** The user's effects settings, with defaults filled in */
export function getEffects(): EffectsPreferences {
  return { ...DEFAULT_EFFECTS, ...preferences.value.effects };
}

export function setEffect<K extends keyof EffectsPreferences>(
  key: K,
  value: EffectsPreferences[K],
) {
  preferences.value.effects = { ...getEffects(), [key]: value };
}

/** Reactive: true when the device asks for reduced motion or the user chose "Reduced" in Preferences */
export const motion = {
  get reduced(): boolean {
    return getEffects().motion === 'reduce' || prefersReducedMotion.current;
  },
};

/** A duration in milliseconds, or 0 when motion is reduced */
export function motionDuration(ms: number): number {
  return motion.reduced ? 0 : ms;
}

/** Whether vibration actually does something on this device. Desktop browsers define `navigator.vibrate` but ignore it. */
export function canVibrate(): boolean {
  return (
    browser &&
    typeof navigator.vibrate === 'function' &&
    window.matchMedia('(pointer: coarse)').matches
  );
}

export type FeedbackEvent =
  | 'pickup' // started dragging a color
  | 'tick' // a dragged color moved into a new spot
  | 'drop' // dropped a color in a new spot
  | 'copy' // copied text to the clipboard
  | 'success' // saved a project
  | 'undo' // undo or redo
  | 'toggleOn' // turned a switch on
  | 'toggleOff'; // turned a switch off

const HAPTICS: Record<FeedbackEvent, number | number[]> = {
  pickup: 12,
  tick: 6,
  drop: 8,
  copy: 8,
  success: [10, 70, 14],
  undo: 6,
  toggleOn: 8,
  toggleOff: 6,
};

type Tone = {
  frequency: number;
  endFrequency?: number;
  /** Seconds after the sound starts */
  delay?: number;
  /** Seconds */
  duration: number;
  volume: number;
  /** Seconds to reach full volume; longer is softer, less of a click */
  attack?: number;
  type?: OscillatorType;
};

// Short, soft, wooden-ish tones — closer to knitting needles than to a phone notification
const SOUNDS: Record<FeedbackEvent, Tone[]> = {
  // Dragging a color: low and soft, as it can sound many times in a row. Kept
  // above ~300 Hz, which phone speakers barely play
  pickup: [
    {
      frequency: 760,
      endFrequency: 480,
      duration: 0.06,
      volume: 0.045,
      attack: 0.012,
    },
  ],
  tick: [
    // The softest sound: it plays at every spot a dragged color passes
    {
      frequency: 640,
      endFrequency: 520,
      duration: 0.035,
      volume: 0.02,
      attack: 0.008,
    },
  ],
  drop: [
    {
      frequency: 520,
      endFrequency: 320,
      duration: 0.09,
      volume: 0.05,
      attack: 0.012,
    },
  ],
  copy: [{ frequency: 1300, endFrequency: 1100, duration: 0.05, volume: 0.04 }],
  success: [
    { frequency: 660, duration: 0.12, volume: 0.05 },
    { frequency: 990, delay: 0.09, duration: 0.18, volume: 0.05 },
  ],
  undo: [{ frequency: 700, endFrequency: 600, duration: 0.05, volume: 0.04 }],
  // A switch clicks a little higher going on than going off
  toggleOn: [
    { frequency: 1100, endFrequency: 1400, duration: 0.04, volume: 0.04 },
  ],
  toggleOff: [
    { frequency: 1000, endFrequency: 750, duration: 0.04, volume: 0.035 },
  ],
};

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (!browser) return null;
  if (!audioContext) {
    const AudioContextClass =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return null;
    audioContext = new AudioContextClass({ latencyHint: 'interactive' });
  }
  return audioContext;
}

/** Runs `play` once the audio context is running, resuming it first if needed (iOS suspends or "interrupts" it) */
function whenRunning(context: AudioContext, play: () => void) {
  if (context.state === 'running') {
    play();
    return;
  }
  context
    .resume()
    .then(() => {
      if (context.state === 'running') play();
    })
    .catch(() => {
      // Not allowed yet (no tap or click so far); the sound is skipped
    });
}

// iOS only lets audio start during a tap, click, or key press — and dragging
// a color starts on a touch *move*, which doesn't count. So the first such
// gesture anywhere unlocks audio by playing a silent sample.
const UNLOCK_EVENTS = ['pointerup', 'touchend', 'click', 'keydown'] as const;

function unlockAudio() {
  if (!getEffects().sound) return;
  const context = getAudioContext();
  if (!context) return;
  try {
    const source = context.createBufferSource();
    source.buffer = context.createBuffer(1, 1, 22050);
    source.connect(context.destination);
    source.start(0);
  } catch {
    // Ignore; the next gesture tries again
  }
  context.resume().then(() => {
    if (context.state === 'running') {
      UNLOCK_EVENTS.forEach((type) =>
        window.removeEventListener(type, unlockAudio, true),
      );
    }
  });
}

if (browser) {
  UNLOCK_EVENTS.forEach((type) =>
    window.addEventListener(type, unlockAudio, {
      capture: true,
      passive: true,
    }),
  );
}

function playTone(context: AudioContext, tone: Tone) {
  // A moment ahead, so a just-resumed context doesn't drop the start
  const start = context.currentTime + 0.01 + (tone.delay ?? 0);
  const end = start + tone.duration;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = tone.type ?? 'sine';
  oscillator.frequency.setValueAtTime(tone.frequency, start);
  if (tone.endFrequency) {
    oscillator.frequency.exponentialRampToValueAtTime(tone.endFrequency, end);
  }
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(
    tone.volume,
    start + (tone.attack ?? 0.005),
  );
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(start);
  oscillator.stop(end + 0.02);
}

/** Plays the sound and/or vibration for an event, if the user has them turned on. Call it only from a user action. */
export function feedback(event: FeedbackEvent) {
  if (!browser) return;
  const effects = getEffects();
  if (effects.haptics && canVibrate()) {
    try {
      navigator.vibrate(HAPTICS[event]);
    } catch {
      // Vibration is a nicety; ignore failures
    }
  }
  if (effects.sound) {
    try {
      const context = getAudioContext();
      if (context) {
        whenRunning(context, () =>
          SOUNDS[event].forEach((tone) => playTone(context, tone)),
        );
      }
    } catch {
      // Sound is a nicety; ignore failures
    }
  }
}

/** Lifts a dragged item off the page with a shadow. Use as svelte-dnd-action's `transformDraggedElement` (or call from it). */
export function liftDraggedElement(draggedEl: HTMLElement | undefined) {
  if (!draggedEl) return;
  draggedEl.style.boxShadow =
    '0 12px 28px rgb(0 0 0 / 0.28), 0 2px 6px rgb(0 0 0 / 0.18)';
}

let draggedIndex: number | null = null;

/**
 * Feedback for svelte-dnd-action's `consider` events: a pickup when a drag starts, then a tiny tick each time
 * the dragged item moves into a new spot — never on plain pointer movement.
 */
export function dragConsiderFeedback(
  items: { id: number | string }[],
  info: { trigger: string; id: string },
) {
  // Where the dragged item would drop: its placeholder (pointer drags give it
  // a placeholder id), or the item itself (keyboard drags keep its id)
  lastDragAt = performance.now();
  const index = items.findIndex(
    (item) =>
      (item as Record<string, unknown>)[SHADOW_ITEM_MARKER_PROPERTY_NAME] ||
      String(item.id) === info.id,
  );
  if (info.trigger === 'dragStarted') {
    draggedIndex = index;
    feedback('pickup');
    return;
  }
  if (index !== -1 && draggedIndex !== null && index !== draggedIndex) {
    feedback('tick');
  }
  if (index !== -1) draggedIndex = index;
}

/** Svelte transition for a color added to a palette: grows in, or just appears when motion is reduced */
// When an item was last dragged. Dragging swaps items for a placeholder and
// back, which re-creates them; those aren't new colors, so they don't grow in.
let lastDragAt = -Infinity;

export function growIn(node: Element, { delay = 0 }: { delay?: number } = {}) {
  if (performance.now() - lastDragAt < 500) return { duration: 0 };
  return scale(node, {
    start: 0.6,
    duration: motionDuration(200),
    delay: motion.reduced ? 0 : delay,
  });
}

/** Briefly marks one item (e.g. the swatch whose color just changed) to play the `.feedback-pop` animation */
export class Pop {
  index: number | null = $state(null);
  #timer: ReturnType<typeof setTimeout> | undefined;
  trigger(index: number) {
    clearTimeout(this.#timer);
    this.index = null;
    // On the next frame, so popping the same item again restarts the animation
    requestAnimationFrame(() => {
      this.index = index;
      this.#timer = setTimeout(() => (this.index = null), 400);
    });
  }
}

/** Feedback for svelte-dnd-action's `finalize` event: the drop */
export function dragFinalizeFeedback() {
  lastDragAt = performance.now();
  feedback('drop');
}

/**
 * Briefly marks something (e.g. a copy button, which shows a check) for `ms`. A `key` tells apart several
 * things that share one Flash, like the colorways in a list.
 */
export class Flash {
  key: string | null = $state(null);
  #timer: ReturnType<typeof setTimeout> | undefined;
  trigger(key = '', ms = 1500) {
    clearTimeout(this.#timer);
    this.key = null;
    // On the next frame, so flashing the same thing again restarts its animation
    requestAnimationFrame(() => {
      this.key = key;
      this.#timer = setTimeout(() => (this.key = null), ms);
    });
  }
  is(key = '') {
    return this.key === key;
  }
}

/** What an undo or redo just changed, so it can glow for a moment */
export const historyChange: {
  /** The gauge whose colors or ranges changed, and which of them */
  gaugeId: string | null;
  indices: number[];
  /** Whether the preview's settings changed */
  preview: boolean;
} = $state({ gaugeId: null, indices: [], preview: false });

let historyChangeTimer: ReturnType<typeof setTimeout> | undefined;

export function showHistoryChange(change: {
  gaugeId: string | null;
  indices: number[];
  preview: boolean;
}) {
  clearTimeout(historyChangeTimer);
  historyChange.gaugeId = null;
  historyChange.indices = [];
  historyChange.preview = false;
  // On the next frame, so undoing again restarts the glow
  requestAnimationFrame(() => {
    Object.assign(historyChange, change);
    historyChangeTimer = setTimeout(() => {
      historyChange.gaugeId = null;
      historyChange.indices = [];
      historyChange.preview = false;
    }, 1400);
  });
}
