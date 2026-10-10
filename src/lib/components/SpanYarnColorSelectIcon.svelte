<script>
  import { getTextColor } from '#lib/utils/color-utils.js';
  import { PaletteIcon } from '@lucide/svelte';

  let { color } = $props();
</script>

<span
  style="color:{getTextColor(color)};background:{color}"
  class="rounded-sm p-1 hover:color-[{getTextColor(color)}] hover:bg-[{color}]"
  ><PaletteIcon /></span
>
