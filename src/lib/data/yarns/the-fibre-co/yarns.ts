import type { Brand } from '$lib/types';
import { yarn as cirro } from './cirro/yarn';

export const brand: Brand = {
  name: 'The Fibre Co.',
  id: 'the_fibre_co',
  yarns: [cirro],
};
