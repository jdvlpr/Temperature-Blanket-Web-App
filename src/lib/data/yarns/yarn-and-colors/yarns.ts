import type { Brand } from '$lib/types/yarn-types';
import { yarn as epic } from './epic/yarn';

export const brand: Brand = {
  name: 'Yarn and Colors',
  id: 'yarn_and_colors',
  yarns: [epic],
};
