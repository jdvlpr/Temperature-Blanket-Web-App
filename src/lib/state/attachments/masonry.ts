import type { Attachment } from 'svelte/attachments';

/**
 * Stacks a grid's items tightly in their columns (masonry), for cards of
 * different heights. The grid's rows become 1px tall and each item spans as
 * many as its own height plus the gap, so it still fills left to right, row by
 * row, in the order it's listed (as it's read and tabbed through), and items
 * added at the end never move the ones before them. The columns are still the
 * grid's own. Without it (before it runs, or once it's gone) the grid is as
 * it was, its items in even rows.
 */
export const masonry: Attachment<HTMLElement> = (container) => {
  container.style.gridAutoRows = '1px';
  container.style.rowGap = '0';

  let frame = 0;
  const layout = () => {
    frame = 0;
    // The gap between columns, under each item too
    const gap = parseFloat(getComputedStyle(container).columnGap) || 0;
    for (const item of container.children) {
      if (!(item instanceof HTMLElement)) continue;
      item.style.alignSelf = 'start';
      const height = item.getBoundingClientRect().height;
      // Something hidden takes no room
      item.style.gridRowEnd = height
        ? `span ${Math.ceil(height + gap)}`
        : 'span 1';
    }
  };
  const schedule = () => {
    frame ||= requestAnimationFrame(layout);
  };

  // Again as an item's height changes: its picture loads, its name wraps
  const resizes = new ResizeObserver(schedule);
  const observe = () => {
    resizes.disconnect();
    for (const item of container.children) resizes.observe(item);
    // The container's width too, for the gap at a new breakpoint
    resizes.observe(container);
  };
  // And as items come or go
  const changes = new MutationObserver(() => {
    observe();
    schedule();
  });
  changes.observe(container, { childList: true });
  observe();
  layout();

  return () => {
    cancelAnimationFrame(frame);
    resizes.disconnect();
    changes.disconnect();
    container.style.gridAutoRows = '';
    container.style.rowGap = '';
    for (const item of container.children) {
      if (!(item instanceof HTMLElement)) continue;
      item.style.alignSelf = '';
      item.style.gridRowEnd = '';
    }
  };
};
