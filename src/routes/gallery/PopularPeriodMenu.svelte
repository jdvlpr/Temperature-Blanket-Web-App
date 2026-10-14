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
  How far back the Popular sort counts views, as a menu beside Sort:
  "Views: Past Month". Shared by both gallery pages.
-->
<script lang="ts">
  import ChoiceMenu from '#lib/components/buttons/ChoiceMenu.svelte';
  import { ClockIcon } from '@lucide/svelte';
  import { galleryFilters } from './state.svelte';

  interface Props {
    onchange: () => void;
  }

  let { onchange }: Props = $props();

  // Days, as the gallery's popular route takes them
  const options = [
    { value: '1', label: 'Past Day' },
    { value: '7', label: 'Past Week' },
    { value: '30', label: 'Past Month' },
    { value: '365', label: 'Past Year' },
  ] as const;
</script>

<ChoiceMenu
  {options}
  value={options.find(
    (option) => Number(option.value) === galleryFilters.popularDays,
  )?.value}
  onchange={(value) => {
    galleryFilters.popularDays = Number(value);
    onchange();
  }}
  label="Views"
  icon={ClockIcon}
/>
