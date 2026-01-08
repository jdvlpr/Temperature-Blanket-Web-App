import type { Brand } from '$lib/types';
import { yarn as clearAsCotton } from './clear-as-cotton/yarn';
import { yarn as dirtyDk } from './dirty-dk/yarn';

export const brand: Brand = {
  name: 'Source of Fibre',
  id: 'source_of_fibre',
  yarns: [clearAsCotton, dirtyDk],
};
