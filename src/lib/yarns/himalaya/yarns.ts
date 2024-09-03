import type { Brand } from '$lib/types';
import { yarn as dolphinBaby } from './dolphin-baby/yarn';
import { yarn as everydayWorsted } from './everyday-worsted/yarn';
import { yarn as everyday } from './everyday/yarn';

export const brand: Brand = {
  name: 'Himalaya',
  id: 'himalaya',
  yarns: [everyday, everydayWorsted, dolphinBaby],
};
