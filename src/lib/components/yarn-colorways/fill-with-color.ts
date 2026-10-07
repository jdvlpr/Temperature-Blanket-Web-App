// View › Fill with color: each colorway card or row (and each palette color)
// takes its yarn's color. The color is a layer under the item's content
// (`.fill-layer` in main.css), shown by the item's `data-filled`. Turning
// the option on or off grows it out of the item's swatch (`data-fill-origin`)
// to fill the item, or shrinks it back in. An item whose swatch shows only
// when it isn't filled marks something else as a fallback
// (`data-fill-origin="fallback"`), for when there's no swatch. Only then: moving the swatch
// (another layout, another text size) never animates it. Items out of view,
// and everything when motion is reduced, just change. While the option
// changes, `<html>` has `data-fill-changing`, so that only the item's own text
// color eases (see main.css); its content follows by inheriting it.

import { preferences } from '$lib/storage/preferences.svelte';
import { motion } from '$lib/utils/feedback.svelte';
import { tick } from 'svelte';
import type { Action } from 'svelte/action';

/** Whether cards and rows are filled with their color (View › Fill with color) */
export const fillWithColor = {
  get on(): boolean {
    return preferences.value.fillColor ?? false;
  },
  set on(value: boolean) {
    // Set before the items update, so no transition inside them starts
    const root = document.documentElement;
    root.setAttribute('data-fill-changing', '');
    clearTimeout(changing);
    changing = setTimeout(
      () => root.removeAttribute('data-fill-changing'),
      DURATION + 100,
    );
    preferences.value.fillColor = value;
  },
};

const DURATION = 450;
let changing: ReturnType<typeof setTimeout> | undefined;

// Items in view; only they animate. One observer for every item.
const inView = new WeakSet<Element>();
let observer: IntersectionObserver | undefined;
const getObserver = () =>
  (observer ??= new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) inView.add(entry.target);
      else inView.delete(entry.target);
    }
  }));

/** The swatch's middle and radius within the item, ignoring transforms
 * (a swatch's pop, an item's move or grow), or undefined without one */
const swatchCircle = (item: HTMLElement) => {
  const swatch =
    item.querySelector<HTMLElement>(
      '[data-fill-origin]:not([data-fill-origin="fallback"])',
    ) ?? item.querySelector<HTMLElement>('[data-fill-origin]');
  if (!swatch) return;
  let x = swatch.offsetWidth / 2;
  let y = swatch.offsetHeight / 2;
  let el: HTMLElement | null = swatch;
  while (el && el !== item) {
    x += el.offsetLeft;
    y += el.offsetTop;
    el = el.offsetParent as HTMLElement | null;
  }
  // The item is the `relative` box the layer fills, so offsets end there
  if (el !== item) return;
  return { x, y, r: swatch.offsetWidth / 2 };
};

/** On a card or row (`relative`, with a `.fill-layer` first): plays the
 * fill growing from or shrinking into its swatch when `filled` changes */
export const fillFromSwatch: Action<HTMLElement, boolean> = (item, filled) => {
  let current = filled;
  getObserver().observe(item);

  return {
    update(next) {
      if (next === current) return;
      current = next;
      if (motion.reduced || !inView.has(item)) {
        // Until it's drawn the new way
        item.setAttribute('data-fill-instant', '');
        requestAnimationFrame(() =>
          requestAnimationFrame(() =>
            item.removeAttribute('data-fill-instant'),
          ),
        );
        return;
      }
      // Growing, from the swatch as it is now (it may go once filled);
      // shrinking, into the swatch as it will be (it may only show unfilled),
      // once the item has updated but before it's drawn
      if (next) play(next);
      else tick().then(() => current === next && play(next));
    },
    destroy() {
      observer?.unobserve(item);
      inView.delete(item);
    },
  };

  function play(next: boolean) {
    const layer = item.querySelector<HTMLElement>(':scope > .fill-layer');
    const circle = swatchCircle(item);
    if (!layer || !circle) return;
    const at = `at ${circle.x}px ${circle.y}px`;
    // Just inside the swatch, so none shows around it
    const small = `circle(${Math.max(circle.r - 1, 0)}px ${at})`;
    // 150% reaches every corner from anywhere in the item
    const large = `circle(150% ${at})`;
    layer.animate(
      { clipPath: next ? [small, large] : [large, small] },
      { duration: DURATION, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
    );
  }
};

/** Classes for secondary text: dimmed on the page's surface, but at full
 * strength on a yarn's color, where dimming could leave too little contrast */
export const mutedText = (filled: boolean) =>
  filled ? '' : 'text-surface-700-300';
