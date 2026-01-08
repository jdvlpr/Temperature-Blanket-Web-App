import type { Brand } from '$lib/types';
import { yarn as comfort } from './comfort/yarn';
import { yarn as remixLight } from './remix-light/yarn';
import { yarn as remix } from './remix/yarn';
import { yarn as ultraWoolDK } from './ultra-wool-dk/yarn';
import { yarn as ultraWool } from './ultra-wool/yarn';
import { yarn as vintageBaby } from './vintage-baby/yarn';
import { yarn as vintage } from './vintage/yarn';

export const brand: Brand = {
  name: 'Berroco',
  id: 'berroco',
  yarns: [
    comfort,
    remix,
    remixLight,
    ultraWool,
    ultraWoolDK,
    vintage,
    vintageBaby,
  ],
};
