import type { Brand } from '$lib/types';
import { yarn as impeccable } from './impeccable/yarn';
import { yarn as silkySoft } from './silky-soft/yarn';
import { yarn as softAndShinySolid } from './soft-and-shiny/yarn';
import { yarn as softClassic } from './soft-classic/yarn';

export const brand: Brand = {
  name: 'Loops & Threads',
  id: 'loops_and_threads',
  yarns: [impeccable, silkySoft, softAndShinySolid, softClassic],
};
