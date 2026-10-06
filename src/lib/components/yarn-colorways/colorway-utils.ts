import type { Color } from '$lib/types/yarn-types';
import { copyToClipboard } from '$lib/utils/clipboard-utils';
import { ClipboardCheckIcon } from '@lucide/svelte';

/** A key that tells colorways apart, even ones that share a hex code */
export const colorwayKey = (colorway: Color) =>
  `${colorway.hex ?? ''}${colorway.name ?? ''}${colorway.brandName ?? ''}${colorway.yarnName ?? ''}`;

/** How closely a colorway matches the searched color, as a whole percent,
 * or undefined when there's no color search */
export const matchPercent = (colorway: { delta?: number }) =>
  colorway.delta === undefined
    ? undefined
    : Math.max(0, Math.floor(100 - colorway.delta));

/** Copy a colorway's name or hex code, with the usual confirmation toast */
export const copyColorwayText = (text: string) =>
  copyToClipboard(text, {
    message: `<div class="flex flex-col"><span class="font-bold">${text}</span><span class="text-xs">Copied to clipboard</span></div>`,
    icon: ClipboardCheckIcon,
  });
