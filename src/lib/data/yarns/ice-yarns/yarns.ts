import type { Brand } from '$lib/types';
import { yarn as classicDK } from './classic-dk/yarn';
import { yarn as lorenaWorsted } from './lorena-worsted/yarn';

export const brand: Brand = {
  name: 'Ice Yarns',
  id: 'ice_yarns',
  yarns: [classicDK, lorenaWorsted],
};
