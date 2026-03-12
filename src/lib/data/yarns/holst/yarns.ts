import type { Brand } from '$lib/types/yarn-types';
import { yarn as coast } from './coast/yarn';

export const brand: Brand = {
  name: 'Holst',
  id: 'holst',
  yarns: [coast],
};
