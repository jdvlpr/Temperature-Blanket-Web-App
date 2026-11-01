// View › Space between items: whether a palette's colors and colorway cards
// or rows sit apart, each its own card, or meet in one block whose corners
// alone are rounded. One setting for every list that offers it, kept for each
// layout: apart in a grid and meeting in a list until it's first changed.

import { preferences } from '#lib/storage/preferences.svelte.js';
import type { PageLayout } from '#lib/types/page-types.js';

/** Whether items in this layout have space between them */
export function spaced(layout: PageLayout): boolean {
  return preferences.value.itemSpacing?.[layout] ?? layout === 'grid';
}

export function setSpaced(layout: PageLayout, value: boolean) {
  preferences.value.itemSpacing = {
    ...preferences.value.itemSpacing,
    [layout]: value,
  };
}
