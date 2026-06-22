import type { Brand } from '$lib/types/yarn-types';
import { yarn as superSaverSolids } from './super-saver-solids/yarn';
import { yarn as withLove } from './with-love/yarn';

export const brand: Brand = {
  name: 'Red Heart',
  id: 'red_heart',
  yarns: [superSaverSolids, withLove],
};
