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

<script>
  import CloseButton from '$lib/components/modals/CloseButton.svelte';
  import WeatherSources from '$lib/components/WeatherSources.svelte';
  import { getContext } from 'svelte';

  const { close } = getContext('simple-modal');
</script>

<CloseButton onClose={close} />
<div class="p-2 sm:p-4 mt-4">
  <div class="mt-6">
    <WeatherSources />
  </div>
</div>
