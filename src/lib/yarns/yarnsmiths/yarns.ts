import type { Brand } from '$lib/types';
import { yarn as createDK } from './create-dk/yarn';

export const brand: Brand = {
  name: 'Yarnsmiths',
  id: 'yarnsmiths',
  yarns: [createDK],
};
