import type { Brand } from '$lib/types';
import { yarn as onePound } from './one-pound/yarn';
import { yarn as simplySoftBrites } from './simply-soft-brites/yarn';
import { yarn as simplySoftSolids } from './simply-soft-solids/yarn';

export const brand: Brand = {
  name: 'Caron',
  id: 'caron',
  yarns: [onePound, simplySoftBrites, simplySoftSolids],
};
