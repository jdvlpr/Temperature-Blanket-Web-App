import { TemperatureGauge } from '$lib/state/gauges/temperature-gauge-state.svelte';

class YarnState {
  gauge = $state(new TemperatureGauge());
}

export const yarnPageState = new YarnState();
