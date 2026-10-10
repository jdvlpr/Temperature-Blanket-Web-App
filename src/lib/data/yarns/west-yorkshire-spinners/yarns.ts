import type { Brand } from '#lib/types/yarn-types.js';
import { yarn as theCroftDK } from './the-croft-dk/yarn';

export const brand: Brand = {
  name: 'West Yorkshire Spinners',
  id: 'west_yorkshire_spinners',
  yarns: [theCroftDK],
};
