import type { Brand } from '#lib/types/yarn-types.js';
import { yarn as spindrift } from './spindrift/yarn';

export const brand: Brand = {
  name: "Jamieson's of Shetland",
  id: 'jamiesons_of_shetland',
  yarns: [spindrift],
};
