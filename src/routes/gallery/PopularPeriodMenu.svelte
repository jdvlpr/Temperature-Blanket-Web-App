<!-- Copyright (c) 2024 - 2026, Thomas (https://github.com/jdvlpr)

This file is part of Temperature-Blanket-Web-App.

Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free Software Foundation,
either version 3 of the License, or (at your option) any later version.

Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App.
If not, see <https://www.gnu.org/licenses/>. -->

<!-- @component
  How far back Featured counts views, as a menu like View and Sort:
  "Popular: Past Week". Shared by both tabs.
-->
<script lang="ts">
  import ChoiceMenu from '#lib/components/buttons/ChoiceMenu.svelte';
  import { ClockIcon } from '@lucide/svelte';
  import { galleryFilters } from './state.svelte';

  interface Props {
    onchange: () => void;
  }

  let { onchange }: Props = $props();

  // Months, as the popular posts endpoint takes them
  const options = [
    { value: '0.0357', label: 'Past Day' },
    { value: '0.25', label: 'Past Week' },
    { value: '1', label: 'Past Month' },
    { value: '12', label: 'Past Year' },
  ] as const;
</script>

<ChoiceMenu
  {options}
  value={options.find(
    (option) => Number(option.value) === galleryFilters.timePeriod,
  )?.value}
  onchange={(value) => {
    galleryFilters.timePeriod = Number(value);
    onchange();
  }}
  label="Popular"
  icon={ClockIcon}
/>
