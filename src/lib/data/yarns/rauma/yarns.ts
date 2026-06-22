import type { Brand } from '$lib/types/yarn-types';
import { yarn as finull } from './finull/yarn';

export const brand: Brand = {
  name: 'Rauma',
  id: 'rauma',
  yarns: [finull],
};
