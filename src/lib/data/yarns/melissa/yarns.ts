import type { Brand } from '#lib/types/yarn-types.js';
import { yarn as lanaMediana } from './lana-mediana/yarn';

export const brand: Brand = {
  name: 'Melissa',
  id: 'melissa',
  yarns: [lanaMediana],
};
