import type { Brand } from '$lib/types';
import { yarn as cottonDK } from './cotton-dk/yarn';
import { yarn as createDK } from './create-dk/yarn';

export const brand: Brand = {
  name: 'Yarnsmiths',
  id: 'yarnsmiths',
  yarns: [cottonDK, createDK],
};
