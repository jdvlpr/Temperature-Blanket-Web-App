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

<!-- A help topic in a dialog: its text, and a link to the rest on its Guides
& Help page (in a new tab, so nothing open here is left behind). -->

<script lang="ts">
  import { HELP_TOPICS, type HelpTopicId } from '#lib/docs/help-topics.js';
  import { ExternalLinkIcon } from '@lucide/svelte';

  let { topic }: { topic: HelpTopicId } = $props();

  const help = $derived(HELP_TOPICS[topic]);
</script>

<div class="flex flex-col gap-4 px-4 pb-6">
  <help.content />
  <a href={help.href} target="_blank" class="link w-fit"
    >More in Guides & Help <ExternalLinkIcon class="icon-sm inline" /><span
      class="sr-only">(opens in a new tab)</span
    ></a
  >
</div>
