import type { Brand } from '$lib/types';
import { yarn as heyfieldBonusDK } from './heyfield-bonus-dk/yarn';

export const brand: Brand = {
  name: 'Sirdar',
  id: 'sirdar',
  yarns: [heyfieldBonusDK],
};
