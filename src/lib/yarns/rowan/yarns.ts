import type { Brand } from '$lib/types';
import { yarn as feltedTweed } from './felted-tweed/yarn';

export const brand: Brand = {
  name: 'Rowan',
  id: 'rowan',
  yarns: [feltedTweed],
};
