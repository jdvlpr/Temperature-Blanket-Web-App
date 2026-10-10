import type { Brand } from '#lib/types/yarn-types.js';
import { yarn as superwashClassic } from './superwash-classic/yarn';

export const brand: Brand = {
  name: 'Ella Rae',
  id: 'ella_rae',
  yarns: [superwashClassic],
};
