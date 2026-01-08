import type { Brand } from '$lib/types';
import { yarn as merinoBaby } from './merino-baby/yarn';
import { yarn as merinoClassic } from './merino-classic/yarn';
import { yarn as planet } from './planet/yarn';
import { yarn as promoFin } from './promo-fin/yarn';

export const brand: Brand = {
  name: 'Katia',
  id: 'katia',
  yarns: [merinoBaby, merinoClassic, planet, promoFin],
};
