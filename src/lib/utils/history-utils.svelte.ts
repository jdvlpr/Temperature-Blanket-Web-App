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
import { settings as daytimeGaugeSettings } from '$lib/components/gauges/DaytimeGauge.svelte';
import { settings as rainGaugeSettings } from '$lib/components/gauges/RainGauge.svelte';
import { settings as snowGaugeSettings } from '$lib/components/gauges/SnowGauge.svelte';
import { gaugeSettings as temperatureGaugeSettings } from '$lib/components/gauges/TemperatureGauge.svelte';
import { load as loadClnr } from '$lib/components/previews/CalendarSettings.svelte';
import { load as loadChev } from '$lib/components/previews/ChevronsSettings.svelte';
import { load as loadCosq } from '$lib/components/previews/ContinuousSquareSettings.svelte';
import { load as loadCrnr } from '$lib/components/previews/CornerToCornerSettings.svelte';
import { load as loadTsun } from '$lib/components/previews/DaytimeRowsSettings.svelte';
import { load as loadMrws } from '$lib/components/previews/MonthRowsSettings.svelte';
import { load as loadMsqs } from '$lib/components/previews/MonthSquaresSettings.svelte';
import { load as loadRows } from '$lib/components/previews/RowsSettings.svelte';
import { load as loadSmsq } from '$lib/components/previews/SplitMonthSquaresSettings.svelte';
import { load as loadSqrs } from '$lib/components/previews/SquaresSettings.svelte';
import { ICONS } from '$lib/constants';
import {
  defaultWeatherSource,
  allGaugesAttributes,
  gaugesState,
  history,
  historyChangeMessage,
  isHistoryUpdating,
  isProjectSaved,
  liveProjectURLHash,
  projectStatus,
  units,
  useSecondaryWeatherSources,
  weather,
  weatherGrouping,
  weatherMonthGroupingStartDay,
} from '$lib/stores';
import {
  exists,
  getProjectParametersFromURLHash,
  parseGaugeURLHash,
} from '$lib/utils';
import { get } from 'svelte/store';

