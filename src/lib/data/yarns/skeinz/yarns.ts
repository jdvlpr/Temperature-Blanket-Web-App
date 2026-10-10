import type { Brand } from '#lib/types/yarn-types.js';
import { yarn as eros } from './eros/yarn';

export const brand: Brand = {
  name: 'Skeinz',
  id: 'skeinz',
  yarns: [eros],
};
