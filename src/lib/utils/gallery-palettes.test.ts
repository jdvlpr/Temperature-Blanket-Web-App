// The palette gallery's cards: getPalettesFromProjects groups the same colors on
// the first card found. Uses the real yarn dataset (a palette needs yarn colors).

import { ensureYarnData } from '#lib/data/yarns/colorways.svelte.js';
import { beforeAll, describe, expect, it } from 'vitest';
import { getPalettesFromProjects } from './color-utils';

const plymouth =
  "https://temperature-blanket.com/yarn?s=511206a31e0bd30e16f04f1dfdb7198591292d6c761077ae032849&f=plymouth_yarn-worsted_merino_superwash(0'5'8)plymouth_yarn-dk_merino_superwash(1'7)plymouth_yarn-encore_worsted(2'3'4'6)";
const hobbii =
  'https://temperature-blanket.com/yarn?s=1d1a1b46203ca92e67a4435ba75f31c36647eec066f3d488f9f0c6fbfbfb&f=hobbii-amigo';

const palettePost = (databaseId: number, link: string) => ({
  __typename: 'Palette' as const,
  databaseId,
  title: `Palette ${databaseId}`,
  yarnUrls: JSON.stringify([link]),
});

beforeAll(async () => {
  await ensureYarnData();
});

describe('getPalettesFromProjects grouping', () => {
  it('lists the same colors on the first card found', () => {
    const palettes = getPalettesFromProjects({
      projects: [
        palettePost(3, plymouth),
        palettePost(2, hobbii),
        palettePost(1, plymouth),
      ],
    });
    expect(palettes.map((p) => p.page.id)).toEqual([3, 2]);
    expect(palettes[0].others).toEqual([
      { id: 1, title: 'Palette 1', kind: 'palette' },
    ]);
    expect(palettes[1].others).toEqual([]);
  });

  it('groups after the filters', () => {
    const palettes = getPalettesFromProjects({
      projects: [
        palettePost(3, plymouth),
        palettePost(2, hobbii),
        palettePost(1, hobbii),
      ],
      selectedBrandId: 'hobbii',
    });
    expect(palettes.map((p) => p.page.id)).toEqual([2]);
    expect(palettes[0].others.map((o) => o.id)).toEqual([1]);
  });

  it('doesn’t list a project’s own repeated gauge as another page', () => {
    const palettes = getPalettesFromProjects({
      projects: [
        {
          __typename: 'Project',
          databaseId: 9,
          projectUrl: 'https://temperature-blanket.com/#l=x',
          locations: '[]',
          yarnUrls: JSON.stringify([hobbii, hobbii]),
        },
      ],
    });
    expect(palettes).toHaveLength(1);
    expect(palettes[0].others).toEqual([]);
  });
});
