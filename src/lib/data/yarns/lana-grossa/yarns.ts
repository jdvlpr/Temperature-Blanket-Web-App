import type { Brand } from '$lib/types/yarn-types';
import { yarn as coolWool } from './cool-wool/yarn';
import { yarn as coolWoolBig } from './cool-wool-big/yarn';
import { yarn as coolWoolSuperbig } from './cool-wool-superbig/yarn';
import { yarn as summerSoftness } from './summer-softness/yarn';

export const brand: Brand = {
  name: 'Lana Grossa',
  id: 'lana_grossa',
  yarns: [coolWool, coolWoolBig, coolWoolSuperbig, summerSoftness],
};
