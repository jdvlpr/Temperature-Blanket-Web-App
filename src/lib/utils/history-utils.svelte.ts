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
import { load as loadClnr } from '$lib/components/previews/CalendarSettings.svelte';
import { load as loadChev } from '$lib/components/previews/ChevronsSettings.svelte';
import { load as loadCosq } from '$lib/components/previews/ContinuousSquareSettings.svelte';
import { load as loadCrnr } from '$lib/components/previews/CornerToCornerSettings.svelte';
import { load as loadTsun } from '$lib/components/previews/DaytimeRowsSettings.svelte';
import { load as loadMrws } from '$lib/components/previews/MonthRowsSettings.svelte';
import { load as loadMsqs } from '$lib/components/previews/MonthSquaresSettings.svelte';
import { load as loadSmsq } from '$lib/components/previews/SplitMonthSquaresSettings.svelte';
import { load as loadSqrs } from '$lib/components/previews/SquaresSettings.svelte';
import { ICONS } from '$lib/constants';
import {
  allGaugesAttributes,
  defaultWeatherSource,
  gaugesState,
  historyChangeMessage,
  historyState,
  isHistoryUpdating,
  isProjectSaved,
  liveProjectURLHash,
  projectStatus,
  units,
  useSecondaryWeatherSources,
  weather,
  weatherGrouping,
  weatherMonthGroupingStartDay,
} from '$lib/state';
import { rowsPreview } from '$lib/state/previews/rows-preview-state.svelte';
import {
  exists,
  getProjectParametersFromURLHash,
  parseGaugeURLHash,
} from '$lib/utils';

export const loadFromHistory = ({ action }: { action: 'Undo' | 'Redo' }) => {
  historyChangeMessage.value = '';

  let oldHistoryState = historyState.current;
  let newHistoryState;
  if (action === 'Undo') {
    newHistoryState = historyState.previous;
    historyState.undo();
  } else if (action === 'Redo') {
    newHistoryState = historyState.next;
    historyState.redo();
  }

  const oldParams = getProjectParametersFromURLHash(oldHistoryState);
  const newParams = getProjectParametersFromURLHash(newHistoryState);

  let message = '';

  // Change Weather Grouping
  if (exists(newParams.w)) {
    if (!exists(oldParams.w) || oldParams.w?.value !== newParams.w?.value) {
      weatherGrouping.value = 'week';
      weatherMonthGroupingStartDay.set(+newParams.w.value);
      message = 'Weather Grouping set to Weekly';
    }
  } else {
    if (weatherGrouping.value !== 'day') {
      weatherGrouping.value = 'day';
      message = 'Weather Grouping set to Daily';
    }
  }

  // Change Units
  if (exists(newParams.u)) {
    if (!exists(oldParams.u) || oldParams.u.value !== newParams.u.value) {
      if (newParams.u.value === 'i') {
        units.value = 'imperial';
        message = 'Units set to Imperial';
      }
      if (newParams.u.value === 'm') {
        units.value = 'metric';
        message = 'Units set to Metric';
      }
    }
  }

  // Change Default Weather Source
  // TODO: Remove this if it never runs, because weather source params are stripped from the history string. I'm not sure. Leaving it just in case.
  if (exists(newParams.s)) {
    if (!exists(oldParams.s) || oldParams.s?.value !== newParams.s?.value) {
      const sourceCode = newParams.s.value.substring(0, 1);
      if (sourceCode === '0') defaultWeatherSource.value = 'Meteostat';
      else if (sourceCode === '1') defaultWeatherSource.value = 'Open-Meteo';

      const secondaryCode = newParams.s.value.substring(1, 2);
      if (secondaryCode === '0') useSecondaryWeatherSources.set(false);
      else if (secondaryCode === '1') useSecondaryWeatherSources.set(true);
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
        gaugesState.addById(gauge.id);
        const settings = parseGaugeURLHash(newParams[gauge.id].value);
        Object.assign(
          gaugesState.gauges.find((g) => g.id === gauge.id),
          settings,
        );
        message = 'Colors';
      }
    } else if (exists(oldParams[gauge.id])) {
      gaugesState.remove(gauge.id);
      message = 'Colors';
    }
  }

  // Change Preview
  if (exists(newParams.rows)) {
    if (
      !exists(oldParams.rows) ||
      oldParams.rows.value !== newParams.rows.value
    ) {
      rowsPreview.load(newParams.rows.value);
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
    historyChangeMessage.value = `<span class="flex flex-wrap items-start gap-2"><span class="">${action === 'Undo' ? ICONS.arrowUturnLeft : ICONS.arrowUturnRight}</span> <span>${action}: ${message}</span></span>`;
};
export const updateHistory = () => {
  if (
    !weather.data ||
    !liveProjectURLHash.value ||
    !projectStatus.state.isValid ||
    !browser
  )
    return;

  let live = liveProjectURLHash.value;
  const liveParams = getProjectParametersFromURLHash(live);

  // There must be a gauge created... sometimes this block gets called and the liveHash doesn't have any gauge params...
  const hasGauge = allGaugesAttributes.some((gauge) =>
    exists(liveParams[gauge.id]),
  );
  if (!hasGauge) return;

  isHistoryUpdating.value = true;
  isProjectSaved.value = false;

  // This excludes the location param ('l=...'); changes to the location or dates are not considered to be an undoable or redoable change
  live = live.substring(live.indexOf('&'));

  if (
    live !== historyState.current &&
    live !== historyState.previous &&
    live !== historyState.next
  )
    historyState.push(live);

  isHistoryUpdating.value = false;
};

export const updateURL = () => {
  const newURL = new URL(projectStatus.state.liveURL);
  window.history.pushState({ path: newURL.href }, '', newURL.href);
};
