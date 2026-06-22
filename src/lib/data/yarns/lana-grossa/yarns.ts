import type { Brand } from '$lib/types/yarn-types';
import { yarn as coolWoolSuperbig } from './cool-wool-superbig/yarn';

export const brand: Brand = {
  name: 'Lana Grossa',
  id: 'lana_grossa',
  yarns: [coolWoolSuperbig],
};
