import { CHARACTERS_FOR_URL_HASH } from '$lib/constants';
import { gauges, previews, project, weather } from '$lib/state';
import {
  displayNumber,
  getWeatherTargets,
  setTargets,
  upToDate,
} from '$lib/utils';
import Preview from './Preview.svelte';
import Settings from './Settings.svelte';
import chroma from 'chroma-js';

function getNumberOfStitchesInRound(round) {
  if (round === 1) return 4;
  return getEndOfRoundStitch(round) - getEndOfRoundStitch(round - 1);
}

function getEndOfRoundStitch(round) {
  if (round <= 1) return round * 4;
  return 4 * round + getEndOfRoundStitch(round - 1);
}
export class ContinuousSquarePreviewClass {
  constructor() {
    $effect.root(() => {
      // If a gauge is created or deleted, handle updating the available weather parameter targets
      $effect(() => {
        if (gauges.allCreated.length) {
          this.settings.selectedTarget = setTargets(
            this.settings.selectedTarget,
          );
        }
      });
    });
  }

  // *******************
  // Constant properties
  // *******************
  name = 'Continuous Square';

  id = 'cosq';

  svg = $state();

  img = {
    light: './images/preview_icons/cosq_black.png',
    dark: './images/preview_icons/cosq_white.png',
  };

  wpTagId = 8;

  wpTagSlug = 'continuous-square';

  settingsComponent = Settings;

  previewComponent = Preview;

  sections = $state([]);

  STITCH_SIZE = 5;

  // *******************
  // User settings properties
  // *******************
  settings = $state({
    selectedTarget: 'tmax',
    stitchesPerDay: 28,
    extrasColor: '#f0f3f3',
  });

  // *******************
  // Derived properties
  // *******************

  dayStitches = $derived(this.settings.stitchesPerDay * weather.data?.length);

  initialRounds = $derived.by(() => {
    let round = 1;
    for (let stitch = 1; stitch <= this.dayStitches; stitch += 1) {
      if (stitch === getEndOfRoundStitch(round) + 1) round += 1;
    }
    return round;
  });

  initialTotalStitches = $derived(getEndOfRoundStitch(this.initialRounds));

  initialCountOfAdditionalStitches = $derived(
    this.initialTotalStitches - this.dayStitches + this.settings.stitchesPerDay,
  );

  rounds = $derived(
    this.initialCountOfAdditionalStitches >
      getNumberOfStitchesInRound(this.initialRounds)
      ? this.initialRounds - 1
      : this.initialRounds,
  );

  totalStitches = $derived(getEndOfRoundStitch(this.rounds));

  countOfAdditionalStitches = $derived(
    this.totalStitches - this.dayStitches + this.settings.stitchesPerDay,
  );

  details = $derived({
    rounds: this.rounds,
    countOfAdditionalStitches: this.countOfAdditionalStitches,
  });

  width = $derived(
    displayNumber(Math.sqrt(this.totalStitches) * this.STITCH_SIZE * 3),
  );

  height = $derived(
    displayNumber(Math.sqrt(this.totalStitches) * this.STITCH_SIZE * 3),
  );

  targets = $derived(
    getWeatherTargets({
      weatherParameters: { [this.settings.selectedTarget]: true },
    }),
  );

  // *******************
  // URL hash derived from settings
  // *******************
  hash = $derived.by(() => {
    let hash = '&';
    hash += `${this.id}=`;
    hash += `${this.settings.selectedTarget}`;
    hash += '(';
    hash += this.settings.stitchesPerDay;
    if (this.details && this.details.countOfAdditionalStitches > 0)
      hash += `${CHARACTERS_FOR_URL_HASH.separator}${chroma(this.settings.extrasColor).hex().substring(1)}`;
    hash += ')';
    return hash;
  });

  // *******************
  // Method for loading settings from a url hash string
  // *******************
  load(hash) {
    let startIndex, separatorIndex, lengthEndIndex;

    for (let i = 0; i < hash.length; i++) {
      if (hash[i] === '(') startIndex = i;
      if (
        hash[i] === CHARACTERS_FOR_URL_HASH.separator ||
        hash[i] == CHARACTERS_FOR_URL_HASH.separator_alt
      )
        separatorIndex = i;
      if (hash[i] === ')') lengthEndIndex = i;
    }

    if (!startIndex || !lengthEndIndex) return; // format of hash was wrong, so stop processing

    let target = hash.substring(0, startIndex);
    this.settings.selectedTarget = target;

    // stitches per day
    let stitchesPerDay;
    if (separatorIndex) {
      stitchesPerDay = +hash.substring(startIndex + 1, separatorIndex);
    } else if (lengthEndIndex) {
      stitchesPerDay = +hash.substring(startIndex + 1, lengthEndIndex);
    }
    this.settings.stitchesPerDay = stitchesPerDay;

    // color
    let color = '';
    if (separatorIndex && lengthEndIndex) {
      color = hash.substring(separatorIndex + 1, lengthEndIndex);
    }
    if (chroma.valid(color)) this.settings.extrasColor = chroma(color).hex();

    previews.activeId = this.id;
  }
}

export const continuousSquarePreview = new ContinuousSquarePreviewClass();
