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
  A range to read, not edit: "105°F → 92°F", From first. Whether its ends are
  included is said once for the gauge (see `rangeRuleSentence`).
-->
<script lang="ts">
  import RangeArrow from '$lib/components/RangeArrow.svelte';
  import RangeUnit from '$lib/components/RangeUnit.svelte';
  import { formatRangeNumber } from '$lib/utils/range-format';

  interface Props {
    from: number;
    to: number;
    unitLabel?: string;
    unitType?: string;
    filled?: boolean;
  }

  let { from, to, unitLabel = '', unitType, filled = false }: Props = $props();
</script>

<span
  class="flex flex-wrap items-center gap-x-1.5 font-semibold whitespace-nowrap tabular-nums"
>
  <span
    >{formatRangeNumber(from)}<RangeUnit
      label={unitLabel}
      type={unitType}
      {filled}
    /></span
  >
  <RangeArrow />
  <span
    >{formatRangeNumber(to)}<RangeUnit
      label={unitLabel}
      type={unitType}
      {filled}
    /></span
  >
</span>
