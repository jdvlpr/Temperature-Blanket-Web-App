import type { Brand } from '$lib/types';
import { yarn as marvel } from './marvel/yarn';

export const brand: Brand = {
  name: 'Yarnalia',
  id: 'yarnalia',
  yarns: [marvel],
};
