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

import pdfGauges from '$lib/pdf/sections/gauges.svelte';
import pdfWeatherData from '$lib/pdf/sections/weather-data.svelte';
import {
  allGaugesAttributes,
  gaugesState,
  locationsState,
  previewsState,
  projectGalleryLink,
  projectGalleryTitle,
  projectStatus,
  units,
  weather,
  weatherGrouping,
  weatherUngrouped,
} from '$lib/state';
import {
  colorsToCode,
  colorsToYarnDetails,
  convertTime,
  dateToISO8601String,
  getWPGauge,
  getWeatherSourceDetails,
  missingDaysCount,
} from '$lib/utils';
import { get } from 'svelte/store';

export const getProjectParametersFromURLHash = (hash) => {
  return hash.split('&').reduce(function (res, item) {
    const parts = item.split('=');
    res[parts[0]] = {
      key: parts[0],
      value: decodeURIComponent(parts[1]),
    };
    return res;
  }, {});
};

export const downloadPDF = async () => {
  await import('jspdf')
    .then((module) => {
      const JsPDF = module.default;
      const doc = new JsPDF();
      pdfGauges.create(doc);
      pdfWeatherData.create(doc);
      // Remove blank first page, ugly hack
      doc.deletePage(1);
      doc.save(`Temperature-Blanket-${locationsState.projectFilename}.pdf`);
    })
    .catch((error) => {
      throw new Error(error);
    });
};

export const downloadWeatherCSV = () => {
  const labels = [];
  allGaugesAttributes.forEach((gauge) => {
    gauge.targets.forEach((target) => {
      if (target?.id === 'dayt') {
        labels.push(`${target.label} (h:m)`);
      } else {
        labels.push(`${target.label} (${gauge.unit.label[get(units)]})`);
      }
    });
  });
  if (!weather.data) return;
  const _units = get(units);
  const _weather = [...weather.data].map((day, index) => {
    const gaugeInfo = [];
    allGaugesAttributes?.forEach((gauge) => {
      gauge.targets?.forEach((target) => {
        if (target?.id === 'dayt') {
          gaugeInfo.push(
            convertTime(day[target?.id][_units], {
              displayUnits: false,
              padStart: true,
            }),
          );
        } else {
          gaugeInfo.push(day[target?.id][_units]);
        }
      });
    });
    return [
      index + 1,
      dateToISO8601String(day.date),
      locationsState.locations.filter((n) => n.index === day.location)[0]
        ?.index,
      ...locationsState.locations
        ?.filter((n) => n.index === day.location)?.[0]
        ?.label.split(','),
      gaugeInfo,
    ];
  });
  const dateHeader = weatherGrouping.value === 'week' ? 'Week Of' : 'Date';
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
  link.setAttribute(
    'download',
    `Weather-Data-${locationsState.projectFilename}`,
  );
  link.className = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const sendToProjectGallery = async (img) => {
  const colors = [];
  const palettes = [];
  const yarnUrls = [];
  const yarnDetails = [];
  const gauges = [];
  const tables = [];
  gaugesState.gauges.forEach((gauge) => {
    colors.push(gauge.colors);
    gauges.push(gauge.label);
    palettes.push(colorsToCode(gauge.colors, { includePrefix: true }));
    const colorsCode = colorsToCode(gauge.colors, {
      includePrefix: false,
    });
    const names = [
      ...new Set(
        gauge.colors
          .filter((n) => !!n?.brandName && !!n?.yarnName)
          .map((n) => `${n.brandName} - ${n.yarnName}`),
      ),
    ].join(', ');
    yarnDetails.push({ name: names });
    const yarnURLDetails = colorsToYarnDetails({
      colors: gauge.colors,
    });
    let yarnSearchUrl = `${window.location.origin}/yarn?s=${colorsCode}&f=${yarnURLDetails}`;
    yarnUrls.push(yarnSearchUrl);
    tables.push(getWPGauge(gauge));
  });
  const _locations = locationsState.locations?.map((location) => {
    return {
      label: location.label,
      from: location.from,
      to: location.to,
      latlong: `${location.lat},${location.lng}`,
    };
  });

  const data = {
    colors: JSON.stringify(colors),
    gauges: JSON.stringify(gauges),
    img,
    locations: JSON.stringify(_locations),
    missing_days: missingDaysCount(),
    palettes: JSON.stringify(palettes),
    project_url: projectStatus.state.liveURL,
    tables: JSON.stringify(tables),
    title: locationsState.projectTitle,
    total_days: weatherUngrouped.data?.length,
    yarn_urls: JSON.stringify(yarnUrls),
    yarn_details: JSON.stringify(yarnDetails),
    weather_grouping: weatherGrouping.value,
    weather_sources: JSON.stringify(getWeatherSourceDetails()),
    wp_tag_id: previewsState.active.wpTagId,
  };
  let message = '';
  try {
    const request = await fetch('/api/project', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    const response = await request.json();

    if (response.code === 200) {
      // success
      message = `<p class="font-bold text-xl my-2">${response.message}</p><p>The project gallery webpage has been created:</p>`;
      projectGalleryLink.value = response.link;
      projectGalleryTitle.value = response.title;
      // reloadRecentGalleryProjects();
    } else if (response.code === 409) {
      // duplicate project
      response.data = JSON.parse(response.data);
      message = response.message;
      message += `<a class="link" href="${response.data.permalink}" target="_blank">${response.data.title}</a>`;
    } else if (response.code === 400) {
      // unexpected or missing request param
      message = response.message;
    } else if (response.code === 500) {
      // pattern type error, image upload error, or attachment error
      message = response.message;
    } else {
      message = 'Error :(';
      if (response.message) message += ' ' + response.message;
    }
  } catch (error) {
    message =
      "Sorry, we're experiencing technical difficulties at the moment. Try again later.";
  }

  return message;
};

// In the backend db, each project has a locations meta key
// locations is a stringified array of objects `{ label: '', from: '', to: '', latlong: '' }`
export const getTitleFromLocationsMeta = (locations) => {
  const _locations = locations ? JSON.parse(locations) : null;
  if (!locations) return '';

  // Older project gallery items didn't always use the standard ISO 8601 date format, so we need to be able to check if it's a valid date.
  const isValidDate = (string) => {
    return !isNaN(new Date(string).getTime());
  };

  let title;
  title = _locations
    ? _locations
        .flatMap((item) => {
          // Some locations have a missing city name `, ,`, so replace that with just one comma `,`
          const label = item.label.replace(', ,', ',');

          let from = item.from;
          let to = item.to;

          // Before version 3.36.0, projects' location from and to dates were saved in the user's locale format,
          // which means different project's displayed other locale's formats, not always the user's locale formate.
          // So if possible, we convert non-user locale dates into the user's locale format.
          if (isValidDate(from) && isValidDate(to)) {
            from = new Date(from).toLocaleDateString();
            to = new Date(to).toLocaleDateString();
          }

          return `<span class="font-bold">${label}</span> from ${from} to ${to}`;
        })
        .join('; ')
    : null;

  return title || '';
};
