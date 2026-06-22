import type { Brand } from '$lib/types/yarn-types';
import { yarn as marvel } from './marvel/yarn';

export const brand: Brand = {
  name: 'Yarnalia',
  id: 'yarnalia',
  yarns: [marvel],
};
