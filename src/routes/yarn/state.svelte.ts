import { TemperatureGauge } from '#lib/state/gauges/temperature-gauge-state.svelte.js';
import type { Color } from '#lib/types/yarn-types.js';
import { sameColorList } from '#lib/utils/color-utils.js';

class YarnState {
  gauge = $state(new TemperatureGauge());
  /**
   * A name for the palette that came with it (opened from the gallery), and
   * the colors it names: Save Palette offers it only while the colors are
   * still those, since other colors are another palette.
   */
  suggestion = $state.raw<{ name: string; colors: Color[] } | null>(null);

  /** The suggested name, if it's for these colors */
  suggestedNameFor(colors: Color[]) {
    return this.suggestion && sameColorList(this.suggestion.colors, colors)
      ? this.suggestion.name
      : '';
  }
}

export const yarnPageState = new YarnState();
