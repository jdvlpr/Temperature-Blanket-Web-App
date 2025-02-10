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

<script lang="ts">
  import Tooltip from '$lib/components/Tooltip.svelte';

    interface Props {
    includeFromValue: boolean,
    includeToValue:boolean,
    rangeExample: string,
    onchange: any,
  }
  
  let {
    includeFromValue = $bindable(),
    includeToValue = $bindable(),
    rangeExample,
    onchange,
  }: Props = $props();
</script>

<label class="label">
  <span class="flex flex-col justify-center items-center gap-2 my-2">
    <span class="flex flex-wrap gap-1 justify-center items-center"
      ><svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="w-6 h-6"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V13.5zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V18zm2.498-6.75h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V13.5zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V18zm2.504-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V18zm2.498-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zM8.25 6h7.5v2.25h-7.5V6zM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0012 2.25z"
        />
      </svg>
      Range Calculation Method:<span>{@html rangeExample}</span>&nbsp;
      <Tooltip>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-6 h-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
          />
        </svg>
        {#snippet tooltip()}
          <div>
            If you change this setting,
            <a
              href="/documentation/#range-calculation-methods"
              target="_blank"
              class="link"
              rel="noopener noreferrer"
              >make sure your ranges are set up correctly.</a
            >
          </div>
        {/snippet}
      </Tooltip></span
    >

    <select
      class="select max-w-[500px] truncate"
      value={`${includeFromValue.toString()}-${includeToValue.toString()}`}
      {onchange}
      title="Change Range Calculation Method"
      id="select-range-calculation-method"
    >
      <option value="true-false"
        >Include From, don't include To (default)</option
      >
      <option value="false-true">Include To, don't include From </option>
      <option value="true-true">Include both From and To</option>
      <option value="false-false">Don't include From and To</option>
    </select>
  </span>
</label>
