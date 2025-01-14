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

import { browser, version } from '$app/environment';
import { PROJECT_TIMESTAMP_ID } from '$lib/constants';
import { gauges, locations, previews, units, weather } from '$lib/state';

class liveProjectURLHashClass {
  value = $derived.by(() => {
    let hash = '';
    hash += locations.urlHash;
    hash += gauges.urlHash;
    hash += previews.hash;
    if (weather.defaultSource === 'Meteostat') hash += '&s=0';
    else if (weather.defaultSource === 'Open-Meteo') hash += '&s=1';
    if (!weather.useSecondarySources) hash += '0';
    else if (weather.useSecondarySources) hash += '1';
    if (weather.grouping === 'week')
      hash += `&w=${weather.monthGroupingStartDay}`; // Set Weather Grouping to Weeks with the starting Day of Week
    hash += units.value === 'metric' ? '&u=m' : '&u=i'; // Units
    return hash;
  });
}
// The current part of the project URL after #
export const liveProjectURLHash = new liveProjectURLHashClass();

export const isProjectSaved = $state({ value: false });

export const isProjectLoading = $state({ value: true });

export const projectGalleryLink = $state({ value: null });

export const projectGalleryTitle = $state({ value: null });

class ProjectStatusClass {
  state = $derived.by(() => {
    const isValid = locations.allValid;
    const base = browser ? window.location.origin + '/' : '';
    const query = `?project=${PROJECT_TIMESTAMP_ID}&v=${version}`;
    const liveURL = !isValid
      ? base
      : base + query + '#' + liveProjectURLHash.value;
    return {
      isValid,
      liveURL,
    };
  });
}

export const projectStatus = new ProjectStatusClass();
