import type { Color } from '$lib/types';

// Gauge Types
export interface GaugeRange {
  from: number;
  to: number;
}

export interface GaugeRangeOptions {
  auto: {
    /** In the gauge settings URL hash string, for temperature gauges, '_h' is for 'tmax', '_a' is for 'tavg', '_l' is for 'tmin'. For all gauges, '_r' or nothing is for 'ranges'. The position should be at the end of the settings string, but it's found via pattern matching rather than by position in the string. TODO: can the position be reliably predicted? */
    optimization: 'ranges' | 'tmax' | 'tavg' | 'tmin';
    start: {
      high: number;
      low: number;
    };
    increment: number;
    roundIncrement: boolean;
  };
  manual: {
    /** In the gauge settings URL hash string, this starts from the default separator character to the end of the settings string.
     * It's only set if the mode is 'manual' */
    start: number;
    /** In the gauge settings URL hash string, this starts from the 6th character to the default separator character.
     * It's only set if the mode is 'manual'  */
    increment: number;
  };
  /** In the gauge settings URL hash string, this is the 3rd character. It's value is 'h' for 'high-to-low' or 'l' for 'low-to-high'. */
  direction: 'high-to-low' | 'low-to-high';
  /** In the gauge settings URL hash string, the range calculation method is determined from this and the includeToValue setting, it's the 4th character.
   *
   * '0' means "include from, don't include to"
   *
   * '1' means "don't include from, include to"
   *
   * '2' means "include from, include to"
   *
   * '3' means "don't include from, don't include to"
   *
   * */
  includeFromValue: boolean;
  /** In the gauge settings URL hash string, the range calculation method is determined from this and the includeFromValue setting; it's the 4th character.
   *
   * '0' means "include from, don't include to"
   *
   * '1' means "don't include from, include to"
   *
   * '2' means "include from, include to"
   *
   * '3' means "don't include from, don't include to"
   *
   * */
  includeToValue: boolean;
  /** In the gauge settings URL hash string, this is the 2nd character. It's value is 'l' for 'true' or 'u' for 'false'. */
  linked: boolean;
  /** In the gauge settings URL hash string, this is the 1st character. It's value is 'a' for 'auto' or 'm' for 'manual'. */
  mode: 'auto' | 'jenks' | 'manual'; // equal range increments ('auto') | equal days ('jenks') | 'manual'
  /** In the gauge settings URL hash string, this is the 5th character. It's value is 't' for 'true' or 'f' for 'false'. */
  isCustomRanges: boolean;
}

export interface GaugeSettingsType {
  colors: Color[] | undefined;
  numberOfColors: number | undefined;
  ranges?: GaugeRange[] | undefined;
  rangeOptions: GaugeRangeOptions | undefined;
  autoRangeOptions: GaugeRangeOptions | undefined;
  schemeId: string | undefined;
}

export interface GaugeAttributes {
  id: 'temp' | 'prcp' | 'snow' | 'dayt';
  label: 'Temperature Gauge' | 'Rain Gauge' | 'Snow Gauge' | 'Daytime Gauge';
  unit: {
    type: 'temperature' | 'height' | 'time';
    label: {
      metric: '°C' | 'mm' | 'min';
      imperial: '°F' | 'in' | 'hr';
    };
  };
  targets: WeatherParam[];
}

export interface GaugeStateInterface
  extends GaugeSettingsType,
    GaugeAttributes {}

export type WeatherParam = {
  id: 'tmax' | 'tavg' | 'tmin' | 'prcp' | 'snow' | 'dayt';
  label:
    | 'High Temperature'
    | 'Average Temperature'
    | 'Low Temperature'
    | 'Rain'
    | 'Snow'
    | 'Daytime';
  type: 'temperature' | 'height' | 'time';
  gaugeLabel: 'High' | 'Average' | 'Low' | 'Rain' | 'Snow' | 'Daytime';
  shortLabel:
    | 'High Temp'
    | 'Average Temp'
    | 'Low Temp'
    | 'Rain'
    | 'Snow'
    | 'Daytime';
  pdfHeader: {
    metric:
      | 'High (°C)'
      | 'Avg (°C)'
      | 'Low (°C)'
      | 'Rain (mm)'
      | 'Snow (mm)'
      | 'Sun (h:m)';
    imperial:
      | 'High (°F)'
      | 'Avg (°F)'
      | 'Low (°F)'
      | 'Rain (in)'
      | 'Snow (in)'
      | 'Sun (h:m)';
  };
  icon: '↑' | '~' | '↓' | '∴' | '∗' | '☼'; // TODO: try using different icons: '☔' '☀'
};
