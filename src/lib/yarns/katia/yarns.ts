import type { Brand } from '$lib/types';
import { yarn as merinoClassic } from './merino-classic/yarn';
import { yarn as planet } from './planet/yarn';
import { yarn as promoFin } from './promo-fin/yarn';

export const brand: Brand = {
  name: 'Katia',
  id: 'katia',
  yarns: [merinoClassic, planet, promoFin],
};
