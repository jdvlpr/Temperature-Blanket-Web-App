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
