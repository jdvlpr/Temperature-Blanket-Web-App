import type { Brand } from '$lib/types/yarn-types';
import { yarn as stallion } from './stallion-8-ply/yarn';

export const brand: Brand = {
  name: 'Semco',
  id: 'semco',
  yarns: [stallion],
};
