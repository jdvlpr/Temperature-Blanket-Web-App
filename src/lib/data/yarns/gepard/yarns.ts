import type { Brand } from '#lib/types/yarn-types.js';
import { yarn as puraLana } from './pura-lana/yarn';

export const brand: Brand = {
  name: 'Gepard',
  id: 'gepard',
  yarns: [puraLana],
};
