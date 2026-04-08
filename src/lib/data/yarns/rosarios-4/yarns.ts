import type { Brand } from '$lib/types/yarn-types';
import { yarn as beCool } from './be-cool/yarn';
import { yarn as forNature } from './for-nature/yarn';

export const brand: Brand = {
  name: 'Rosários 4',
  id: 'rosarios_4',
  yarns: [beCool, forNature],
};
