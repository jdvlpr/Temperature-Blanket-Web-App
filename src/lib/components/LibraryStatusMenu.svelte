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
  My Library's Show menu: everything, or only what's published, not published,
  or only in the gallery. For signed-in accounts with gallery pages.
-->
<script lang="ts">
  import ChoiceMenu from '#lib/components/buttons/ChoiceMenu.svelte';
  import { libraryFilters } from '#lib/state/library-filters.svelte.js';
  import { LIBRARY_STATUSES } from '#lib/utils/collection-filter.js';
  import { EyeIcon } from '@lucide/svelte';
</script>

<ChoiceMenu
  label="Show"
  icon={EyeIcon}
  options={LIBRARY_STATUSES}
  value={libraryFilters.status}
  onchange={(status) => (libraryFilters.status = status)}
/>
