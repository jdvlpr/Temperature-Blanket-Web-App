import type { Brand } from '$lib/types';
import { yarn as jeans } from './jeans/yarn';

export const brand: Brand = {
  name: 'YarnArt',
  id: 'yarnart',
  yarns: [jeans],
};
