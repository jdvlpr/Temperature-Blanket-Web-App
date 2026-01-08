import type { Brand } from '$lib/types';
import { yarn as organicCottonWorsted } from './organic-cotton-worsted/yarn';
import { yarn as sweater } from './sweater/yarn';
import { yarn as woolstokLight } from './woolstok-light/yarn';

export const brand: Brand = {
  id: 'blue_sky_fibers',
  name: 'Blue Sky Fibers',
  yarns: [organicCottonWorsted, sweater, woolstokLight],
};
