import type { Brand } from '$lib/types/yarn-types';
import { yarn as acidDyes } from './acid-dyes/yarn';
import { yarn as fiberReactiveProcionDyes } from './fiber-reactive-procion-dyes/yarn';

export const brand: Brand = {
  name: 'Dharma',
  id: 'dharma',
  yarns: [acidDyes, fiberReactiveProcionDyes],
};
