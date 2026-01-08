import type { Brand } from '$lib/types';
import { yarn as pingoFirst } from './pingo-first/yarn';

export const brand: Brand = {
  name: 'Pingouin',
  id: 'pingouin',
  yarns: [pingoFirst],
};
