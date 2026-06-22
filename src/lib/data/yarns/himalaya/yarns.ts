import type { Brand } from '$lib/types/yarn-types';
import { yarn as dolphinBaby } from './dolphin-baby/yarn';
import { yarn as everyday } from './everyday/yarn';
import { yarn as everydayWorsted } from './everyday-worsted/yarn';
import { yarn as velvet } from './velvet/yarn';

export const brand: Brand = {
  name: 'Himalaya',
  id: 'himalaya',
  yarns: [dolphinBaby, everyday, everydayWorsted, velvet],
};
