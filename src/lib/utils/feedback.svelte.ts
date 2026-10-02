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
  tick: 4,
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
  type?: OscillatorType;
};

// Short, soft, wooden-ish tones — closer to knitting needles than to a phone notification
const SOUNDS: Record<FeedbackEvent, Tone[]> = {
  pickup: [
    { frequency: 1500, endFrequency: 900, duration: 0.05, volume: 0.06 },
  ],
  tick: [
    { frequency: 2200, endFrequency: 1800, duration: 0.02, volume: 0.025 },
  ],
  drop: [{ frequency: 900, endFrequency: 520, duration: 0.07, volume: 0.07 }],
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
    audioContext = new AudioContextClass();
  }
  // Browsers (notably iOS Safari) start the context suspended until a user gesture
  if (audioContext.state === 'suspended') audioContext.resume();
  return audioContext;
}

function playTone(context: AudioContext, tone: Tone) {
  const start = context.currentTime + (tone.delay ?? 0);
  const end = start + tone.duration;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = tone.type ?? 'sine';
  oscillator.frequency.setValueAtTime(tone.frequency, start);
  if (tone.endFrequency) {
    oscillator.frequency.exponentialRampToValueAtTime(tone.endFrequency, end);
  }
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(tone.volume, start + 0.005);
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
      if (context) SOUNDS[event].forEach((tone) => playTone(context, tone));
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
  const index = items.findIndex((item) => String(item.id) === info.id);
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
export function growIn(node: Element, { delay = 0 }: { delay?: number } = {}) {
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
