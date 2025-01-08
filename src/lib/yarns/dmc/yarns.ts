import type { Brand } from '$lib/types';
import { yarn as embroideryThread } from './embroidery-thread/yarn';

export const brand: Brand = {
  name: 'DMC',
  id: 'dmc',
  yarns: [embroideryThread],
};
