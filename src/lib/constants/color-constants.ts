// Copyright (c) 2024, Thomas (https://github.com/jdvlpr)
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

import { PUBLIC_AFFILIATE_YARNS } from '$env/static/public';
import type { AffiliateYarn, Color, YarnWeight } from '$lib/types';
import { brands } from '$lib/data/yarns/brands';
import chroma from 'chroma-js';

export const YARN_COLORWAYS_PER_PAGE = 100;

export const MAXIMUM_YARN_DETAILS_DESCRIPTIONS = 5;

export const MAXIMUM_COLORWAYS_MATCHES_FOR_IMAGES = 50;

const affiliateYarns: AffiliateYarn[] | null = PUBLIC_AFFILIATE_YARNS
  ? JSON.parse(PUBLIC_AFFILIATE_YARNS)
  : null;

export const ALL_YARN_WEIGHTS: YarnWeight[] = [
  { name: 'Thread', id: 't' },
  { name: 'Cobweb', id: 'c' },
  { name: 'Lace', id: 'l' },
  { name: 'Light Fingering', id: 'lf' },
  { name: 'Fingering', id: 'f' },
  { name: 'Sport', id: 's' },
  { name: 'DK', id: 'd' },
  { name: 'Worsted', id: 'w' },
  { name: 'Aran', id: 'a' },
  { name: 'Bulky', id: 'b' },
  { name: 'Super Bulky', id: 'sb' },
  { name: 'Jumbo', id: 'j' },
];

export const ALL_COLORWAYS_WITH_AFFILIATE_LINKS: Color[] = brands.flatMap(
  (n, i) => {
    return n.yarns
      .map((yarn) => {
        const affiliateYarn = affiliateYarns
          ? affiliateYarns.find(
              (affiliateYarn) =>
                affiliateYarn.brand_id === n.id &&
                affiliateYarn.yarn_id === yarn.id,
            )
          : null;
        return {
          ...yarn,
          brandId: brands[i].id,
          brandName: brands[i].name,
          affiliateYarn: affiliateYarn
            ? {
                affiliateYarnId: affiliateYarn.yarn_id,
                affiliateColors: affiliateYarn.colors,
              }
            : null,
        };
      })
      .flatMap((yarn) =>
        yarn.colorways.map((n) => {
          const affiliateColors =
            yarn.affiliateYarn?.affiliateYarnId === yarn.id
              ? yarn.affiliateYarn?.affiliateColors
              : null;
          return {
            ...n,
            affiliateColors,
            brandId: yarn.brandId,
            brandName: yarn.brandName,
            yarnId: yarn.id,
            yarnName: yarn.name,
            yarnWeightId: yarn.weightId,
          };
        }),
      )
      .flatMap((colorway) =>
        colorway.colors.map((n) => {
          const affiliate_variant_href = colorway.affiliateColors
            ? colorway.affiliateColors.find(
                (affiliateColor) => n.name === affiliateColor.name,
              )?.affiliate_variant_href
            : null;
          const variant_href = n?.variant_href || colorway.source.href;
          n.hex = chroma(n.hex).hex();
          const unavailable = !!colorway.source?.unavailable;
          return {
            ...n,
            affiliate_variant_href,
            variant_href,
            brandName: colorway.brandName,
            brandId: colorway.brandId,
            yarnId: colorway.yarnId,
            yarnName: colorway.yarnName,
            yarnWeightId: colorway.yarnWeightId,
            unavailable,
          };
        }),
      );
  },
);

export const ALL_COLORWAYS: Color[] = brands.flatMap((n, i) => {
  return n.yarns
    .map((yarn) => {
      return {
        ...yarn,
        brandId: brands[i].id,
        brandName: brands[i].name,
      };
    })
    .flatMap((yarn) =>
      yarn.colorways.map((n) => {
        return {
          ...n,
          brandId: yarn.brandId,
          brandName: yarn.brandName,
          yarnId: yarn.id,
          yarnName: yarn.name,
          yarnWeightId: yarn.weightId,
        };
      }),
    )
    .flatMap((colorway) =>
      colorway.colors.map((n) => {
        const href = n?.variant_href || colorway.source.href;
        const hex = chroma(n.hex).hex();
        // No need to check if the colorway is available or not, but here's how to do it:
        // const isAvailable = !colorway.source?.unavailable;
        return {
          name: n.name,
          hex,
          brandId: colorway.brandId,
          brandName: colorway.brandName,
          yarnId: colorway.yarnId,
          yarnName: colorway.yarnName,
          yarnWeightId: colorway.yarnWeightId,
          dateAccessed: colorway.source.accessed,
          href,
          // isAvailable,
        };
      }),
    );
});

