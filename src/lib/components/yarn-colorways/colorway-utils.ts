import type { Color } from '$lib/types/yarn-types';
import { copyToClipboard } from '$lib/utils/clipboard-utils';
import { ClipboardCheckIcon } from '@lucide/svelte';
import chroma from 'chroma-js';

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

/**
 * Black or white, whichever stands out more on a color, for an icon drawn
 * right on a swatch. Unlike getTextColor's luminance cutoff, this keeps every
 * mid-tone at the 3:1 contrast icons need (e.g. black, not white, on pinks).
 */
export const iconColorOn = (hex: string | undefined): 'black' | 'white' => {
  if (!hex || !chroma.valid(hex)) return 'black';
  return chroma.contrast(hex, 'black') >= chroma.contrast(hex, 'white')
    ? 'black'
    : 'white';
};
