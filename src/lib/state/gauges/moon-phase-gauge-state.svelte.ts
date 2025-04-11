import { MOON_PHASE_NAMES } from '$lib/constants';
import type {
  Color,
  GaugeAttributes,
  GaugeRangeCategory,
  GaugeSettingsType,
} from '$lib/types';
import chroma from 'chroma-js';

export const gaugeAttributes: GaugeAttributes = {
  id: 'moon',
  isStatic: true,
  label: 'Moon Phase Gauge',
  unit: {
    type: 'category',
    label: {
      metric: '',
      imperial: '',
    },
  },
  targets: [
    {
      id: 'moon',
      label: 'Moon Phase',
      type: 'category',
      gaugeLabel: 'Moon Phase',
      shortLabel: 'Moon Phase',
      pdfHeader: {
        metric: 'Moon',
        imperial: 'Moon',
      },
      icon: '●',
    },
  ],
};

export class MoonPhaseGauge {
  constructor() {
    // Assign the gauge attributes as properties
    Object.assign(this, gaugeAttributes);
  }

  // *************************
  // Derived properties from weather data
  // Used for auto calculating ranges
  // *************************

  // All the values of the gauge
  ranges: GaugeRangeCategory[] = MOON_PHASE_NAMES.map((n, i) => {
    return { value: i, label: n };
  });

  colors = $state(
    chroma
      .scale('BrBG')
      .colors(8)
      .map((n) => {
        return { hex: n };
      }),
  );

  schemeId = $state('BrBG');

  numberOfColors = $state(8);

  calculating = $state(false);

  // *************************
  // Methods
  // *************************
  updateColors({ colors }) {
    this.calculating = true;
    this.colors = colors;
    this.calculating = false;
  }

  updateSettings({ settings }: { settings: GaugeSettingsType }) {
    this.calculating = true;
    this.colors = settings.colors;
    this.schemeId = settings.schemeId;
    this.calculating = false;
  }
}
