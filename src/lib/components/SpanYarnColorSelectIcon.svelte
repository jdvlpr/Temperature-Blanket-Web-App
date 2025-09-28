<script>
  import { getTextColor } from '$lib/utils';
  import { PaletteIcon } from '@lucide/svelte';

  let { color, size = 20 } = $props();
</script>

<span
  style="color:{getTextColor(color)};background:{color}"
  class="rounded-sm p-1 hover:color-[{getTextColor(color)}] hover:bg-[{color}]"
  ><PaletteIcon {size} /></span
>
