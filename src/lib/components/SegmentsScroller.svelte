<!-- Holds a segmented control in one row, rather than stacking or wrapping its
options. Give the control min-w-max so it grows to its options.

With `collapse`, for options with icons: when the options don't fit, only
their icons show. The children snippet gets `iconsOnly`, to hide each option's
name with sr-only, give it a title, and name the choice in the control's label
("Mode: Light").

Whatever still doesn't fit scrolls sideways, keeping the chosen option in view. -->

<script lang="ts">
  import { motion } from '$lib/utils/feedback.svelte';
  import type { Snippet } from 'svelte';
  import type { Attachment } from 'svelte/attachments';

  let {
    children,
    class: className = '',
    collapse = false,
  }: {
    children: Snippet<[boolean]>;
    class?: string;
    collapse?: boolean;
  } = $props();

  let iconsOnly = $state(false);

  // Scrolls only this row, never the page or dialog around it
  function showChecked(row: HTMLElement, behavior: ScrollBehavior) {
    const item = row.querySelector<HTMLElement>(
      '[data-part="item"][data-state="checked"]',
    );
    if (!item) return;
    const rowBox = row.getBoundingClientRect();
    const itemBox = item.getBoundingClientRect();
    if (itemBox.left < rowBox.left)
      row.scrollBy({ left: itemBox.left - rowBox.left, behavior });
    else if (itemBox.right > rowBox.right)
      row.scrollBy({ left: itemBox.right - rowBox.right, behavior });
  }

  const keepCheckedInView: Attachment<HTMLElement> = (row) => {
    showChecked(row, 'auto');
    const observer = new MutationObserver(() =>
      showChecked(row, motion.reduced ? 'auto' : 'smooth'),
    );
    observer.observe(row, {
      subtree: true,
      attributes: true,
      attributeFilter: ['data-state'],
    });
    return () => observer.disconnect();
  };

  // Icons only while the names don't fit. The width the names needed is kept,
  // so they come back only once there's room again
  const fitNames: Attachment<HTMLElement> = (row) => {
    if (!collapse) return;
    const control = row.querySelector<HTMLElement>('[data-part="control"]');
    if (!control) return;
    let fullWidth = 0;
    const check = () => {
      if (!iconsOnly && control.scrollWidth > row.clientWidth) {
        fullWidth = control.scrollWidth;
        iconsOnly = true;
      } else if (iconsOnly && row.clientWidth >= fullWidth) {
        iconsOnly = false;
      }
    };
    // The items too, as the names showing again (or the text size) widens them
    const observer = new ResizeObserver(check);
    observer.observe(row);
    observer.observe(control);
    control
      .querySelectorAll('[data-part="item"]')
      .forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  };
</script>

<div
  class={['max-w-full min-w-0 overflow-x-auto', className]}
  {@attach keepCheckedInView}
  {@attach fitNames}
>
  {@render children(iconsOnly)}
</div>
