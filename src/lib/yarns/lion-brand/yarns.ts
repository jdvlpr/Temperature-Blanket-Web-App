import type { Brand } from '$lib/types';
import { yarn as twentyFourSevenCotton } from './24-7-cotton/yarn';
import { yarn as basicStitchAntiMicrobial } from './basic-stitch-anti-microbial/yarn';
import { yarn as basicStitchAntiPilling } from './basic-stitch-anti-pilling/yarn';
import { yarn as coboo } from './coboo/yarn';
import { yarn as colorTheory } from './color-theory/yarn';
import { yarn as feelsLikeButta } from './feels-like-butta/yarn';
import { yarn as heartland } from './heartland/yarn';
import { yarn as hueMe } from './hue-me/yarn';
import { yarn as lbCollectionSuperwashMerino } from './lb-collection-superwash-merino/yarn';
import { yarn as poundOfLove } from './pound-of-love/yarn';
import { yarn as schittsCreek } from './schitts-creek/yarn';
import { yarn as truboo } from './truboo/yarn';
import { yarn as vannasChoice } from './vannas-choice/yarn';
import { yarn as woolEase } from './wool-ease/yarn';

export const brand: Brand = {
  name: 'Lion Brand',
  id: 'lion_brand',
  yarns: [
    twentyFourSevenCotton,
    basicStitchAntiMicrobial,
    basicStitchAntiPilling,
    coboo,
    colorTheory,
    feelsLikeButta,
    heartland,
    hueMe,
    lbCollectionSuperwashMerino,
    poundOfLove,
    schittsCreek,
    truboo,
    vannasChoice,
    woolEase,
  ],
};
