import type { Brand } from '$lib/types';
import { yarn as skipper } from './skipper/yarn';

export const brand: Brand = {
  name: 'Kelbourne Woolens',
  id: 'kelbourne_woolens',
  yarns: [skipper],
};
