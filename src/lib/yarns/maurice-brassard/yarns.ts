import type { Brand } from '$lib/types';
import { yarn as cotton } from './cotton/yarn';

export const brand: Brand = {
  name: 'Maurice Brassard',
  id: 'maurice_brassard',
  yarns: [cotton],
};
