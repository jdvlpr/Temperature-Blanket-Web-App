import type { Brand } from '$lib/types/yarn-types';
import { yarn as cottonsoftDk } from './cottonsoft-dk/yarn';

export const brand: Brand = {
  id: 'king_cole',
  name: 'King Cole',
  yarns: [cottonsoftDk],
};
