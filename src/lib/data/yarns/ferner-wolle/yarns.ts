import type { Brand } from '$lib/types/yarn-types';
import { yarn as merino160 } from './merino-160/yarn';

export const brand: Brand = {
  name: 'Ferner Wolle',
  id: 'ferner_wolle',
  yarns: [merino160],
};
