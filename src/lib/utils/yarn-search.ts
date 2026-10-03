import { ALL_YARN_WEIGHTS } from '$lib/constants/color-constants';
import type { Brand } from '$lib/types/yarn-types';
import { pluralize } from '$lib/utils/string-utils';

/**
 * The yarn picker's list: each brand, then its yarns. Picking a brand picks
 * all of its yarns.
 */
export type YarnOption = {
  kind: 'brand' | 'yarn';
  /** `brand:{brandId}` or `yarn:{brandId}-{yarnId}` */
  value: string;
  brandId: string;
  brandName: string;
  /** Counted within the yarn weight filter */
  brandYarns: number;
  brandColorways: number;
  yarnId?: string;
  yarnName?: string;
  weightName?: string;
  colorways: number;
  /** Every colorway's link is gone */
  unavailable: boolean;
};

export const brandValue = (brandId: string) => `brand:${brandId}`;
export const yarnValue = (brandId: string, yarnId: string) =>
  `yarn:${brandId}-${yarnId}`;

const weightName = (id?: string) =>
  id ? ALL_YARN_WEIGHTS.find((weight) => weight.id === id)?.name : undefined;

const countColorways = (yarn: Brand['yarns'][number]) =>
  yarn.colorways.reduce((sum, colorway) => sum + colorway.colors.length, 0);

/** Every brand with yarns of the weight (any weight without one) */
export function buildYarnOptions(
  brands: Brand[],
  weightId?: string | null,
): YarnOption[] {
  return brands.flatMap((brand) => {
    const yarns = brand.yarns.filter(
      (yarn) => !weightId || yarn.weightId === weightId,
    );
    if (!yarns.length) return [];
    const brandColorways = yarns.reduce(
      (sum, yarn) => sum + countColorways(yarn),
      0,
    );
    const common = {
      brandId: brand.id,
      brandName: brand.name,
      brandYarns: yarns.length,
      brandColorways,
    };
    return [
      {
        ...common,
        kind: 'brand' as const,
        value: brandValue(brand.id),
        colorways: brandColorways,
        unavailable: false,
      },
      ...yarns.map((yarn) => ({
        ...common,
        kind: 'yarn' as const,
        value: yarnValue(brand.id, yarn.id),
        yarnId: yarn.id,
        yarnName: yarn.name,
        weightName: weightName(yarn.weightId),
        colorways: countColorways(yarn),
        unavailable: yarn.colorways.every(
          (colorway) => colorway.source?.unavailable,
        ),
      })),
    ];
  });
}

/** How an option reads in the field once picked */
export function optionLabel(option: YarnOption) {
  if (option.kind === 'brand')
    return `${option.brandName} (${option.brandYarns} ${pluralize('yarn', option.brandYarns)})`;
  return `${option.brandName} - ${option.yarnName}${
    option.weightName ? ` (${option.weightName})` : ''
  }`;
}

/**
 * The words to look for. Anything in parentheses is left out, and a field's
 * own "Brand - Yarn" (or "Brand, Yarn") looks for either part.
 */
export function searchTerms(text: string): string[] {
  return text
    .split('(')[0]
    .split(/[-,]/)
    .map((term) => term.trim().toLowerCase())
    .filter(Boolean);
}

function yarnMatches(option: YarnOption, terms: string[]) {
  return terms.some(
    (term) =>
      option.brandName.toLowerCase().includes(term) ||
      !!option.yarnName?.toLowerCase().includes(term),
  );
}

/**
 * Yarns whose brand or name has any of the words, each under its brand. With
 * no words, everything.
 */
export function filterYarnOptions(
  options: YarnOption[],
  text: string,
): YarnOption[] {
  const terms = searchTerms(text);
  if (!terms.length) return options;
  const shown = new Set(
    options
      .filter((option) => option.kind === 'yarn' && yarnMatches(option, terms))
      .map((option) => option.brandId),
  );
  return options.filter(
    (option) =>
      shown.has(option.brandId) &&
      (option.kind === 'brand' || yarnMatches(option, terms)),
  );
}

/** Text split into the parts that match the words, to show them in bold */
export function highlightParts(
  text: string,
  terms: string[],
): { text: string; match: boolean }[] {
  if (!terms.length) return [{ text, match: false }];
  const escaped = terms.map((term) =>
    term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
  );
  const pattern = new RegExp(`(${escaped.join('|')})`, 'gi');
  return text
    .split(pattern)
    .filter(Boolean)
    .map((part) => ({
      text: part,
      match: terms.includes(part.toLowerCase()),
    }));
}
