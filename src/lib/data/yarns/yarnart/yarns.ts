import type { Brand } from '$lib/types';
import { yarn as elite } from './elite/yarn';
import { yarn as jeans } from './jeans/yarn';

export const brand: Brand = {
  name: 'YarnArt',
  id: 'yarnart',
  yarns: [elite, jeans],
};
