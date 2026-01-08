import type { Brand } from '$lib/types';
import { yarn as classic8Ply } from './classic-8-ply/yarn';
import { yarn as cotton10Ply } from './cotton-10-ply/yarn';

export const brand: Brand = {
  name: 'Bendigo Woolen Mills',
  id: 'bendigo_woolen_mills',
  yarns: [classic8Ply, cotton10Ply],
};
