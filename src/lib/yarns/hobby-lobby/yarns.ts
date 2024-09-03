import type { Brand } from '$lib/types';
import { yarn as iLoveThisCottonYarn } from './i-love-this-cotton-yarn/yarn';
import { yarn as iLoveThisYarn } from './i-love-this-yarn/yarn';
import { yarn as yarnBeeSoftAndSleek } from './yarn-bee-soft-and-sleek/yarn';

export const brand: Brand = {
  name: 'Hobby Lobby',
  id: 'hobby_lobby',
  yarns: [iLoveThisCottonYarn, iLoveThisYarn, yarnBeeSoftAndSleek],
};
