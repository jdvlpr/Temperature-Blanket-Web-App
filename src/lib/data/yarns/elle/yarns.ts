import type { Brand } from '$lib/types/yarn-types';
import { yarn as charityDk } from './charity-dk/yarn';

export const brand: Brand = {
  name: 'Elle',
  id: 'elle',
  yarns: [charityDk],
};
