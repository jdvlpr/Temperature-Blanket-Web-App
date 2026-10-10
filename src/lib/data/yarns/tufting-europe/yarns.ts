import type { Brand } from '#lib/types/yarn-types.js';
import { yarn as newZealandWool } from './new-zealand-wool/yarn';

export const brand: Brand = {
  name: 'Tufting Europe',
  id: 'tufting_europe',
  yarns: [newZealandWool],
};
