import type { Brand } from '$lib/types';
import { yarn as afternoonCotton } from './afternoon-cotton/yarn';
import { yarn as antiPillingEverydayDK } from './anti-pilling-everyday-dk/yarn';
import { yarn as antiPillingEverydayWorsted } from './anti-pilling-everyday-worsted/yarn';
import { yarn as basixDK } from './basix-dk/yarn';
import { yarn as basixWorsted } from './basix-worsted/yarn';
import { yarn as homeCottonSolids } from './home-cotton-solids/yarn';
import { yarn as parfaitChunky } from './parfait-chunky/yarn';
import { yarn as retroVelvet } from './retro-velvet/yarn';
import { yarn as stitchPlease } from './stitch-please-superwash-worsted/yarn';

export const brand: Brand = {
  name: 'Premier',
  id: 'premier',
  yarns: [
    afternoonCotton,
    antiPillingEverydayDK,
    antiPillingEverydayWorsted,
    basixDK,
    basixWorsted,
    homeCottonSolids,
    parfaitChunky,
    retroVelvet,
    stitchPlease,
  ],
};
