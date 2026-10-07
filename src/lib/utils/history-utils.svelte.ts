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

import { projectChanged } from '$lib/storage/autosave.svelte';
import { browser } from '$app/environment';
import { ICONS } from '$lib/constants/icon-constants';
import { allGaugesAttributes, gauges } from '$lib/state/gauges-state.svelte';
import { locations } from '$lib/state/location-state.svelte';
import { previews } from '$lib/state/preview-state.svelte';
import { project } from '$lib/state/project-state.svelte';
import { toast } from '$lib/state/page-state.svelte';
import { weather } from '$lib/state/weather-state.svelte';
import { preferences } from '$lib/storage/preferences.svelte';
import { showHistoryChange } from '$lib/utils/feedback.svelte';
import { exists } from '$lib/utils/other-utils';
import { escapeHtml } from '$lib/utils/string-utils';
import type { GaugeRange, GaugeRangeOptions } from '$lib/types/gauge-types';
import type { Color } from '$lib/types/yarn-types';
import { getProjectParametersFromURLHash } from '$lib/utils/project-utils.svelte';
import { parseGaugeURLHash } from '$lib/utils/load-project-utils.svelte';
import { seasonsFromUrlHash } from '$lib/utils/seasons-utils.svelte';
import {
  EXTRA_COLORS_HASH_KEY,
  extraColorDetailsFromUrlHash,
} from '$lib/utils/extra-colors-utils';

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

  const oldParams = getProjectParametersFromURLHash(oldHistoryState ?? '');
  const newParams = getProjectParametersFromURLHash(newHistoryState ?? '');

  let message = '';

  // What changed, to glow for a moment: a gauge's colors/ranges, and the preview
  let changedGaugeId: string | null = null;
  let changedIndex: number | null = null;

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

  // Change the preview's accent/border color yarn details (the `x` param)
  const oldExtraColors = oldParams[EXTRA_COLORS_HASH_KEY]?.value ?? '';
  const newExtraColors = newParams[EXTRA_COLORS_HASH_KEY]?.value ?? '';
  if (
    (previewChanged || oldExtraColors !== newExtraColors) &&
    previews.active &&
    'extraColorDetails' in previews.active
  ) {
    previews.active.extraColorDetails =
      extraColorDetailsFromUrlHash(newExtraColors);
    if (oldExtraColors !== newExtraColors) previewChanged = true;
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
        message = 'Units set to Imperial';
      }
      if (newParams.u.value === 'm') {
        preferences.value.units = 'metric';
        message = 'Units set to Metric';
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

        const _gauge = gauges.allCreated.find((g) => g.id === gauge.id);
        const name = gauge.label.replace(/ Gauge$/, '');
        if (!exists(oldParams[gauge.id])) message = `${gauge.label} added`;
        else message = name;
        if (_gauge && settings) {
          const before = gaugeChangeState(_gauge as GaugeChangeState);
          _gauge.updateSettings({ settings });
          const after = gaugeChangeState(_gauge as GaugeChangeState);
          changedGaugeId = gauge.id;
          changedIndex = changedColorIndex(
            before.colors.map((color) => color?.hex),
            after.colors.map((color) => color?.hex),
          );
          const change = describeGaugeChange(before, after);
          if (change && exists(oldParams[gauge.id]))
            message = `${name}: ${change}`;
        }
      }
    } else if (exists(oldParams[gauge.id])) {
      gauges.remove(gauge.id);
      message = `${gauge.label} removed`;
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

  showHistoryChange({
    gaugeId: changedGaugeId,
    indices: changedIndex === null ? [] : [changedIndex],
    preview: previewChanged,
  });

  if (message) {
    toast.trigger({
      message: `<span class="flex flex-wrap items-start gap-2"><span class="">${action === 'Undo' ? ICONS.arrowUturnLeft : ICONS.arrowUturnRight}</span> <span>${action}: ${escapeHtml(message)}</span></span>`,
      background: 'preset-filled-success-100-900',
    });
  }
};
export type GaugeChangeState = {
  colors: Color[];
  ranges?: GaugeRange[];
  rangeOptions?: GaugeRangeOptions;
};

/** How a gauge's ranges are generated, in a few words */
function generationOf(options: GaugeRangeOptions): string {
  if (options.isCustomRanges) return 'custom ranges';
  if (options.mode === 'manual')
    return `manual steps, every ${options.manual.increment} from ${options.manual.start}`;
  const by = { tmax: 'high', tavg: 'average', tmin: 'low' } as const;
  const optimization = options.auto.optimization;
  if (optimization === 'ranges')
    return options.auto.roundIncrement ? 'even steps, rounded' : 'even steps';
  return `even days by ${by[optimization]} temperature`;
}

const includesLabel = (o: GaugeRangeOptions) =>
  o.includeFromValue && o.includeToValue
    ? 'both From and To'
    : o.includeFromValue
      ? 'From, not To'
      : o.includeToValue
        ? 'To, not From'
        : 'neither From nor To';

/**
 * What an undo or redo changed in one gauge, as it is afterwards (e.g.
 * "color 3 changed to Ruby Red", "range 2 is 10 to 20"), or '' when nothing
 * specific can be said. Colors first, then how ranges are made, then ranges.
 */
