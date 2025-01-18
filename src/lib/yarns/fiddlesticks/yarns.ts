import type { Brand } from '$lib/types';
import { yarn as finch } from './finch/yarn';
import { yarn as posie } from './posie/yarn';
import { yarn as superb8 } from './superb-8/yarn';
import { yarn as superb10 } from './superb-10/yarn';
import { yarn as wren } from './wren/yarn';

export const brand: Brand = {
  name: 'Fiddlesticks',
  id: 'fiddlesticks',
  yarns: [finch, posie, superb8, superb10, wren],
};
