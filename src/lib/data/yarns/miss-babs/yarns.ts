import type { Brand } from '$lib/types';
import { yarn as sojourn } from './sojourn/yarn';

export const brand: Brand = {
  name: 'Miss Babs',
  id: 'miss_babs',
  yarns: [sojourn],
};
