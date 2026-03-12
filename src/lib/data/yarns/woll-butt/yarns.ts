import type { Brand } from '$lib/types/yarn-types';
import { yarn as innsbruckUni } from './innsbruck-uni/yarn';

export const brand: Brand = {
  id: 'woll_butt',
  name: 'Woll Butt',
  yarns: [innsbruckUni],
};
