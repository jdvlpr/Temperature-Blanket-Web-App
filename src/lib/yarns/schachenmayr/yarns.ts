import type { Brand } from '$lib/types';
import { yarn as bravo } from './bravo/yarn';
import { yarn as catania } from './catania/yarn';

export const brand: Brand = {
  name: 'Schachenmayr',
  id: 'schachenmayr',
  yarns: [bravo, catania],
};
