import type { Brand } from '$lib/types/yarn-types';
import { yarn as germantown } from './germantown/yarn';
import { yarn as skipper } from './skipper/yarn';

export const brand: Brand = {
  name: 'Kelbourne Woolens',
  id: 'kelbourne_woolens',
  yarns: [germantown, skipper],
};
