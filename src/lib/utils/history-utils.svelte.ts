// Copyright (c) 2024 - 2026, Thomas (https://github.com/jdvlpr)
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
import { ICONS } from '$lib/constants/icon-constants';
import { allGaugesAttributes, gauges } from '$lib/state/gauges-state.svelte';
import { locations } from '$lib/state/location-state.svelte';
import { previews } from '$lib/state/preview-state.svelte';
import { project } from '$lib/state/project-state.svelte';
import { toast } from '$lib/state/page-state.svelte';
import { weather } from '$lib/state/weather-state.svelte';
import { preferences } from '$lib/storage/preferences.svelte';
import { exists } from '$lib/utils/other-utils';
import { getProjectParametersFromURLHash } from '$lib/utils/project-utils.svelte';
import { parseGaugeURLHash } from '$lib/utils/load-project-utils.svelte';
import { seasonsFromUrlHash } from '$lib/utils/seasons-utils.svelte';

export const loadFromHistory = async ({
  action,
}: {
  action: 'Undo' | 'Redo';
}) => {
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

  // Resolve a preview change first (this is the only async step) so it
  // settles before any of the synchronous mutations below, all of which
  // feed the debounced updateHistory/URL push via `project.url`. Otherwise
  // a slow chunk import could let a history entry be captured with the new
  // gauges/settings but the still-loading (old) preview.
  let previewChanged = false;
  const previewEntry = previews.all.find((p) => exists(newParams[p.id]));
  if (previewEntry) {
    if (
      !exists(oldParams[previewEntry.id]) ||
      oldParams[previewEntry.id].value !== newParams[previewEntry.id].value
    ) {
      const previewInstance = await previews.load(previewEntry.id);
      if (previewInstance) {
        previewInstance.load(newParams[previewEntry.id].value);
        previewChanged = true;
      }
    }
  }

  // Change Weather Grouping
  if (exists(newParams.w)) {
    if (!exists(oldParams.w) || oldParams.w?.value !== newParams.w?.value) {
      weather.setGrouping('week');
      weather.monthGroupingStartDay = +newParams.w.value;
      message = 'Weather Grouping set to Weekly';
    }
  } else {
    if (weather.grouping !== 'day') {
      weather.setGrouping('day');
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
  if (previewChanged) message = 'Preview';

  if (message) {
    toast.trigger({
      message: `<span class="flex flex-wrap items-start gap-2"><span class="">${action === 'Undo' ? ICONS.arrowUturnLeft : ICONS.arrowUturnRight}</span> <span>${action}: ${message}</span></span>`,
      background: 'preset-filled-success-100-900',
    });
  }
};
export const updateHistory = () => {
  if (
    !weather.data.length ||
    !project.url.hash ||
    !locations.allValid ||
    !browser
  )
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

  // `previous`/`next` are no longer checked here: now that push() truncates
  // a stale redo branch when mid-history, a live value that happens to match
  // the about-to-be-discarded `next` entry must still be pushed - otherwise
  // that edit is silently dropped. `current` is the only value a new push
  // can legitimately duplicate (push() itself also guards this).
  if (live !== project.history.current) project.history.push(live);

  project.history.isUpdating = false;
};
