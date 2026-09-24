// Copyright (c) 2024 - 2026, Thomas (https://github.com/jdvlpr)
//
// This file is part of Temperature-Blanket-Web-App.
//
// Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
// under the terms of the GNU General Public License as published by the Free Software Foundation,
// either version 3 of the License, or (at your option) any later version.
//
// Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
// without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
// See the GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App.
// If not, see <https://www.gnu.org/licenses/>.

// Extra colors are the non-gauge colors a preview uses, like an accent color
// for additional squares or a border color between squares.
//
// The preview's own URL hash param stays the source of truth for rendering
// (it stores the bare hex). This module handles a separate, self-describing
// URL hash param, `&x=`, that repeats each in-use extra color's hex along with
// its yarn details, so that the gallery page and exports can list extra colors
// without parsing each preview's positional hash format.
//
// Format: entries separated by '!', each entry is
//   <role code (1 char)><hex (6 chars)><optional brandId-yarnId>
// e.g. &x=af0f3f3bernat-blanket!be8e3e2
//
// Like gauges, only the brandId-yarnId is stored; the colorway name and links
// are looked up again by hex from the yarn dataset when loading.
//
// Projects saved before this param existed simply have no `x` param, so their
// extra colors are hex-only (read from the preview's own param) as before.

import type { Color } from '$lib/types/yarn-types';
import { getColorPropertiesFromYarnStringAndHex } from '$lib/utils/yarn-utils';
import chroma from 'chroma-js';

export const EXTRA_COLORS_HASH_KEY = 'x';

export type ExtraColorRole = 'accent' | 'border';

const ROLE_CODES: Record<ExtraColorRole, string> = {
  accent: 'a',
  border: 'b',
};

export const EXTRA_COLOR_ROLE_LABELS: Record<ExtraColorRole, string> = {
  accent: 'Accent Color',
  border: 'Border Color',
};

/** Yarn details (if any) the user picked for each extra color role. */
export type ExtraColorDetails = Partial<Record<ExtraColorRole, Color>>;

/** An extra color a preview could use, and whether it's currently used. */
export interface ExtraColorSlot {
  role: ExtraColorRole;
  label: string;
  hex: string;
  inUse: boolean;
}

/** An extra color that's used in the project. */
export interface PreviewExtraColor {
  role: ExtraColorRole;
  label: string;
  color: Color;
}

/**
 * Returns the color with the saved yarn details for a role, as long as the
 * details still match the current hex (otherwise the hex was changed some
 * other way, so the details no longer apply).
 */
export const withExtraColorDetails = (
  hex: string,
  details: Color | undefined,
): Color => {
  if (details?.hex && details.hex.toLowerCase() === hex.toLowerCase())
    return { ...details, hex };
  return { hex };
};

export const resolveExtraColors = (
  slots: ExtraColorSlot[],
  details: ExtraColorDetails,
): PreviewExtraColor[] =>
  slots
    .filter((slot) => slot.inUse && chroma.valid(slot.hex))
    .map(({ role, label, hex }) => ({
      role,
      label,
      color: withExtraColorDetails(hex, details[role]),
    }));

export const extraColorsToUrlHash = (extras: PreviewExtraColor[]): string => {
  if (!extras.length) return '';
  const entries = extras.map(({ role, color }) => {
    const hex = chroma(color.hex as string)
      .hex('rgb')
      .substring(1);
    const yarn =
      color.brandId && color.yarnId ? `${color.brandId}-${color.yarnId}` : '';
    return `${ROLE_CODES[role]}${hex}${yarn}`;
  });
  return `&${EXTRA_COLORS_HASH_KEY}=${entries.join('!')}`;
};

interface ParsedExtraColor {
  role: ExtraColorRole;
  hex: string;
  yarn: string;
}

export const parseExtraColorsUrlHash = (value: string): ParsedExtraColor[] => {
  if (!value) return [];
  const parsed: ParsedExtraColor[] = [];
  value.split('!').forEach((entry) => {
    const role = (Object.keys(ROLE_CODES) as ExtraColorRole[]).find(
      (key) => ROLE_CODES[key] === entry.substring(0, 1),
    );
    const hex = `#${entry.substring(1, 7)}`;
    if (!role || !chroma.valid(hex)) return;
    if (parsed.some((item) => item.role === role)) return; // one color per role
    parsed.push({
      role,
      hex: chroma(hex).hex('rgb'),
      yarn: entry.substring(7),
    });
  });
  return parsed;
};

/**
 * Resolves the `x` param into colors with yarn details.
 * The yarn dataset must already be loaded (see `extraColorsHaveYarnDetails`).
 */
export const extraColorDetailsFromUrlHash = (
  value: string,
): ExtraColorDetails => {
  const details: ExtraColorDetails = {};
  parseExtraColorsUrlHash(value).forEach(({ role, hex, yarn }) => {
    const properties = yarn
      ? getColorPropertiesFromYarnStringAndHex({ yarnString: yarn, hex })
      : null;
    details[role] = { ...properties, hex };
  });
  return details;
};

/**
 * Extra colors from the `x` param, labelled generically by role, for places
 * that don't load the preview (like the gallery page).
 */
export const extraColorsFromUrlHash = (value: string): PreviewExtraColor[] => {
  const details = extraColorDetailsFromUrlHash(value);
  return (Object.keys(ROLE_CODES) as ExtraColorRole[])
    .filter((role) => details[role])
    .map((role) => ({
      role,
      label: EXTRA_COLOR_ROLE_LABELS[role],
      color: details[role] as Color,
    }));
};

/** Extra colors from a full project URL (e.g. a saved project's href). */
export const extraColorsFromProjectHref = (
  href: string,
): PreviewExtraColor[] => {
  let hash: string;
  try {
    hash = new URL(href).hash.substring(1);
  } catch {
    return [];
  }
  const param = hash
    .split('&')
    .find((item) => item.startsWith(`${EXTRA_COLORS_HASH_KEY}=`));
  if (!param) return [];
  return extraColorsFromUrlHash(
    decodeURIComponent(param.substring(EXTRA_COLORS_HASH_KEY.length + 1)),
  );
};

/** Whether the `x` param references yarn, so the yarn dataset is needed. */
export const extraColorsHaveYarnDetails = (
  params: Record<string, { value: string }>,
): boolean =>
  parseExtraColorsUrlHash(params[EXTRA_COLORS_HASH_KEY]?.value ?? '').some(
    (item) => !!item.yarn,
  );
