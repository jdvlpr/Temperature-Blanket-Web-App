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

<!-- Gauges & Ranges: Gauges.svelte, Gauge.svelte, GaugeCustomizer,
RangesMenu, range-format. Section ids are the old single page's
(OLD_ANCHORS); RangesMenu links to #range-calculation-methods. -->

<script lang="ts">
  import DocsShot from '#lib/components/docs/DocsShot.svelte';
  import RelatedGuides from '#lib/components/docs/RelatedGuides.svelte';

  // Which of 13, 12.5 and 12 a range 13° → 12° holds, for each choice in
  // Each range includes (RangesMenu's `includes`)
  const includes = [
    { label: 'From, not To (default)', values: [true, true, false] },
    { label: 'To, not From', values: [false, true, true] },
    { label: 'Both From and To', values: [true, true, true] },
    { label: 'Neither', values: [false, true, false] },
  ];
</script>

<p>
  A gauge is your blanket's key: a list of yarn colors, each with a range of
  weather. A day's weather falls in one range, and that range's color is the
  color of the day's row or square.
</p>

<section class="flex flex-col gap-3">
  <h2 id="add-a-gauge" class="text-2xl font-bold">Gauges</h2>
  <p>
    Every project has a <span class="font-bold">Temperature Gauge</span>. Add
    more to use other weather in the same blanket, like a rain stripe between
    temperature rows. The buttons above the colors switch between gauges; one
    with a <span class="font-bold">+</span> isn't in your project yet, and pressing
    it asks to add it.
  </p>
  <ul class="ml-6 list-disc space-y-1">
    <li>
      <span class="font-bold">Temperature Gauge:</span> high, average and low temperatures.
    </li>
    <li>
      <span class="font-bold">Rain Gauge</span> and
      <span class="font-bold">Snow Gauge</span>: how much fell.
    </li>
    <li>
      <span class="font-bold">Daytime Gauge:</span> hours from sunrise to sunset.
    </li>
    <li>
      <span class="font-bold">Moon Phase Gauge:</span> eight colors, one for each
      phase of the moon. Its ranges are fixed; you only choose the colors.
    </li>
  </ul>
  <p>
    A gauge shows up only when the weather has what it needs. To remove one
    (except temperature), open it and press <span class="font-bold">Delete</span
    >
    under the gauge buttons. Which gauge a row or square uses is set in the
    <a href="/documentation/preview" class="link">preview</a>.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="adjust-ranges" class="text-2xl font-bold">Colors and Ranges</h2>
  <p>
    Each color in the gauge has its range beside it, written From → To: 30 → 20
    means from 30° down to 20°. Under the colors:
  </p>
  <ul class="ml-6 list-disc space-y-1">
    <li>
      <span class="font-bold">Change a number:</span> press it, type the new
      number, then press <span class="font-bold">Save</span> (or Enter). ✕, Escape,
      or pressing anywhere else puts it back.
    </li>
    <li>
      <span class="font-bold">Change a color:</span> press its swatch, and choose
      a new color or yarn.
    </li>
    <li>
      <span class="font-bold">Move a color:</span> drag it by its handle (the number).
      With a keyboard, focus the handle, press Space, move it with the arrow keys,
      and press Space again.
    </li>
    <li>
      <span class="font-bold">More (⋮):</span> the yarn's shop page, copy its
      name or hex code, <span class="font-bold">Add color before</span> or
      <span class="font-bold">after</span>, or remove it.
    </li>
    <li>
      <span class="font-bold">Number of colors:</span> the menu above the gauge, up
      to 99. With your own colors, new ones are added at the end and extra ones are
      taken off the end. With a gradient, the gradient is remade in that many colors.
    </li>
  </ul>
  <p>
    With <span class="font-bold">Days in ranges</span> on (in
    <span class="font-bold">View</span>), each color shows how many days fall in
    its range and what share of the blanket that is. Press a count to see those
    days.
  </p>
  <p>
    <span class="font-bold">View</span> also lays the colors out as a
    <span class="font-bold">Grid</span> or a
    <span class="font-bold">List</span>, and
    <span class="font-bold">Fill backgrounds</span> paints each one in its color.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="increment-modes" class="text-2xl font-bold">The Ranges Menu</h2>
  <p>
    The <span class="font-bold">Ranges</span> button above the colors says how your
    ranges were made:
  </p>
  <ul class="ml-6 list-disc space-y-1">
    <li>
      <span class="font-bold">Auto:</span> made from your weather, and remade when
      the weather or the number of colors changes.
    </li>
    <li>
      <span class="font-bold">Manual:</span> made from a step size you chose.
    </li>
    <li>
      <span class="font-bold">Edited:</span> you've changed a range's numbers yourself.
      Your edits stay until you choose Auto ranges or Manual steps again (Undo brings
      them back).
    </li>
  </ul>
  <h3 class="text-lg font-bold">Auto ranges</h3>
  <ul class="ml-6 list-disc space-y-1">
    <li>
      <span class="font-bold">Equal size:</span> every range covers the same amount,
      from your coldest to your warmest day. The menu shows the size.
    </li>
    <li>
      <span class="font-bold">Equal days</span> (temperature only, by High, Average
      or Low): about the same number of days in each range, so every color gets used
      about as much. Ranges are narrower where most of your days are.
    </li>
    <li>
      <span class="font-bold">Round numbers:</span> appears when an equal size has
      decimals, to use whole numbers instead.
    </li>
  </ul>
  <h3 class="text-lg font-bold">Manual steps</h3>
  <p>
    Choose <span class="font-bold">Manual steps…</span>, then fill in
    <span class="font-bold">Every</span> (the size of each range, like 5°) and
    <span class="font-bold">From</span> (where the first range starts). The
    colors update as you type; press <span class="font-bold">Save</span> to keep them.
  </p>
  <h3 id="gauge-direction" class="text-lg font-bold">Direction</h3>
  <ul class="ml-6 list-disc space-y-1">
    <li>
      <span class="font-bold">High to low:</span> the first color has the highest
      range: 30 → 20, 20 → 10…
    </li>
    <li>
      <span class="font-bold">Low to high:</span> the first color has the lowest range:
      10 → 20, 20 → 30…
    </li>
  </ul>
  <h3 class="text-lg font-bold">Linked ranges</h3>
  <p>
    On by default. Changing where one range ends also changes where the next one
    starts, so no days are left out. Turn it off to edit each range on its own.
  </p>
  <p>
    Rain and snow ranges never go below 0.
    <a href="/documentation/guides/choose-ranges" class="link"
      >Choosing ranges for your yarn</a
    >.
  </p>
  <DocsShot
    src="gauges-and-ranges/ranges-menu"
    alt="The Ranges menu: Auto ranges (now Equal days · High Temperature), Manual steps…, Direction with High to low checked and Low to high, Linked ranges turned on, and Each range includes (From, not To)."
    caption="The Ranges menu."
  />
