import type { Brand } from '$lib/types';
import { yarn as cottonEightEight } from './cotton-8-8/yarn';
import { yarn as velvetLux } from './velvet-lux/yarn';

export const brand: Brand = {
  name: 'LindeHobby',
  id: 'lindehobby',
  yarns: [cottonEightEight, velvetLux],
};
