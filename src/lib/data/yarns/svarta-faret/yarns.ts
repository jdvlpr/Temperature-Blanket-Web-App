import type { Brand } from '$lib/types';
import { yarn as tilda } from './tilda/yarn';
import { yarn as ulrikaUllgarn } from './ulrika-ullgarn/yarn';

export const brand: Brand = {
  name: 'Svarta Fåret',
  id: 'svarta_faret',
  yarns: [tilda, ulrikaUllgarn],
};
