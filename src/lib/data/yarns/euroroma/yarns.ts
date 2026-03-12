import type { Brand } from '$lib/types/yarn-types';
import { yarn as ecoamigurumi } from './ecoamigurumi/yarn';

export const brand: Brand = {
  name: 'Euroroma',
  id: 'euroroma',
  yarns: [ecoamigurumi],
};
