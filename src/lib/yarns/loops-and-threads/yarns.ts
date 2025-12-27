import type { Brand } from '$lib/types';
import { yarn as classicCotton } from './classic-cotton/yarn';
import { yarn as colorCraft } from './color-craft/yarn';
import { yarn as impeccable } from './impeccable/yarn';
import { yarn as silkySoft } from './silky-soft/yarn';
import { yarn as softAndShinySolid } from './soft-and-shiny/yarn';
import { yarn as softClassic } from './soft-classic/yarn';

export const brand: Brand = {
  name: 'Loops & Threads',
  id: 'loops_and_threads',
  yarns: [
    classicCotton,
    colorCraft,
    impeccable,
    silkySoft,
    softAndShinySolid,
    softClassic,
  ],
};
