import type { Brand } from '$lib/types/yarn-types';
import { yarn as rudy } from './rudy/yarn';

export const brand: Brand = {
  name: 'Tricot Cafè',
  id: 'tricot_cafe',
  yarns: [rudy],
};
