// Copyright (c) 2024, Thomas (https://github.com/jdvlpr)
//
// This file is part of Temperature-Blanket-Web-App.
//
// Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
// under the terms of the GNU General Public License as published by the Free Software Foundation,
// either version 3 of the License, or (at your option) any later version.
//
// Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
// without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
// See the GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App.
// If not, see <https://www.gnu.org/licenses/>.

export const getWeatherCodeDetails = ({
  weathercode,
  is_day,
  precipitation_probability,
}) => {
  const variant = is_day === 0 ? 'night' : '';
  let details = {
    icon: null,
    description: null,
  };
  switch (weathercode) {
    // WMO Weather interpretation codes (WW)
    // see codes at https://open-meteo.com/en/docs
    // Clear sky
    case 0:
      details.description ??= 'Clear';
      details.icon = `<svg class="icon icon-CLEAR${variant} w-8 h-8" fill="currentColor"><use xlink:href="#icon-CLEAR${variant}"></use></svg>`;
      break;
    // Mainly clear, partly cloudy, and overcast
    case 1:
      details.description ??= 'Mostly Clear';
      details.icon = `<svg class="icon icon-PCLOUDY${variant} w-8 h-8" fill="currentColor"><use xlink:href="#icon-PCLOUDY${variant}"></use></svg>`;
      break;
    case 2:
      details.description ??= 'Partly Cloudy';
      details.icon = `<svg class="icon icon-MOSTLY_CLOUDY${variant} w-8 h-8" fill="currentColor"><use xlink:href="#icon-MOSTLY_CLOUDY${variant}"></use></svg>`;
      break;
    case 3:
      details.description ??= 'Overcast';
      details.icon = `<svg class="icon icon-PARTLY_CLOUDY${variant} w-8 h-8" fill="currentColor"><use xlink:href="#icon-PARTLY_CLOUDY${variant}"></use></svg>`;
      break;
    // Fog and depositing rime fog
    case 45:
      details.description ??= 'Fog';
    case 48:
      details.description ??= 'Depositing Rime Fog';
      details.icon = `<svg class="icon icon-FOGCLOUD${variant} w-8 h-8" fill="currentColor"><use xlink:href="#icon-FOGCLOUD${variant}"></use></svg>`;
      break;
    // Drizzle: Light, moderate, and dense intensity
    case 51:
      details.description ??= 'Light Drizzle';
    case 53:
      details.description ??= 'Moderate Drizzle';
    case 55:
      details.description ??= 'Dense Drizzle';
      details.icon = `<svg class="icon icon-DRIZZLE${variant} w-8 h-8" fill="currentColor"><use xlink:href="#icon-DRIZZLE${variant}"></use></svg>`;
      break;
    // Freezing Drizzle: Light and dense intensity
    case 56:
      details.description ??= 'Light Freezing Drizzle';
    case 57:
      details.description ??= 'Dense Freezing Drizzle';
      details.icon = `<svg class="icon icon-FREEZING_DRIZZLE${variant} w-8 h-8" fill="currentColor"><use xlink:href="#icon-FREEZING_DRIZZLE${variant}"></use></svg>`;
      break;
    // Rain: Slight, moderate and heavy intensity
    case 61:
      details.description ??= 'Slight Rain';
    case 63:
      details.description ??= 'Moderate Rain';
    case 65:
      details.description ??= 'Heavy Rain';
      details.icon = `<svg class="icon icon-RAIN${variant} w-8 h-8" fill="currentColor"><use xlink:href="#icon-RAIN${variant}"></use></svg>`;
      break;
    // Freezing Rain: Light and heavy intensity
    case 66:
      details.description ??= 'Light Freezing Rain';
    case 67:
      details.description ??= 'Heavy Freezing Rain';
      details.icon = `<svg class="icon icon-FREEZING_RAIN${variant} w-8 h-8" fill="currentColor"><use xlink:href="#icon-FREEZING_RAIN${variant}"></use></svg>`;
      break;
    // Snow fall: Slight, moderate, and heavy intensity
    case 71:
      details.description ??= 'Slight Snow Fall';
    case 73:
      details.description ??= 'Moderate Snow Fall';
    case 75:
      details.description ??= 'Heavy Snow Fall';
      details.icon = `<svg class="icon icon-SNOW${variant} w-8 h-8" fill="currentColor"><use xlink:href="#icon-SNOW${variant}"></use></svg>`;
      break;
    // Snow grains
    case 77:
      details.description ??= 'Snow Grains';
      details.icon = `<svg class="icon icon-SNOW_FLURRIES${variant} w-8 h-8" fill="currentColor"><use xlink:href="#icon-SNOW_FLURRIES${variant}"></use></svg>`;
      break;
    // Rain showers: Slight, moderate, and violent
    case 80:
      details.description ??= 'Slight Rain Showers';
    case 81:
      details.description ??= 'Moderate Rain Showers';
    case 82:
      details.description ??= 'Violent Rain Showers';
      details.icon = `<svg class="icon icon-drizzle_rain${variant} w-8 h-8" fill="currentColor"><use xlink:href="#icon-drizzle_rain${variant}"></use></svg>`;
      break;
    // Snow showers slight and heavy
    case 85:
      details.description ??= 'Slight Snow Showers';
    case 86:
      details.description ??= 'Heavy Snow Showers';
      details.icon = `<svg class="icon icon-SNOW_SHOWERS${variant} w-8 h-8" fill="currentColor"><use xlink:href="#icon-SNOW_SHOWERS${variant}"></use></svg>`;
      break;
    // Thunderstorm: Slight or moderate
    case 95:
      details.description ??= 'Thunderstorms';
      details.icon = `<svg class="icon icon-thunderstorm_with_light_rain${variant} w-8 h-8" fill="currentColor"><use xlink:href="#icon-thunderstorm_with_light_rain${variant}"></use></svg>`;
      break;
    // Thunderstorm with slight and heavy hail
    case 96:
      details.description ??= 'Thunderstorms';
    case 99:
      details.description ??= 'Thunderstorms';
      details.icon = `<svg class="icon icon-thunderstorm_with_light_rain${variant} w-8 h-8" fill="currentColor"><use xlink:href="#icon-thunderstorm_with_light_rain${variant}"></use></svg>`;
      break;

    default:
      details.description ??= 'Clear';
      details.icon = `<svg class="icon icon-CLEAR${variant} w-8 h-8" fill="currentColor"><use xlink:href="#icon-CLEAR${variant}"></use></svg>`;
      break;
  }
  if (precipitation_probability)
    details.icon += `<p class="text-sm" style="color:rgb(56, 189, 248)">${precipitation_probability}%</p>`;
  return details;
};
