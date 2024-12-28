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

import { browser } from '$app/environment';
import {
  gaugeAttributes as daytimeGaugeAttributes,
  settings as daytimeGaugeSettings,
} from '$lib/components/gauges/DaytimeGauge.svelte';
import {
  gaugeAttributes as prcpGaugeAttributes,
  settings as prcpGaugeSettings,
} from '$lib/components/gauges/RainGauge.svelte';
import {
  gaugeAttributes as snowGaugeAttributes,
  settings as snowGaugeSettings,
} from '$lib/components/gauges/SnowGauge.svelte';
import {
  gaugeAttributes as tempGaugeAttributes,
  gaugeSettings as tempGaugeSettings,
} from '$lib/components/gauges/TemperatureGauge.svelte';
import { CHARACTERS_FOR_URL_HASH } from '$lib/constants';
import type { PageLayout } from '$lib/types';
import { colorsToYarnDetails, displayNumber } from '$lib/utils';
import { derived, writable, type Writable } from 'svelte/store';

export let showDaysInRange: Writable<boolean> = writable(true);

function createGaugesStateStore() {
  const { subscribe, set, update } = writable({
    active: '',
    created: [],
    available: [],
  });

  return {
    subscribe,
    addCreated: (id) =>
      update((n) => {
        n.created = !n.created.includes(id) ? [...n.created, id] : n.created;
        n.active = id;
        return n;
      }),
    removeCreated: (id) =>
      update((n) => {
        n.created = n.created.filter((gauge) => gauge !== id);
        n.active = n.created[n.created.length - 1];
        return n;
      }),
    addAvailable: (id) =>
      update((n) => {
        n.available = !n.available.includes(id)
          ? [...n.available, id]
          : n.available;
        return n;
      }),
    removeAvailable: (id) =>
      update((n) => {
        n.available = n.available.filter((gauge) => gauge !== id);
        return n;
      }),
    set: (value) => set(value),
  };
}
export const gaugesState = createGaugesStateStore();

export const gaugeSettings = derived(
  [
    tempGaugeSettings,
    prcpGaugeSettings,
    snowGaugeSettings,
    daytimeGaugeSettings,
  ],
  ([
    $tempGaugeSettings,
    $prcpGaugeSettings,
    $snowGaugeSettings,
    $daytimeGaugeSettings,
  ]) => {
    return [
      $tempGaugeSettings,
      $prcpGaugeSettings,
      $snowGaugeSettings,
      $daytimeGaugeSettings,
    ];
  },
);

export const allGaugesAttributes = [
  tempGaugeAttributes,
  prcpGaugeAttributes,
  snowGaugeAttributes,
  daytimeGaugeAttributes,
];

export const gauges = derived([gaugeSettings], ([$gaugeSettings]) => {
  return $gaugeSettings.map((n, i) => {
    return { ...n, ...allGaugesAttributes[i] };
  });
});

export const createdGauges = derived(
  [gaugesState, gauges],
  ([$gaugesState, $gauges]) => {
    return $gauges.filter((n) => $gaugesState.created.some((m) => n.id === m));
  },
);

export const gaugesURLHash = derived(
  [gaugeSettings, gaugesState],
  ([$gaugeSettings, $gaugesState]) => {
    let hash = '';
    const createdGauges = $gaugeSettings.filter((settings) =>
      $gaugesState.created.includes(settings.id),
    );
    for (const settings of createdGauges) {
      if (!settings.rangeOptions || !settings.colors || !settings.ranges)
        return hash;
      if (settings.ranges?.length !== settings.colors?.length) return hash;
      hash += '&';
      hash += `${settings.id}=`;
      hash += settings.schemeId === 'Custom' ? '' : `${settings.schemeId}~`;
      settings.colors.forEach((color, index) => {
        const code = color.hex.substring(color.hex.indexOf('#') + 1);
        hash += encodeURIComponent(
          `${code}(${settings.ranges[index].from + CHARACTERS_FOR_URL_HASH.separator + settings.ranges[index].to})`,
        );
      });
      hash += '!';
      hash += settings.rangeOptions.mode === 'auto' ? 'a' : 'm'; // Manual or auto ranges
      hash += settings.rangeOptions.linked === true ? 'l' : 'u'; // linked or unlinked ranges
      hash += settings.rangeOptions.direction === 'high-to-low' ? 'h' : 'l'; // high-to-low or low-to-high direction

      // Include From or To values included in v1.808
      if (
        settings.rangeOptions.includeFromValue &&
        !settings.rangeOptions.includeToValue
      )
        hash += '0';
      else if (
        !settings.rangeOptions.includeFromValue &&
        settings.rangeOptions.includeToValue
      )
        hash += '1';
      else if (
        settings.rangeOptions.includeFromValue &&
        settings.rangeOptions.includeToValue
      )
        hash += '2';
      else if (
        !settings.rangeOptions.includeFromValue &&
        !settings.rangeOptions.includeToValue
      )
        hash += '3';

      hash += settings.rangeOptions.isCustomRanges === true ? 't' : 'f'; // Save custom ranges setting

      if (
        settings.rangeOptions.mode === 'manual' &&
        settings.rangeOptions.isCustomRanges === false
      ) {
        // If manual ranges, include integer and starting value '10'100'
        hash += `${displayNumber(settings.rangeOptions.manual.increment)}${CHARACTERS_FOR_URL_HASH.separator}${displayNumber(settings.rangeOptions.manual.start)}`;
      }

      // Save range Balance Auto Focus mode for temperature gauges
      // Added in version 2.5.0
      if (
        settings.id === 'temp' &&
        settings.rangeOptions.mode === 'auto' &&
        !settings.rangeOptions.isCustomRanges
      ) {
        if (settings.rangeOptions.auto.optimization === 'ranges') hash += '_r';
        if (settings.rangeOptions.auto.optimization === 'tmax') hash += '_h';
        else if (settings.rangeOptions.auto.optimization === 'tavg')
          hash += '_a';
        else if (settings.rangeOptions.auto.optimization === 'tmin')
          hash += '_l';
      }

      if (settings.colors.some((color) => color?.brandId && color?.yarnId)) {
        hash +=
          '!' +
          colorsToYarnDetails({
            colors: settings.colors,
          });
      }
    }
    return hash;
  },
);

export const initialLayout: PageLayout = browser
  ? localStorage.getItem('layout') === 'list' ||
    localStorage.getItem('layout') === 'grid'
    ? (localStorage.getItem('layout') as PageLayout)
    : window.innerWidth < 640
      ? 'list'
      : 'grid'
  : 'list';

function createLayoutStore(): Writable<PageLayout> {
  const { subscribe, set, update } = writable<PageLayout>(initialLayout);
  return {
    subscribe,
    update,
    set: (n: PageLayout) => {
      if (n === 'list' || n === 'grid') {
        set(n);
      }
    },
  };
}
export const layout = createLayoutStore();
