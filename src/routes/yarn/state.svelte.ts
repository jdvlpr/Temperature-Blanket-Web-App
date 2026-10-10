import { TemperatureGauge } from '#lib/state/gauges/temperature-gauge-state.svelte.js';

class YarnState {
  gauge = $state(new TemperatureGauge());
}

export const yarnPageState = new YarnState();
