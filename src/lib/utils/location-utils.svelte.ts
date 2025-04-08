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

export const formatFeatureName = (fclName) => {
  let _featureName = fclName;
  // remove '...'
  if (_featureName.includes('...')) {
    _featureName = _featureName.replace(/\.../g, '');
  }

  // remove spaces
  _featureName = _featureName.trim();

  // remove last ','
  if (_featureName.slice(-1) === ',') {
    _featureName = _featureName.slice(0, -1);
  }

  // split and join
  _featureName = _featureName
    .split(',')
    .map((n) => n.trim())
    .join(', ');

  if (_featureName.includes('city')) {
    // 'city, village'
    _featureName =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building-2 size-3"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg> ` +
      _featureName;
  } else if (_featureName.includes('parks')) {
    // 'parks, area'
    _featureName =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-tree-pine size-3"><path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17Z"/><path d="M12 22v-3"/></svg> ` +
      _featureName;
  } else if (_featureName.includes('mountain')) {
    // 'mountain, hill, rock'
    _featureName =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mountain size-3"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg> ` +
      _featureName;
  } else if (_featureName.includes('spot')) {
    // 'spot, building, farm'
    _featureName =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin-check-inside size-3"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><path d="m9 10 2 2 4-4"/></svg> ` +
      _featureName;
  } else if (_featureName.includes('stream')) {
    // 'stream, lake'
    _featureName =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-waves size-3"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg> ` +
      _featureName;
  }

  return _featureName;
};

export const formatLocationLabel = (item) => {
  let labelText = item.name;

  if (
    item.adminName1 !== '' &&
    item?.countryName &&
    item.adminName1 === item.countryName
  ) {
    labelText += `, ${item.adminName1}`;
  } else if (item.adminName1 !== '' && item?.countryName) {
    labelText += `, ${item.adminName1}, ${item.countryName}`;
  }

  return labelText;
};

export const getSuggestions = (data) => {
  return data.map((item) => {
    let labelText = formatLocationLabel(item);

    let icon = '';
    if (item.countryCode)
      icon = `<span class="fflag fflag-${item.countryCode.toUpperCase()} shrink-0"></span>`;

    const featureName = formatFeatureName(item.fclName);

    return {
      // adminName: item.adminName1,
      // country: item.countryName,
      id: item.geonameId,
      label: labelText,
      lng: item.lng,
      lat: item.lat,
      result: `${icon} ${labelText}`,
      fclName: featureName,
      flagIcon: icon,
      population: item.population,
      // name: item.name,
      // value: result
    };
  });
};

export const renderResult = (item) => {
  return `
    <div class="flex items-center gap-2">
        <div class="">${item.flagIcon}</div>
        <div class="flex-auto">${item.label}</div>
        <div class="text-xs opacity-50 flex items-center gap-2">${item.fclName}</div>
      </div>
  `;
};
