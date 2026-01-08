import type { Brand } from '$lib/types';
import { yarn as naturalsBambooCotton } from './naturals-bamboo-cotton/yarn';
import { yarn as naturalsOrganicCotton } from './naturals-organic-cotton/yarn';
import { yarn as specialDk } from './special-dk/yarn';

export const brand: Brand = {
  name: 'Stylecraft',
  id: 'stylecraft',
  yarns: [naturalsBambooCotton, naturalsOrganicCotton, specialDk],
};