</section>

<section class="flex flex-col gap-3">
  <h2 id="range-calculation-methods" class="text-2xl font-bold">
    Each Range Includes
  </h2>
  <p>
    Ranges share their ends: 30 → 20 is followed by 20 → 10. So when a day is
    exactly 20°, which range is it in? <span class="font-bold"
      >Each range includes</span
    >, in the Ranges menu, decides. A sentence above your ranges says which you
    chose.
  </p>
  <ul class="ml-6 list-disc space-y-1">
    <li>
      <span class="font-bold">From, not To</span> (the default): 30 → 20 holds 30°
      and everything down to 20°, but not 20° itself. A 20° day goes in 20 → 10.
    </li>
    <li>
      <span class="font-bold">To, not From:</span> 30 → 20 holds 20° and everything
      up to 30°, but not 30°. A 30° day goes in the range before.
    </li>
    <li>
      <span class="font-bold">Both From and To:</span> 30 → 20 holds both. To keep
      a day from fitting two ranges, they need a gap: 30 → 20.01, 20 → 10.01…
    </li>
    <li>
      <span class="font-bold">Neither:</span> only what's in between. To leave no
      day out, they need an overlap: 30.01 → 20, 20.01 → 10…
    </li>
  </ul>
  <div class="overflow-x-auto">
    <table class="table w-full text-left">
      <caption class="pb-2 text-left text-sm opacity-80"
        >Which days are in a range 13 → 12</caption
      >
      <thead>
        <tr>
          <th scope="col">Each range includes</th>
          <th scope="col">13°</th>
          <th scope="col">12.5°</th>
          <th scope="col">12°</th>
        </tr>
      </thead>
      <tbody>
        {#each includes as { label, values } (label)}
          <tr>
            <th scope="row" class="font-normal">{label}</th>
            {#each values as included, i (i)}
              <td class={included ? 'font-bold' : 'opacity-70'}
                >{included ? 'Yes' : 'No'}</td
              >
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <p>
    If a day fits two ranges, it takes the color of the first one (the higher
    one in the list), though it's counted in both. With Both or Neither, rounded
    or manual steps can leave such overlaps or gaps; the gauge warns you when
    they do.
  </p>
</section>

<RelatedGuides
  slugs={['choose-ranges', 'rain-snow-sunshine', 'match-your-yarn']}
/>
