import type { Brand } from '$lib/types';
import { yarn as cottonAran } from './cotton-aran/yarn';
import { yarn as simplyDK } from './simply-dk/yarn';

export const brand: Brand = {
  name: 'Paintbox Yarns',
  id: 'paintbox_yarns',
  yarns: [cottonAran, simplyDK],
};
