import type { Brand } from '$lib/types';
import { yarn as rios } from './rios/yarn';
import { yarn as worsted } from './worsted/yarn';

export const brand: Brand = {
  name: 'Malabrigo',
  id: 'malabrigo',
  yarns: [rios, worsted],
};
