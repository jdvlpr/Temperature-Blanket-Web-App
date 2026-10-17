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

<!-- A ? that shows a help topic right here: in a dialog of its own, or, when
it's in a dialog already, in that dialog's place with Back (which returns to
the dialog just as it was). The same text is on its Guides & Help page. -->

<script lang="ts">
  import { HELP_TOPICS, type HelpTopicId } from '#lib/docs/help-topics.js';
  import HelpView from '#lib/components/docs/HelpView.svelte';
  import { dialog } from '#lib/state/page-state.svelte.js';
  import { CircleQuestionMarkIcon } from '@lucide/svelte';
  import type { Snippet } from 'svelte';

  let {
    topic,
    title = `Help: ${HELP_TOPICS[topic].title}`,
    text,
  }: { topic: HelpTopicId; title?: string; text?: Snippet } = $props();

  function open(event: MouseEvent) {
    const opener = event.currentTarget as HTMLElement;
    if (
      dialog.opened &&
      dialog.type === 'component' &&
      opener.closest('[role="dialog"]')
    )
      dialog.showHelp(topic, opener);
    else
      dialog.trigger({
        type: 'component',
        component: { ref: HelpView, props: { topic } },
        options: { title: HELP_TOPICS[topic].title },
      });
  }
</script>

<button
  type="button"
  {title}
  aria-label={text ? undefined : title}
  class="relative inline-flex items-end justify-start gap-1 underline"
  class:top-[5px]={!text}
  aria-haspopup="dialog"
  onclick={open}
>
  <CircleQuestionMarkIcon class="relative bottom-[2px]" />
  {@render text?.()}
</button>
