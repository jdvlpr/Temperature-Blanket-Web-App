import type { Brand } from '$lib/types';
import { yarn as organicCottonWorsted } from './organic-cotton-worsted/yarn';
import { yarn as sweater } from './sweater/yarn';

export const brand: Brand = {
  id: 'blue_sky_fibers',
  name: 'Blue Sky Fibers',
  yarns: [organicCottonWorsted, sweater],
};
