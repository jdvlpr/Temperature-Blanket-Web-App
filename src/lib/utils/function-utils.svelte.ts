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

import { weatherDataUpdatedKey } from '$lib/components/WeatherTableWrapper.svelte';
import { gauges, project, weather } from '$lib/state';

export const delay = (delayInms) => {
  return new Promise((resolve) => setTimeout(resolve, delayInms));
};

export const hasParentWithClass = (event, className) => {
  let element = event.target;
  while (element.parentElement) {
    if (element.parentElement.classList.contains(className)) {
      return true;
    }
    element = element.parentElement;
  }
  return false;
};

let debounceTimerPreviewEffect;
const debouncePreviewEffect = (callback, time) => {
  if (!window) return;
  window.clearTimeout(debounceTimerPreviewEffect);
  debounceTimerPreviewEffect = window.setTimeout(callback, time);
};

export const runPreview = (callback) => {
  if (!window) return;
  $effect.root(() => {
    $effect(() => {
      project.url.href;
      weatherDataUpdatedKey.value;
      if (!weather.data.length || !gauges.allCreated.length) return;
      debouncePreviewEffect(() => {
        callback();
      }, 0);
    });
  });
};
