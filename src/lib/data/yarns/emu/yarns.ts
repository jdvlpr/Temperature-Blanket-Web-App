import type { Brand } from '#lib/types/yarn-types.js';
import { yarn as classicDk } from './classic-dk/yarn';

export const brand: Brand = {
  name: 'Emu',
  id: 'emu',
  yarns: [classicDk],
};
