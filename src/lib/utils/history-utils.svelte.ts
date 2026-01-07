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
import { ICONS } from '$lib/constants';
import {
  allGaugesAttributes,
  gauges,
  locations,
  previews,
  project,
  toast,
  weather,
} from '$lib/state';
import { preferences } from '$lib/storage/preferences.svelte';
import {
  exists,
  getProjectParametersFromURLHash,
  parseGaugeURLHash,
  seasonsFromUrlHash,
} from '$lib/utils';

export const loadFromHistory = ({ action }: { action: 'Undo' | 'Redo' }) => {
  let oldHistoryState = project.history.current;
  let newHistoryState;
  if (action === 'Undo') {
    newHistoryState = project.history.previous;
    project.history.undo();
  } else if (action === 'Redo') {
    newHistoryState = project.history.next;
    project.history.redo();
  }

  const oldParams = getProjectParametersFromURLHash(oldHistoryState);
  const newParams = getProjectParametersFromURLHash(newHistoryState);

  let message = '';

  // Change Weather Grouping
  if (exists(newParams.w)) {
    if (!exists(oldParams.w) || oldParams.w?.value !== newParams.w?.value) {
      weather.grouping = 'week';
      weather.monthGroupingStartDay = +newParams.w.value;
      message = 'Weather Grouping set to Weekly';
    }
  } else {
    if (weather.grouping !== 'day') {
      weather.grouping = 'day';
      message = 'Weather Grouping set to Daily';
    }
  }

  // Change Units
  if (exists(newParams.u)) {
    if (!exists(oldParams.u) || oldParams.u.value !== newParams.u.value) {
      if (newParams.u.value === 'i') {
        preferences.value.units = 'imperial';
        message = 'Units';
      }
      if (newParams.u.value === 'm') {
        preferences.value.units = 'metric';
        message = 'Units';
      }
    }
  }

  // Change Default Weather Source
  // TODO: Remove this if it never runs, because weather source params are stripped from the history string. I'm not sure. Leaving it just in case.
  if (exists(newParams.s)) {
    if (!exists(oldParams.s) || oldParams.s?.value !== newParams.s?.value) {
      const sourceCode = newParams.s.value.substring(0, 1);
      if (sourceCode === '0') weather.source.name = 'Meteostat';
      else if (sourceCode === '1') weather.source.name = 'Open-Meteo';

      const secondaryCode = newParams.s.value.substring(1, 2);
      if (secondaryCode === '0') weather.source.useSecondary = false;
      else if (secondaryCode === '1') weather.source.useSecondary = true;
    }
  }

  // Change Gauges
  for (let i = 0; i < allGaugesAttributes.length; i++) {
    const gauge = allGaugesAttributes[i];
    if (exists(newParams[gauge.id])) {
      if (
        !exists(oldParams[gauge.id]) ||
        oldParams[gauge.id].value !== newParams[gauge.id].value
      ) {
        gauges.addById(gauge.id);

        const settings = parseGaugeURLHash(
          newParams[gauge.id].value,
          gauges.getSnapshot(gauge.id),
        );

        gauges.allCreated
          .find((g) => g.id === gauge.id)
          .updateSettings({ settings });

        message = 'Colors';
      }
    } else if (exists(oldParams[gauge.id])) {
      gauges.remove(gauge.id);
      message = 'Colors';
    }
  }

  // Change Seasons
  if (exists(newParams.n)) {
    if (!exists(oldParams.n) || oldParams.n?.value !== newParams.n?.value) {
      const seasons = seasonsFromUrlHash(newParams.n.value);
      if (seasons && seasons.length > 0) {
        preferences.value.seasons = seasons;
        if (previews.active) previews.active.settings.useSeasonTargets = true;
        message = 'Seasons';
      }
    }
  } else if (exists(oldParams.n)) {
    if (previews.active) previews.active.settings.useSeasonTargets = false;
    message = 'Preview';
  }

  // Change Preview
  previews.all.forEach((p) => {
    if (exists(newParams[p.id])) {
      if (
        !exists(oldParams[p.id]) ||
        oldParams[p.id].value !== newParams[p.id].value
      ) {
        p.load(newParams[p.id].value);
        message = 'Preview';
      }
    }
  });

  if (message) {
    toast.trigger({
      message: `<span class="flex flex-wrap items-start gap-2"><span class="">${action === 'Undo' ? ICONS.arrowUturnLeft : ICONS.arrowUturnRight}</span> <span>${action}: ${message}</span></span>`,
      background: 'preset-filled-success-100-900',
    });
  }
};
export const updateHistory = () => {
  if (!weather.data || !project.url.hash || !locations.allValid || !browser)
    return;

  let live = project.url.hash;
  const liveParams = getProjectParametersFromURLHash(live);

  // There must be a gauge created... sometimes this block gets called and the liveHash doesn't have any gauge params...
  const hasGauge = allGaugesAttributes.some((gauge) =>
    exists(liveParams[gauge.id]),
  );
  if (!hasGauge) return;

  project.history.isUpdating = true;
  project.status.saved = false;

  // This excludes the location param ('l=...'); changes to the location or dates are not considered to be an undoable or redoable change
  live = live.substring(live.indexOf('&'));

  if (
    live !== project.history.current &&
    live !== project.history.previous &&
    live !== project.history.next
  )
    project.history.push(live);

  project.history.isUpdating = false;
};

export const updateURL = () => {
  const newURL = new URL(project.url.href);
  window.history.pushState({ path: newURL.href }, '', newURL.href);
};
