import type { Brand } from '$lib/types';
import { yarn as lorenaWorsted } from './lorena-worsted/yarn';

export const brand: Brand = {
  name: 'Ice Yarns',
  id: 'ice_yarns',
  yarns: [lorenaWorsted],
};
