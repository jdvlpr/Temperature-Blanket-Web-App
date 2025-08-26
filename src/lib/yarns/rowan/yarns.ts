import type { Brand } from '$lib/types';
import { yarn as cottonGlace } from './cotton-glace/yarn';
import { yarn as feltedTweed } from './felted-tweed/yarn';
import { yarn as handknitCotton } from './handknit-cotton/yarn';

export const brand: Brand = {
  name: 'Rowan',
  id: 'rowan',
  yarns: [cottonGlace, feltedTweed, handknitCotton],
};
