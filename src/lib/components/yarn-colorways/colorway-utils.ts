import type { Color } from '$lib/types/yarn-types';
import { copyToClipboard } from '$lib/utils/clipboard-utils';
import { getSortedPalette } from '$lib/utils/color-utils';
import { ClipboardCheckIcon } from '@lucide/svelte';
import chroma from 'chroma-js';

/** A key that tells colorways apart, even ones that share a hex code */
export const colorwayKey = (colorway: Color) =>
  `${colorway.hex ?? ''}${colorway.name ?? ''}${colorway.brandName ?? ''}${colorway.yarnName ?? ''}`;

/** For choosing colorways from a list: which are chosen, and choosing one */
export type ColorwaySelection = {
  isSelected: (colorway: Color) => boolean;
  ontoggle: (colorway: Color) => void;
};

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

/** A colorway's round swatch, as big as the ⋮ button beside it (48px:
 * Skeleton's btn-icon pads its 32px outside the size) */
export const swatchClass =
  'size-12 shrink-0 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.12)]';

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

/** The site a link goes to, for naming it ("hobbii.com"), or undefined
 * when the link isn't a web address */
export const linkSite = (href: string): string | undefined => {
  try {
    return new URL(href).hostname.replace(/^www\./, '') || undefined;
  } catch {
    return undefined;
  }
};

/** Where a colorway can be bought (an affiliate link) or viewed, and the
 * site that is, or null when it's not sold anymore or has no link */
export const colorwayLink = (
  colorway: Color,
): { href: string; isAffiliate: boolean; site?: string } | null => {
  if (colorway.unavailable) return null;
  if (colorway.affiliate_variant_href)
    return { href: colorway.affiliate_variant_href, isAffiliate: true };
  if (colorway.variant_href)
    return {
      href: colorway.variant_href,
      isAffiliate: false,
      // Often a shop rather than the maker, so name the site itself
      site: linkSite(colorway.variant_href),
    };
  return null;
};

/** The ways the finder can order colorways. Labels don't name a direction,
 * since any but Best match can be reversed: unreversed, Lightness runs light
 * to dark and Name A to Z. */
export const COLORWAY_SORTS = [
  {
    value: 'best-match',
    label: 'Best match',
    details: 'Closest to your color',
    needsColor: true,
  },
  { value: 'rainbow', label: 'Hue', details: 'Rainbow order, grays last' },
  { value: 'light-to-dark', label: 'Lightness', details: 'Light to dark' },
  { value: 'name', label: 'Name', details: 'A to Z' },
  { value: 'by-yarn', label: 'Yarn', details: 'By brand, then yarn' },
] as const satisfies readonly {
  value: string;
  label: string;
  details: string;
  needsColor?: boolean;
}[];

/** Whether a sort can be reversed: Best match reversed is worst match first */
export const canReverse = (sort: ColorwaySort) => sort !== 'best-match';

export type ColorwaySort = (typeof COLORWAY_SORTS)[number]['value'];

export const isColorwaySort = (value: unknown): value is ColorwaySort =>
  COLORWAY_SORTS.some((sort) => sort.value === value);

/** The sorts to offer: Best match only during a color search */
export const colorwaySortOptions = (hasColor: boolean) =>
  COLORWAY_SORTS.filter((sort) => hasColor || !('needsColor' in sort));

/** The sort to use when none is chosen: best match during a color search,
 * otherwise by color */
export const defaultColorwaySort = (hasColor: boolean): ColorwaySort =>
  hasColor ? 'best-match' : 'rainbow';

/** How far (deltaE) a colorway can be from the searched color and still count
 * as a close match, i.e. at least 85% match */
export const CLOSE_MATCH_DELTA = 15;
/** A rare color still gets this many of its nearest colorways */
export const MIN_CLOSE_MATCHES = 24;

/** Every colorway, in the same order, with its `delta` (distance) from a
 * color; none when the color isn't valid */
export const withDeltas = <T extends Color>(
  colorways: T[],
  hex: string,
): (T & { delta: number })[] => {
  if (!chroma.valid(hex)) return [];
  return colorways.map((colorway) => ({
    ...colorway,
    delta: chroma.deltaE(hex, colorway.hex ?? '#ffffff'),
  }));
};

/**
 * The colorways close to a color, each with its `delta` (distance) from it,
 * closest first: every one within CLOSE_MATCH_DELTA, or at least the
 * MIN_CLOSE_MATCHES nearest. A set that doesn't change with how many are
 * shown, so any sort orders all of it.
 */
export const closeMatches = <T extends Color>(
  colorways: T[],
  hex: string,
): (T & { delta: number })[] => {
  if (!chroma.valid(hex)) return [];
  const ranked = withDeltas(colorways, hex).sort((a, b) => a.delta - b.delta);
  const close = ranked.findIndex(
    (colorway) => colorway.delta > CLOSE_MATCH_DELTA,
  );
  const count =
    close === -1 ? ranked.length : Math.max(close, MIN_CLOSE_MATCHES);
  return ranked.slice(0, count);
};

/** Colorways in a sort, as a new list, reversed if asked (and the sort can
 * be). 'by-yarn' keeps the catalog's order (brand, then yarn); 'best-match' is
 * closest first, catalog order on ties. */
export const sortColorways = <T extends Color & { delta?: number }>(
  colorways: T[],
  sort: ColorwaySort,
  reversed = false,
): T[] => {
  const sorted = sortColorwaysForward(colorways, sort);
  return reversed && canReverse(sort) ? sorted.reverse() : sorted;
};

const sortColorwaysForward = <T extends Color & { delta?: number }>(
  colorways: T[],
  sort: ColorwaySort,
): T[] => {
  switch (sort) {
    case 'by-yarn':
      return [...colorways];
    case 'best-match':
      return [...colorways].sort(
        (a, b) => (a.delta ?? Infinity) - (b.delta ?? Infinity),
      );
    default:
      // The palette sorts copy each color, so match deltas come along
      return getSortedPalette({
        palette: [...colorways],
        sortColors: sort,
      }) as T[];
  }
};