export function describeGaugeChange(
  before: GaugeChangeState,
  after: GaugeChangeState,
): string {
  const hexes = (state: GaugeChangeState) => state.colors.map((c) => c?.hex);
  const was = hexes(before);
  const now = hexes(after);
  const colorName = (c: Color | undefined) => c?.name || c?.hex || 'a color';

  if (was.join() !== now.join()) {
    const index = changedColorIndex(was, now);
    if (now.length === was.length + 1)
      return index === null
        ? `${now.length} colors`
        : `color ${index + 1} added (${colorName(after.colors[index])})`;
    if (now.length === was.length - 1) {
      const removed = was.findIndex((hex, i) => hex !== now[i]);
      const shifted = now.every(
        (hex, i) => hex === was[i < removed ? i : i + 1],
      );
      return shifted
        ? `color ${removed + 1} removed (${colorName(before.colors[removed])})`
        : `${now.length} colors`;
    }
    if (now.length !== was.length || index === null) return 'colors changed';
    const sameColors = [...was].sort().join() === [...now].sort().join();
    return sameColors
      ? `color moved to ${index + 1}`
      : `color ${index + 1} changed to ${colorName(after.colors[index])}`;
  }

  const oldRanges = before.ranges ?? [];
  const newRanges = after.ranges ?? [];
  const changed = newRanges.flatMap((r, i) =>
    r.from !== oldRanges[i]?.from || r.to !== oldRanges[i]?.to ? [i] : [],
  );
  const oneRange =
    changed.length === 1
      ? `range ${changed[0] + 1} is ${newRanges[changed[0]].from} to ${newRanges[changed[0]].to}`
      : '';

  const a = before.rangeOptions;
  const b = after.rangeOptions;
  if (a && b) {
    if (generationOf(a) !== generationOf(b)) {
      // Editing one range makes them custom: say which range
      const onlyCustom =
        generationOf({ ...a, isCustomRanges: false }) ===
        generationOf({ ...b, isCustomRanges: false });
      return onlyCustom && oneRange
        ? oneRange
        : `ranges set to ${generationOf(b)}`;
    }
    if (a.direction !== b.direction)
      return `direction ${b.direction === 'high-to-low' ? 'high to low' : 'low to high'}`;
    if (includesLabel(a) !== includesLabel(b))
      return `each range includes ${includesLabel(b)}`;
    if (a.linked !== b.linked)
      return b.linked ? 'linked ranges on' : 'linked ranges off';
  }

  if (oneRange) return oneRange;
  if (changed.length) return 'ranges changed';
  return '';
}

/** A gauge's colors, ranges and range options as they are now, to compare */
export function gaugeChangeState(gauge: GaugeChangeState): GaugeChangeState {
  return $state.snapshot({
    colors: gauge.colors,
    ranges: gauge.ranges,
    rangeOptions: gauge.rangeOptions,
  }) as GaugeChangeState;
}

/**
 * Says what a change to a gauge's range settings did, e.g. "Temperature:
 * Direction low to high", with Undo
 */
export function confirmGaugeChange(
  gaugeId: string,
  before: GaugeChangeState,
  after: GaugeChangeState,
) {
  const change = describeGaugeChange(before, after);
  if (!change) return;
  const label = allGaugesAttributes.find((g) => g.id === gaugeId)?.label;
  const name = label?.replace(/ Gauge$/, '');
  const text = `${change[0].toUpperCase()}${change.slice(1)}`;
  toast.trigger({
    category: 'success',
    message: escapeHtml(name ? `${name}: ${text}` : text),
    action: {
      label: 'Undo',
      response: () => {
        // The change goes into history a moment after it's made; make sure
        // it's there, so Undo takes back this change and not the one before
        updateHistory();
        if (!project.history.isFirst && !project.history.isUpdating)
          void loadFromHistory({ action: 'Undo' });
      },
    },
  });
}

/**
 * The one color an undo or redo changed, added, or moved, by its index afterwards — or null when there's
 * no single color to point to (only ranges changed, a color was removed, or the whole palette changed)
 */
export function changedColorIndex(
  before: (string | undefined)[],
  after: (string | undefined)[],
): number | null {
  const length = Math.max(before.length, after.length);
  let first = -1;
  let last = -1;
  for (let i = 0; i < length; i++) {
    if (before[i] !== after[i]) {
      if (first === -1) first = i;
      last = i;
    }
  }
  if (first === -1) return null;

  // A color was added: everything after it shifted along by one
  if (after.length === before.length + 1) {
    const withoutIt = after.filter((_, i) => i !== first);
    return withoutIt.every((hex, i) => hex === before[i]) ? first : null;
  }
  if (after.length !== before.length) return null;

  // One color changed
  if (first === last) return first;

  // One color moved: the colors between where it was and where it is shifted by one
  const shifted = (from: number, to: number, by: number) => {
    for (let i = from; i <= to; i++)
      if (after[i] !== before[i + by]) return false;
    return true;
  };
  if (after[first] === before[last] && shifted(first + 1, last, -1))
    return first;
  if (after[last] === before[first] && shifted(first, last - 1, 1)) return last;
  return null;
}

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
  projectChanged();
};
