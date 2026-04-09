import type { Brand } from '$lib/types/yarn-types';
import { yarn as highlandHeathersDk } from './highland-heathers-dk/yarn';
import { yarn as lifeDk } from './life-dk/yarn';
import { yarn as naturalsBambooCotton } from './naturals-bamboo-cotton/yarn';
import { yarn as naturalsOrganicCotton } from './naturals-organic-cotton/yarn';
import { yarn as specialDk } from './special-dk/yarn';

export const brand: Brand = {
  name: 'Stylecraft',
  id: 'stylecraft',
  yarns: [
    highlandHeathersDk,
    lifeDk,
    naturalsBambooCotton,
    naturalsOrganicCotton,
    specialDk,
  ],
};
