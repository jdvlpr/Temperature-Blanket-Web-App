import type { Brand } from '$lib/types/yarn-types';
import { yarn as worsted8 } from './worsted-8/yarn';
import { yarn as worsted8Heathers } from './worsted-8-heathers/yarn';

export const brand: Brand = {
  name: 'Herrschners',
  id: 'herrschners',
  yarns: [worsted8, worsted8Heathers],
};
