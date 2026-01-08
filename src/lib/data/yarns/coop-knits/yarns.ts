import type { Brand } from '$lib/types';
import { yarn as socksYeah } from './socks-yeah/yarn';

export const brand: Brand = {
  name: 'Coop Knits',
  id: 'coop_knits',
  yarns: [socksYeah],
};
