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

import { MOON_PHASE_NAMES } from '#lib/constants/weather-constants.js';
import PdfOptions from '#lib/components/modals/PdfOptions.svelte';
import {
  allGaugesAttributes,
  gauges,
  getWPGauge,
} from '#lib/state/gauges-state.svelte.js';
import { dialog } from '#lib/state/page-state.svelte.js';
import { locations } from '#lib/state/location-state.svelte.js';
import { previews } from '#lib/state/preview-state.svelte.js';
import { project } from '#lib/state/project-state.svelte.js';
import { weather } from '#lib/state/weather-state.svelte.js';
import { preferences } from '#lib/storage/preferences.svelte.js';
import { colorsToCode, colorsToYarnDetails } from '#lib/utils/color-utils.js';
import { buildGalleryRequestBody } from '#lib/utils/gallery-upload-utils.js';
import { TURNSTILE_HEADER } from '#lib/utils/turnstile.js';
import { convertTime } from '#lib/utils/unit-utils.svelte.js';
import {
  dateToISO8601String,
  getLocalISODateString,
  stringToDate,
} from '#lib/utils/date-utils.js';
import { decodeHtmlEntities, escapeHtml } from '#lib/utils/string-utils.js';
import type { GaugeAttributes } from '#lib/types/gauge-types.js';
import type { Color } from '#lib/types/yarn-types.js';

export const getProjectParametersFromURLHash = (
  hash: string,
): Record<string, { key: string; value: string }> => {
  return hash
    .split('&')
    .reduce((res: Record<string, { key: string; value: string }>, item) => {
      const parts = item.split('=');
      res[parts[0]] = {
        key: parts[0],
        value: decodeURIComponent(parts[1]),
      };
      return res;
    }, {});
};

/** Asks what to put in the PDF, then downloads it */
export const downloadPDF = () => {
  dialog.trigger({
    type: 'component',
    component: { ref: PdfOptions },
    options: { title: 'Download PDF' },
  });
};

