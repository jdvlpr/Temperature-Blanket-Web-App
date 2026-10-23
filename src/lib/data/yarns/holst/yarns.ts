import type { Brand } from '#lib/types/yarn-types.js';
import { yarn as coast } from './coast/yarn';
import { yarn as supersoft } from './supersoft/yarn';

export const brand: Brand = {
  name: 'Holst',
  id: 'holst',
  yarns: [coast, supersoft],
};
