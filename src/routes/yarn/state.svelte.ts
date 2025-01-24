import { TemperatureGauge } from '$lib/state/gauges/temperature-gauge-state.svelte';
import type { Color } from '$lib/types';

class YarnState {
  gauge = $state(new TemperatureGauge());
}

export const yarnPageState = new YarnState();
