import type { Brand } from '$lib/types';
import { yarn as organicCottonWorsted } from './organic-cotton-worsted/yarn';

export const brand: Brand = {
  id: 'blue_sky_fibers',
  name: 'Blue Sky Fibers',
  yarns: [organicCottonWorsted],
};