export const loadFromHistory = (props) => {
  historyChangeMessage.set('what');
  const { action } = props;
  const oldParams = getProjectParametersFromURLHash(get(liveProjectURLHash));
  if (action === 'undo') history.undo();
  if (action === 'redo') history.redo();
  const newParams = getProjectParametersFromURLHash(get(history).current);

  const actionVerb = action === 'undo' ? 'Undo:' : 'Redo:';
  let message = '';
  // Change Units
  if (exists(newParams.u)) {
    if (!exists(oldParams.u) || oldParams.u.value !== newParams.u.value) {
      if (newParams.u.value === 'i') {
        units.set('imperial');
        message = 'Units';
      }
      if (newParams.u.value === 'm') {
        units.set('metric');
        message = 'Units';
      }
    }
  }

  // Change Default Weather Source
  // TODO: Remove this if it never runs, because weather source params are stripped from the history string. I'm not sure. Leaving it just in case.
  if (exists(newParams.s)) {
    if (!exists(oldParams.s) || oldParams.s?.value !== newParams.s?.value) {
      const sourceCode = newParams.s.value.substring(0, 1);
      if (sourceCode === '0') defaultWeatherSource.set('Meteostat');
      else if (sourceCode === '1') defaultWeatherSource.set('Open-Meteo');

      const secondaryCode = newParams.s.value.substring(1, 2);
      if (secondaryCode === '0') useSecondaryWeatherSources.set(false);
      else if (secondaryCode === '1') useSecondaryWeatherSources.set(true);
    }
  }

  // Change Weather Grouping
  if (exists(newParams.w)) {
    if (!exists(oldParams.w) || oldParams.w?.value !== newParams.w?.value) {
      weatherGrouping.set('week');
      weatherMonthGroupingStartDay.set(+newParams.w.value);
      message = 'Weather Grouping';
    }
  } else {
    weatherGrouping.set('day');
    message = 'Weather Grouping';
  }

  // Change Gauges
  for (let i = 0; i < allGaugesAttributes.length; i++) {
    const gauge = allGaugesAttributes[i];
    if (exists(newParams[gauge.id])) {
      if (
        !exists(oldParams[gauge.id]) ||
        oldParams[gauge.id].value !== newParams[gauge.id].value
      ) {
        let settings;
        switch (gauge.id) {
          case 'temp':
            settings = parseGaugeURLHash(
              newParams[gauge.id].value,
              temperatureGaugeSettings,
            );

            Object.keys(temperatureGaugeSettings).forEach((key) => {
              if (settings[key] !== undefined) {
                temperatureGaugeSettings[key] = settings[key];
              }
            });
            message = 'Colors';
            break;
          case 'prcp':
            settings = parseGaugeURLHash(
              newParams[gauge.id].value,
              get(rainGaugeSettings),
            );
            rainGaugeSettings.set(settings);
            message = 'Colors';
            break;
          case 'snow':
            settings = parseGaugeURLHash(
              newParams[gauge.id].value,
              get(snowGaugeSettings),
            );
            snowGaugeSettings.set(settings);
            message = 'Colors';
            break;
          case 'dayt':
            settings = parseGaugeURLHash(
              newParams[gauge.id].value,
              get(daytimeGaugeSettings),
            );
            daytimeGaugeSettings.set(settings);
            message = 'Colors';
            break;
          default:
            break;
        }
        if (!get(gaugesState).created.includes(gauge.id)) {
          gaugesState.addCreated(gauge.id); // if the gauge is not created, add it
          message = 'Colors';
        }
      }
    } else if (exists(oldParams[gauge.id])) {
      gaugesState.removeCreated(gauge.id);
      message = 'Colors';
    }
  }

  // Change Preview
  if (exists(newParams.rows)) {
    if (
      !exists(oldParams.rows) ||
      oldParams.rows.value !== newParams.rows.value
    ) {
      loadRows(newParams.rows.value);
      message = 'Preview';
    }
  } else if (exists(newParams.rsun)) {
    if (
      !exists(oldParams.rsun) ||
      oldParams.rsun.value !== newParams.rsun.value
    ) {
      loadTsun(newParams.rsun.value);
      message = 'Preview';
    }
  } else if (exists(newParams.chev)) {
    if (
      !exists(oldParams.chev) ||
      oldParams.chev.value !== newParams.chev.value
    ) {
      loadChev(newParams.chev.value);
      message = 'Preview';
    }
  } else if (exists(newParams.cosq)) {
    if (
      !exists(oldParams.cosq) ||
      oldParams.cosq.value !== newParams.cosq.value
    ) {
      loadCosq(newParams.cosq.value);
      message = 'Preview';
    }
  } else if (exists(newParams.crnr)) {
    if (
      !exists(oldParams.crnr) ||
      oldParams.crnr.value !== newParams.crnr.value
    ) {
      loadCrnr(newParams.crnr.value);
      message = 'Preview';
    }
  } else if (exists(newParams.smsq)) {
    if (
      !exists(oldParams.smsq) ||
      oldParams.smsq.value !== newParams.smsq.value
    ) {
      loadSmsq(newParams.smsq.value);
      message = 'Preview';
    }
  } else if (exists(newParams.mrws)) {
    if (
      !exists(oldParams.mrws) ||
      oldParams.mrws.value !== newParams.mrws.value
    ) {
      loadMrws(newParams.mrws.value);
      message = 'Preview';
    }
  } else if (exists(newParams.msqs)) {
    if (
      !exists(oldParams.msqs) ||
      oldParams.msqs.value !== newParams.msqs.value
    ) {
      loadMsqs(newParams.msqs.value);
      message = 'Preview';
    }
  } else if (exists(newParams.sqrs)) {
    if (
      !exists(oldParams.sqrs) ||
      oldParams.sqrs.value !== newParams.sqrs.value
    ) {
      loadSqrs(newParams.sqrs.value);
      message = 'Preview';
    }
  } else if (exists(newParams.clnr)) {
    if (
      !exists(oldParams.clnr) ||
      oldParams.clnr.value !== newParams.clnr.value
    ) {
      loadClnr(newParams.clnr.value);
      message = 'Preview';
    }
  }
  if (message)
    historyChangeMessage.set(
      `<span class="flex flex-wrap items-start gap-2"><span class="">${action === 'undo' ? ICONS.arrowUturnLeft : ICONS.arrowUturnRight}</span> <span>${actionVerb} ${message}</span></span>`,
    );
};
export const updateHistory = () => {
  if (
    !get(weather) ||
    !get(liveProjectURLHash) ||
    !get(projectStatus).isValid ||
    !browser
  )
    return;

  let live = get(liveProjectURLHash);
  const liveParams = getProjectParametersFromURLHash(live);

  // There must be a gauge created... sometimes this block gets called and the liveHash doesn't have any gauge params...
  const hasGauge = allGaugesAttributes.some((gauge) =>
    exists(liveParams[gauge.id]),
  );
  if (!hasGauge) return;

  isHistoryUpdating.set(true);
  isProjectSaved.set(false);
  let old = get(history).current;

  // Compare from the first param ('&')
  // This excludes the location param ('l=...'); changes to the location or dates are not considered to be an undoable or redoable change
  live = live.substring(live.indexOf('&'));
  old = old.substring(old.indexOf('&'));

  // // Don't consider Weather Source setting in history changes
  if (live.includes('&s=00')) live = live.replace('&s=00', '');
  else if (live.includes('&s=01')) live = live.replace('&s=01', '');
  else if (live.includes('&s=10')) live = live.replace('&s=10', '');
  else if (live.includes('&s=11')) live = live.replace('&s=11', '');

  if (old.includes('&s=00')) old = old.replace('&s=00', '');
  else if (old.includes('&s=01')) old = old.replace('&s=01', '');
  else if (old.includes('&s=10')) old = old.replace('&s=10', '');
  else if (old.includes('&s=11')) old = old.replace('&s=11', '');

  if (live !== old) history.push(live);

  isHistoryUpdating.set(false);
};

export const updateURL = () => {
  const newURL = new URL(get(projectStatus).liveURL);
  window.history.pushState({ path: newURL.href }, '', newURL.href);
};