// Preset color schemes
// Based on https://ColorBrewer2.org ColorBrewer2.org by Cynthia A.Brewer, Geography, Pennsylvania State University
export const SCHEMES = [
  {
    value: 'Reds',
    label: 'One Hue: Red',
    categories: ['One Hue'],
  },
  {
    value: 'Oranges',
    label: 'One Hue: Orange',
    categories: ['One Hue'],
  },
  {
    value: 'Greens',
    label: 'One Hue: Green',
    categories: ['One Hue'],
  },
  {
    value: 'Blues',
    label: 'One Hue: Blue',
    categories: ['One Hue'],
  },
  {
    value: 'Purples',
    label: 'One Hue: Purple',
    categories: ['One Hue'],
  },
  {
    value: 'Greys',
    label: 'One Hue: Grey',
    categories: ['One Hue'],
  },
  {
    value: 'RdPu',
    label: 'Multi-hue: Red to Purple',
    categories: ['Multi-hue'],
  },
  {
    value: 'OrRd',
    label: 'Multi-hue: Orange to Red',
    categories: ['Multi-hue'],
  },
  {
    value: 'YlGn',
    label: 'Multi-hue: Yellow to Green',
    categories: ['Multi-hue'],
  },
  {
    value: 'YlGnBu',
    label: 'Multi-hue: Yellow to Green to Blue',
    categories: ['Multi-hue'],
  },
  {
    value: 'YlOrRd',
    label: 'Multi-hue: Yellow to Orange to Red',
    categories: ['Multi-hue'],
  },
  {
    value: 'YlOrBr',
    label: 'Multi-hue: Yellow to Orange to Brown',
    categories: ['Multi-hue'],
  },
  {
    value: 'GnBu',
    label: 'Multi-hue: Green to Blue',
    categories: ['Multi-hue'],
  },
  {
    value: 'BuGn',
    label: 'Multi-hue: Blue to Green',
    categories: ['Multi-hue'],
  },
  {
    value: 'BuPu',
    label: 'Multi-hue: Blue to Purple',
    categories: ['Multi-hue'],
  },
  {
    value: 'PuRd',
    label: 'Multi-hue: Purple to Red',
    categories: ['Multi-hue'],
  },
  {
    value: 'PuBu',
    label: 'Multi-hue: Purple to Blue',
    categories: ['Multi-hue'],
  },
  {
    value: 'PuBuGn',
    label: 'Multi-hue: Purple to Blue to Green',
    categories: ['Multi-hue'],
  },
  {
    value: 'RdBu',
    label: 'Diverging: Red to Blue',
    categories: ['Diverging'],
  },
  {
    value: 'RdGy',
    label: 'Diverging: Red to Grey',
    categories: ['Diverging'],
  },
  {
    value: 'RdYlGn',
    label: 'Diverging: Red to Yellow to Green',
    categories: ['Diverging'],
  },
  {
    value: 'RdYlBu',
    label: 'Diverging: Red to Yellow to Blue',
    categories: ['Diverging'],
  },
  {
    value: 'PuOr',
    label: 'Diverging: Orange to Purple',
    categories: ['Diverging'],
  },
  {
    value: 'PRGn',
    label: 'Diverging: Purple to Green',
    categories: ['Diverging'],
  },
  {
    value: 'PiYG',
    label: 'Diverging: Magenta to Yellow to Green',
    categories: ['Diverging'],
  },
  {
    value: 'BrBG',
    label: 'Diverging: Brown to Blue to Green',
    categories: ['Diverging'],
  },
  {
    value: 'Spectral',
    label: 'Spectral',
    categories: ['Creative'],
  },
  {
    value: 'Viridis',
    label: 'Viridis',
    categories: ['Creative'],
  },
  {
    value: 'Accent',
    label: 'Accent',
    categories: ['Creative'],
  },
  {
    value: 'Set1',
    label: 'Cartoon',
    categories: ['Creative'],
  },
  {
    value: 'Set2',
    label: 'Classroom',
    categories: ['Creative'],
  },
  {
    value: 'Set3',
    label: 'Unicorn',
    categories: ['Creative'],
  },
  {
    value: 'Dark2',
    label: 'Jewel Tones',
    categories: ['Creative'],
  },
  {
    value: 'Paired',
    label: 'Traditional',
    categories: ['Creative'],
  },
  {
    value: 'Pastel1',
    label: 'Baby Pastels',
    categories: ['Creative'],
  },
  {
    value: 'Pastel2',
    label: 'Fairy Pastels',
    categories: ['Creative'],
  },
];
