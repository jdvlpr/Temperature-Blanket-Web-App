import type { Yarn } from '$lib/types';
import colorways from './colorways';

export const yarn: Yarn = {
  colorways,
  name: 'Cotton',
  id: 'cotton',
  weightId: 'a', // As far as I can tell, this yarn comes in several different weights. I chose the largest one, I think.
};
