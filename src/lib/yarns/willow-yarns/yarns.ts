import type { Brand } from '$lib/types';
import { yarn as washWorsted } from './wash-worsted/yarn';

export const brand: Brand = {
  name: 'Willow Yarns',
  id: 'willow_yarns',
  yarns: [washWorsted],
};