export const downloadWeatherCSV = () => {
  const labels: string[] = [];
  allGaugesAttributes.forEach((gauge) => {
    gauge.targets.forEach((target) => {
      if (target?.id === 'dayt') {
        labels.push(`${target.label} (h:m)`);
      } else if (target?.id === 'moon') {
        labels.push(`${target.label}`);
      } else {
        labels.push(
          `${target.label} (${gauge.unit.label[preferences.value.units ?? 'metric']})`,
        );
      }
    });
  });
  if (!weather.data) return;
  const _units = preferences.value.units ?? 'metric';
  const _weather = [...weather.data].map((day, index) => {
    const gaugeInfo: (string | number | null)[] = [];
    allGaugesAttributes?.forEach((gauge) => {
      gauge.targets?.forEach((target) => {
        if (target?.id === 'dayt') {
          gaugeInfo.push(
            convertTime(day[target.id][_units], {
              displayUnits: false,
              padStart: true,
            }),
          );
        } else if (target?.id === 'moon') {
          const moon = day[target.id];
          gaugeInfo.push(moon !== null ? MOON_PHASE_NAMES[moon] : null);
        } else {
          gaugeInfo.push(day[target.id][_units]);
        }
      });
    });
    return [
      index + 1,
      dateToISO8601String(day.date),
      locations.all?.filter((n) => n.index === day.location)[0]?.index,
      ...(locations.all
        ?.filter((n) => n.index === day.location)?.[0]
        ?.label?.split(',') ?? []),
      gaugeInfo,
    ];
  });
  const dateHeader = weather.grouping === 'week' ? 'Week Of' : 'Date';
  const data = [
    [
      'Item Number',
      dateHeader,
      'Location Index',
      'City',
      'State/Region',
      'Country',
      ...labels,
    ],
    ..._weather,
  ];
  const csvContent = `data:text/csv;charset=utf-8,\uFEFF${data?.map((e) => e.join(',')).join('\n')}`;
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Weather-Data-${locations.projectFilename}`);
  link.className = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/** What happened when the project was sent to the gallery, for the dialog to show. */
export type GallerySendResult =
  | {
      status: 'sent';
      /** The new gallery page */
      link: string;
      /** Recorded to the signed-in account, so it can be changed or removed later */
      linked: boolean;
      /** Replacing a page: whether the old one came off (null when not replacing) */
      oldRemoved: boolean | null;
    }
  /** The same project is in the gallery already: that page */
  | { status: 'duplicate'; link: string; title: string; oldRemoved: boolean }
  | { status: 'too-large' }
  /** Publishing from accounts is paused, and a replaced page can't go anonymously */
  | { status: 'paused' }
  /** WordPress's own message, if it gave one (plain text) */
  | { status: 'error'; message: string; oldRemoved: boolean };

/** Steps of a send after the image, for the dialog to say what it's doing. */
export type GallerySendStep = 'checking' | 'sending' | 'removing-old';

/**
 * Sends the project to the gallery. `fromAccount` publishes it as the signed-in
 * user when it's saved to their account, falling back to an anonymous submission
 * when that isn't possible.
 */
export const sendToProjectGallery = async (
  img: string,
  {
    fromAccount = false,
    showOwner = false,
    name = '',
    replacePostId,
    getGuestToken,
    onStep,
  }: {
    fromAccount?: boolean;
    /** From an account: include it on the owner's public gallery, with their name */
    showOwner?: boolean;
    /** The name the project was given, shown in the gallery instead of its location title */
    name?: string;
    /** From an account: the project's old gallery page, removed once this one is in */
    replacePostId?: number;
    /** A new Turnstile token, which a submission without the account needs */
    getGuestToken?: () => Promise<string>;
    onStep?: (step: GallerySendStep) => void;
  } = {},
): Promise<GallerySendResult> => {
  const colors: Color[][] = [];
  const palettes: string[] = [];
  const yarnUrls: string[] = [];
  const yarnDetails: { name: string }[] = [];
  const labels: (GaugeAttributes['label'] | undefined)[] = [];
  const tables: Record<string, unknown>[][] = [];
  gauges.allCreated.forEach((gauge) => {
    const gaugeColors = gauge.colors ?? [];
    colors.push(gaugeColors);
    labels.push(gauge.label);
    palettes.push(colorsToCode(gaugeColors, { includePrefixes: true }));
    const colorsCode = colorsToCode(gaugeColors, {
      includePrefixes: false,
    });
    const names = [
      ...new Set(
        gaugeColors
          .filter((n) => !!n?.brandName && !!n?.yarnName)
          .map((n) => `${n.brandName} - ${n.yarnName}`),
      ),
    ].join(', ');
    yarnDetails.push({ name: names });
    const yarnURLDetails = colorsToYarnDetails({
      colors: gaugeColors,
    });
    let yarnSearchUrl = `${window.location.origin}/yarn?s=${colorsCode}&f=${yarnURLDetails}`;
    yarnUrls.push(yarnSearchUrl);
    tables.push(getWPGauge(gauge));
  });

  const _locations = locations.all?.map((location) => {
    return {
      label: location.label,
      from: location.from,
      to: location.to,
      latlong: `${location.lat},${location.lng}`,
    };
  });

  const debugData = getDebugData();

  const data = {
    colors: JSON.stringify(colors),
    debug_data: JSON.stringify(debugData),
    gauges: JSON.stringify(labels),
    img,
    locations: JSON.stringify(_locations),
    missing_days: weather.missingDaysCount(),
    palettes: JSON.stringify(palettes),
    project_url: project.url.href,
    raw_weather_data: JSON.stringify(weather.rawData),
    tables: JSON.stringify(tables),
    title: locations.projectTitle,
    total_days: weather.rawData.length,
    yarn_urls: JSON.stringify(yarnUrls),
    yarn_details: JSON.stringify(yarnDetails),
    weather_grouping: weather.grouping,
    weather_sources: JSON.stringify(weather.getWeatherSourceDetails()),
    wp_tag_id: previews.active?.wpTagId,
    // Only when named: older gallery plugins ignore it, and the title stays the
    // location title so gallery search by place still works
    ...(name && { project_name: name }),
  };
  // My Projects' Sharing rows show the new page (and not the old one)
  const pagesChanged = async () => {
    if (!fromAccount) return;
    const { GALLERY_PAGES_CHANGED } = await import('#lib/accounts/gallery.js');
    window.dispatchEvent(new Event(GALLERY_PAGES_CHANGED));
  };
  // WordPress's messages are text, never HTML
  const text = (value: unknown) =>
    decodeHtmlEntities(String(value ?? '')).trim();
  try {
    const body = await buildGalleryRequestBody(data);
    if (!body) return { status: 'too-large' };
    // WordPress's answer, from either route
    const publish = async () => {
      if (fromAccount) {
        const { publishFromAccount } = await import('#lib/accounts/gallery.js');
        const result = await publishFromAccount(body, { showOwner });
        if (result.status === 'answered') return result.response;
      }
      // Replacing a page is only from an account: never a second, anonymous one
      if (replacePostId) return null;
      // Got just before it's sent, since a token expires and works only once
      let token = '';
      if (getGuestToken) {
        onStep?.('checking');
        try {
          token = await getGuestToken();
        } catch {
          return {
            code: 503,
            message:
              "The check that you're not a robot couldn't load. If you use a content blocker, allow challenges.cloudflare.com, then try again.",
          };
        }
        onStep?.('sending');
      }
      const request = await fetch('/api/project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { [TURNSTILE_HEADER]: token }),
        },
        body,
      });
      return await request.json();
    };
    const removeOld = async () => {
      if (!replacePostId) return true;
      onStep?.('removing-old');
      const { removeGalleryPage } = await import('#lib/accounts/gallery.js');
      try {
        await removeGalleryPage(replacePostId);
        return true;
      } catch {
        return false;
      }
    };

    onStep?.('sending');
    let response = await publish();
    if (!response) return { status: 'paused' };
    // Replacing with the same settings (only its name changed, say): the old
    // page is the duplicate, so it goes first. Removed pages aren't duplicates.
    let oldRemoved: boolean | null = null;
    if (response.code === 409 && replacePostId) {
      oldRemoved = await removeOld();
      if (oldRemoved) {
        onStep?.('sending');
        response = (await publish()) ?? response;
      }
    }

    if (response.code === 200) {
      if (replacePostId) oldRemoved ??= await removeOld();
      await pagesChanged();
      project.gallery.href = response.link;
      project.gallery.title = text(response.title);
      return {
        status: 'sent',
        link: String(response.link ?? ''),
        linked: Boolean(response.linked),
        oldRemoved,
      };
    }
    if (oldRemoved) await pagesChanged();
    if (response.code === 409) {
      // The same project's page, already in the gallery
      const page =
        typeof response.data === 'string'
          ? JSON.parse(response.data)
          : (response.data ?? {});
      return {
        status: 'duplicate',
        link: String(page.permalink ?? ''),
        title: text(page.title),
        oldRemoved: Boolean(oldRemoved),
      };
    }
    // 400: unexpected or missing request param; 500: pattern type, image
    // upload or attachment error
    return {
      status: 'error',
      message: text(response.message),
      oldRemoved: Boolean(oldRemoved),
    };
  } catch {
    return { status: 'error', message: '', oldRemoved: false };
  }
};

// In the backend db, each project has a locations meta key
// locations is a stringified array of objects `{ label: '', from: '', to: '', latlong: '' }`
/** A gallery project's locations as text, each with its dates in the user's locale */
export const getLocationsFromMeta = (
  locations: string | null,
): { label: string; from: string; to: string }[] => {
  const _locations: { label: string; from: string; to: string }[] | null =
    locations ? JSON.parse(locations) : null;
  if (!_locations) return [];

  // Older project gallery items didn't always use the standard ISO 8601 date format, so we need to be able to check if it's a valid date.
  const isValidDate = (string: string): boolean => {
    return !isNaN(new Date(string).getTime());
  };

  return _locations.map((item) => {
    // Some locations have a missing city name `, ,`, so replace that with just one comma `,`
    const label = String(item.label ?? '').replace(', ,', ',');

    let from: string = String(item.from ?? '');
    let to: string = String(item.to ?? '');

    // Before version 3.36.0, projects' location from and to dates were saved in the user's locale format,
    // which means different project's displayed other locale's formats, not always the user's locale formate.
    // So if possible, we convert non-user locale dates into the user's locale format.
    if (isValidDate(from) && isValidDate(to)) {
      from = new Date(from).toLocaleDateString(undefined, {
        timeZone: 'UTC',
      });
      to = new Date(to).toLocaleDateString(undefined, {
        timeZone: 'UTC',
      });
    }

    return { label, from, to };
  });
};

/** A gallery project's locations as plain text, like "Paris, France from 1/1/2024 to 12/31/2024" */
export const getTitleTextFromLocationsMeta = (locations: string | null) =>
  getLocationsFromMeta(locations)
    .map(({ label, from, to }) => `${label} from ${from} to ${to}`)
    .join('; ');

export const getTitleFromLocationsMeta = (locations: string | null): string =>
  getLocationsFromMeta(locations)
    // Anyone can send any label to the gallery, and this is shown as HTML: escape it
    .map(
      ({ label, from, to }) =>
        `<span class="font-bold">${escapeHtml(label)}</span> from ${escapeHtml(from)} to ${escapeHtml(to)}`,
    )
    .join('; ');

// Temporariy diagnostics
function getDebugData() {
  // previous
  let previous_today = new Date();
  previous_today.setHours(0, 0, 0, 0);
  // set the _to end date to yesterday, the last day which should be included in the request for weather data
  const previous_yesterday = new Date(
    previous_today.getTime() - 24 * 60 * 60 * 1000,
  );
  const previous_newTOStart = dateToISO8601String(previous_yesterday);

  // current
  const todayStr = getLocalISODateString();
  const todayStrToDate = stringToDate(todayStr);
  const yesterday = new Date(todayStrToDate);
  yesterday.setUTCDate(todayStrToDate.getUTCDate() - 1);
  const new_TOStart = dateToISO8601String(yesterday);
  return {
    previous: {
      today: previous_today,
      yesterday: previous_yesterday,
      newTOStart: previous_newTOStart,
    },
    current: {
      todayStr,
      todayStrToDate,
      yesterday,
      new_TOStart,
    },
  };
}
