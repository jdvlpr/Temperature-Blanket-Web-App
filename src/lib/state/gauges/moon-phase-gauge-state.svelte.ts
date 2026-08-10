import { MOON_PHASE_NAMES } from '$lib/constants/weather-constants';
import type { Color } from '$lib/types/yarn-types';
import type {
  GaugeAttributes,
  GaugeRangeCategory,
  GaugeRangeOptions,
  GaugeSettingsType,
  WeatherParam,
} from '$lib/types/gauge-types';
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

export class MoonPhaseGauge implements GaugeAttributes {
  // Assigned at runtime in the constructor via Object.assign(this, gaugeAttributes)
  id!: GaugeAttributes['id'];
  isStatic!: boolean;
  label!: GaugeAttributes['label'];
  unit!: GaugeAttributes['unit'];
  targets!: WeatherParam[];

  // Category gauges don't use range options, but the shared GaugeStateInterface requires the keys to exist
  rangeOptions: GaugeRangeOptions | undefined = undefined;
  autoRangeOptions: GaugeRangeOptions | undefined = undefined;

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

  colors: Color[] = $state(
    chroma
      .scale('BrBG')
      .colors(8)
      .map((n) => {
        return { hex: n as Color['hex'] };
      }),
  );

  schemeId = $state('BrBG');

  numberOfColors = $state(8);

  calculating = $state(false);

  // *************************
  // Methods
  // *************************
  updateColors({ colors }: { colors: Color[] }) {
    this.calculating = true;
    this.colors = colors;
    this.calculating = false;
  }

  updateSettings({ settings }: { settings: Partial<GaugeSettingsType> }) {
    this.calculating = true;
    this.colors = settings.colors ?? this.colors;
    this.schemeId = settings.schemeId ?? this.schemeId;
    this.calculating = false;
  }
}
