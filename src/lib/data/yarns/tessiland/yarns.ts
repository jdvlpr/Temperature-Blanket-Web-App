import type { Brand } from '$lib/types';
import { yarn as chuck } from './chuck/yarn';

export const brand: Brand = {
  name: 'Tessiland',
  id: 'tessiland',
  yarns: [chuck],
};
