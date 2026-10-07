// Small visual feedback for user actions, plus the app-wide reduced motion check.
// Feedback is always an extra: every event here also has, where useful, a screen reader announcement.

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

/** Lifts a dragged item off the page with a shadow. Use as svelte-dnd-action's `transformDraggedElement` (or call from it). */
export function liftDraggedElement(draggedEl: HTMLElement | undefined) {
  if (!draggedEl) return;
  // svelte-dnd-action focuses the dragged copy (fixed, at the end of the
  // page) only to keep an outline, which the shadow already stands in for.
  // On iOS a focused copy makes the page jump: to it when focused, and again
  // when it's dropped and removed. So it never takes focus.
  draggedEl.focus = () => {};
  draggedEl.style.boxShadow =
    '0 12px 28px rgb(0 0 0 / 0.28), 0 2px 6px rgb(0 0 0 / 0.18)';
}

// When an item was last dragged. Dragging swaps items for a placeholder and
// back, which re-creates them; those aren't new colors, so they don't grow in.
let lastDragAt = -Infinity;

/** Call from svelte-dnd-action's `consider` and `finalize` events, so dragged items don't play `growIn` */
export function markDragged() {
  lastDragAt = performance.now();
}

/** Svelte transition for a color added to a palette: grows in, or just appears when motion is reduced */
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
