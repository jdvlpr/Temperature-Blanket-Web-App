<!-- Copyright (c) 2024 - 2026, Thomas (https://github.com/jdvlpr)

This file is part of Temperature-Blanket-Web-App.

Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free Software Foundation,
either version 3 of the License, or (at your option) any later version.

Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App.


<!-- @component
  Copy Link for a saved project's row in My Projects, as in the Project menu:
  its link with all its settings and its name, so whoever opens it gets their
  own copy.
-->
<script lang="ts">
  import CopyIcon from '#lib/components/CopyIcon.svelte';
  import { copyToClipboard } from '#lib/utils/clipboard-utils.js';
  import { Flash } from '#lib/utils/feedback.svelte.js';
  import { withProjectName } from '#lib/utils/project-name-link.js';
  import { LinkIcon } from '@lucide/svelte';

  let {
    href,
    name,
    title,
    label,
  }: {
    /** The saved project's link */
    href: string;
    /** Its name, if it has one */
    name?: string | null;
    /** Its location title, which the name isn't added for */
    title?: string;
    /** The project's name or title, for screen readers */
    label: string;
  } = $props();

  const copied = new Flash();

  async function copy() {
    const ok = await copyToClipboard(
      withProjectName(href, name, title),
      'Link copied',
      'Unable to copy to your clipboard',
    );
    if (ok) copied.trigger();
  }
</script>

<button
  type="button"
  class="btn btn-sm hover:preset-tonal-surface -ml-2"
  onclick={copy}
  aria-label="Copy Link: {label}"
  ><CopyIcon copied={copied.is()} icon={LinkIcon} />Copy Link</button
>
