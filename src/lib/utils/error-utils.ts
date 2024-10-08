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

import Alert from '$lib/components/modals/Alert.svelte';
import { modal } from '$lib/stores';
import { onlineStore } from 'svelte-legos';
import { bind } from 'svelte-simple-modal';
import { get } from 'svelte/store';

/**
 * Display error message
 * Status codes are from https://www.geonames.org/export/webservice-exception.html
 *
 * @param   {string}  message  error message
 *
 */
export const displayGeoNamesErrorMessage = (message) => {
  const isOnline = onlineStore();
  const isOffline = !get(isOnline);

  let text = `
  <p class='font-bold text-2xl'>Whoa!</p>
  <p class='font-bold'>There's been a problem.</p>`;

  if (isOffline) {
    text += `<p class="my-4">It appears you're offline.</p>`;
  } else {
    text += `<p class='my-4'>It appears the location-fetching service is experiencing technical difficulties.
  You can refresh this webpage, or try again later. Sorry for the inconvenience.</p>`;

    if (message) text += `<p class="my-4 italic text-xs">${message}</p>`;
  }

  text += `<p class="text-5xl mt-2 font-ornament">J</p>`;

  modal.set(
    bind(Alert, {
      message: text,
    }),
  );
};
