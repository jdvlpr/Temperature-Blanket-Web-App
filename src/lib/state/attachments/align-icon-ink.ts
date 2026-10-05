import type { Attachment } from 'svelte/attachments';

/**
 * Lines up icons by what's drawn rather than by their boxes. An icon's lines
 * start a pixel or few inside its 24px box, a different amount for each
 * shape, so beside something drawn edge to edge (the site logo) the icons
 * look slightly indented, and unevenly. Each icon in the element is moved left
 * by the space before its lines. `translate` doesn't affect layout, so the
 * labels beside the icons stay where they are. Only the icon leading a link
 * or button moves; trailing ones (a section's chevron) stay put.
 */
export const alignIconInk: Attachment<HTMLElement> = (container) => {
  const align = () => {
    for (const icon of container.querySelectorAll<SVGSVGElement>(
      ':is(a, button) > svg:first-child',
    )) {
      // Hidden (e.g. a closed menu's) icons have nothing to measure yet
      if (!icon.getClientRects().length) continue;
      const box = icon.getBBox();
      if (!box.width) continue;
      const stroke = parseFloat(getComputedStyle(icon).strokeWidth) || 0;
      // The icon's own units to pixels, for icons drawn larger or smaller
      const scale =
        icon.getBoundingClientRect().width /
        (icon.viewBox.baseVal?.width || 24);
      const inset = Math.max(0, box.x - stroke / 2) * scale;
      icon.style.translate = inset ? `${-inset}px 0` : '';
    }
  };
  align();
  // Again when icons come or change, as a section opens or a button swaps
  const observer = new MutationObserver(align);
  observer.observe(container, { childList: true, subtree: true });
  return () => observer.disconnect();
};
