import type { GaugeAttributes, GaugeSettingsType } from '$lib/types';
import { getRanges } from '$lib/utils';
import chroma from 'chroma-js';

export const gaugeAttributes: GaugeAttributes = {
  id: 'moon',
  label: 'Moon Phase Gauge',
  unit: {
    type: 'static',
    label: {
      metric: '',
      imperial: '',
    },
  },
  targets: [
    {
      id: 'moon',
      label: 'Moon Phase',
      type: 'static',
      gaugeLabel: 'Moon Phase',
      shortLabel: 'Moon Phase',
      pdfHeader: {
        metric: 'Moon Phase',
        imperial: 'Moon Phase',
      },
      icon: '●',
    },
  ],
};

function getFirstRanges({
  rangeOptions,
  start,
  increment,
  colors,
  includeFromAndTo,
  dontIncludeFromAndTo,
}) {
  const { ranges } = getRanges({
    rangeOptions,
    ranges: [],
    start,
    increment,
    colors,
    includeFromAndTo,
    dontIncludeFromAndTo,
  });
  return ranges;
}

export class MoonPhaseGauge {
  constructor() {
    // Assign the gauge attributes as properties
    Object.assign(this, gaugeAttributes);

    // Since rangeOptions needs to be $state that the user can update,
    // it doesn't benefit from the derived auto properties which are used to calculate the rangeOptions
    // So we need to set up an $effect to update the rangeOptions with the default derived values when the project loads
    $effect.root(() => {
      $effect(() => {
        if (!Number.isFinite(this.rangeOptions?.auto.increment))
          this.rangeOptions.auto.increment =
            this.autoRangeOptions?.auto.increment;

        if (!Number.isFinite(this.rangeOptions?.auto.start.high))
          this.rangeOptions.auto.start.high =
            this.autoRangeOptions?.auto.start.high;

        if (!Number.isFinite(this.rangeOptions?.auto.start.low))
          this.rangeOptions.auto.start.low =
            this.autoRangeOptions?.auto.start.low;

        if (!Number.isFinite(this.rangeOptions?.manual.start))
          this.rangeOptions.manual.start = this.autoRangeOptions?.manual.start;

        if (!Number.isFinite(this.rangeOptions?.manual.increment))
          this.rangeOptions.manual.increment =
            this.autoRangeOptions?.manual.increment;
      });
    });
  }

  // *************************
  // Derived properties from weather data
  // Used for auto calculating ranges
  // *************************

  // All the values from the weather data
  #values = [0, 1, 2, 3, 4, 5, 6, 7];

  #max = 8;
  #min = 0;

  colors = $state(
    chroma
      .scale('Greys')
      .colors(8)
      .map((n) => {
        return { hex: n };
      }),
  );

  rangeOptions = {
    auto: {
      optimization: 'ranges',
      start: {
        high: 7,
        low: -1,
      },
      increment: 1,
      roundIncrement: true,
    },
    manual: {
      start: -1,
      increment: 1,
    },
    direction: 'low-to-high',
    includeFromValue: false,
    includeToValue: true,
    linked: true,
    mode: 'auto', // equal range increments ('auto') | equal days ('jenks') | 'manua'
    isCustomRanges: false,
  };

  // *************************
  // Derived properties from ranges
  // Used for auto calculating ranges
  // *************************

  autoRangeOptions = $derived({
    auto: {
      optimization: this.rangeOptions.auto.optimization,
      start: {
        high: 7,
        low: -1,
      },
      increment: 1,
      roundIncrement: this.rangeOptions.auto.roundIncrement,
    },
    manual: {
      start: -1,
      increment: 1,
    },
    direction: this.rangeOptions.direction,
    includeFromValue: this.rangeOptions.includeFromValue,
    includeToValue: this.rangeOptions.includeToValue,
    linked: this.rangeOptions.linked,
    mode: this.rangeOptions.mode, // equal range increments ('auto') | equal days ('jenks') | 'manua'
    isCustomRanges: this.rangeOptions.isCustomRanges,
  });

  #start = -1;

  #increment = 1;

  #dontIncludeFromAndTo = $derived(
    !this.rangeOptions.includeFromValue && !this.rangeOptions.includeToValue,
  );

  #includeFromAndTo = $derived(
    this.rangeOptions.includeFromValue && this.rangeOptions.includeToValue,
  );

  numberOfColors = $state(8);

  schemeId = $state('Greys');

  ranges = $state(
    getFirstRanges({
      rangeOptions: this.rangeOptions,
      start: this.#start,
      increment: this.#increment,
      colors: this.colors,
      includeFromAndTo: this.#includeFromAndTo,
      dontIncludeFromAndTo: this.#dontIncludeFromAndTo,
    }),
  );

  calculating = $state(false);

  // *************************
  // Methods
  // *************************
  updateColors({ colors }) {
    this.calculating = true;
    this.colors = colors;
    const { ranges, mode, isCustomRanges } = getRanges({
      rangeOptions: this.rangeOptions,
      ranges: this.ranges,
      start: this.#start,
      increment: this.#increment,
      colors: this.colors,
      includeFromAndTo: this.#includeFromAndTo,
      dontIncludeFromAndTo: this.#dontIncludeFromAndTo,
    });
    this.ranges = ranges;
    this.rangeOptions = this.rangeOptions;
    this.rangeOptions.mode = mode;
    this.rangeOptions.isCustomRanges = isCustomRanges;
    this.numberOfColors = this.colors.length;
    this.calculating = false;
  }

  updateSettings({ settings }: { settings: GaugeSettingsType }) {
    this.calculating = true;
    this.colors = settings.colors;
    this.numberOfColors = settings.numberOfColors;
    this.rangeOptions = { ...this.rangeOptions, ...settings.rangeOptions };
    this.ranges = settings.ranges;
    this.schemeId = settings.schemeId;
    this.calculating = false;
  }
}
