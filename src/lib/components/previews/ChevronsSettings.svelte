<!-- Copyright (c) 2024, Thomas (https://github.com/jdvlpr)

This file is part of Temperature-Blanket-Web-App.

Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free Software Foundation, 
either version 3 of the License, or (at your option) any later version.

Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App. 
If not, see <https://www.gnu.org/licenses/>. -->

<script context="module">
  import { LOADED_APP_VERSION, CHARACTERS_FOR_URL_HASH } from '$lib/constants';
  import { activePreview } from '$lib/stores';
  import { derived, writable } from 'svelte/store';

  const id = 'chev';

  const defaultSettings = {
    selectedTargets: ['tmax'],
    chevronsPerRow: 30,
    chevronSideLength: 32,
  };

  export const settings = writable(JSON.parse(JSON.stringify(defaultSettings)));

  export const details = writable(null);

  export const hash = derived(settings, ($settings) => {
    let hash = '&';
    hash += `${id}=`;
    hash += `${$settings.selectedTargets.join('')}(${$settings.chevronsPerRow}${CHARACTERS_FOR_URL_HASH.separator}${
      $settings.chevronSideLength
    })`;
    return hash;
  });

  export const load = (hash) => {
    let _settings = JSON.parse(JSON.stringify(defaultSettings));

    let startIndex, endIndex, separatorIndex;
    for (let i = 0; i < hash.length; i++) {
      if (hash[i] === '(') startIndex = i;
      if (
        hash[i] === CHARACTERS_FOR_URL_HASH.separator ||
        hash[i] === CHARACTERS_FOR_URL_HASH.separator_alt
      )
        separatorIndex = i;
      if (hash[i] === ')') endIndex = i;
    }
    if (!startIndex || !separatorIndex || !endIndex) return; // format of hash was wrong, so stop processing
    const params = hash.substring(0, startIndex).match(/.{1,4}/g);
    _settings.selectedTargets = params;
    _settings.chevronsPerRow = +hash.substring(startIndex + 1, separatorIndex);
    _settings.chevronSideLength = +hash.substring(separatorIndex + 1, endIndex);
    if (!upToDate(LOADED_APP_VERSION, '1.747'))
      _settings.chevronSideLength = Math.round(
        (_settings.chevronSideLength / 2) * Math.sqrt(2),
      ); // Version 1.747 changed chevronWidth to the length of each side of the chevron
    settings.set(_settings);
    activePreview.setId(id);
  };
</script>

<script>
  import { createdGauges, weatherGrouping } from '$lib/stores';
  import { setTargets } from '$lib/utils';
  import { capitalizeFirstLetter, upToDate } from '$lib/utils/other-utils';
  import { pluralize } from '$lib/utils/string-utils';
  import NumberInputButton from '$lib/components/buttons/NumberInputButton.svelte';
  import ToggleSwitchGroup from '$lib/components/buttons/ToggleSwitchGroup.svelte';

  $: targets = $createdGauges.map((n) => n.targets).flat();

  $: if ($createdGauges)
    $settings.selectedTargets = setTargets($settings.selectedTargets);
</script>

{#if $details}
  <p class="italic w-full">
    {$details.rows} rows. The length of the side of a chevron is {$settings.chevronSideLength}
    {pluralize('stitch', $settings.chevronSideLength, 'es')}.
  </p>
{/if}

<div class="text-left">
  <ToggleSwitchGroup
    groupLabel={`Color Using the ${capitalizeFirstLetter(weatherGrouping.value)}'s`}
    {targets}
    bind:value={$settings.selectedTargets}
  />
</div>

<NumberInputButton
  bind:value={$settings.chevronsPerRow}
  title="Chevrons Per Row"
  icon={true}
/>

<NumberInputButton
  bind:value={$settings.chevronSideLength}
  title="Chevron Side Length"
  icon={true}
/>
