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

<!-- Renaming a project (on My Projects, and in the Project menu): the whole
name shows as it's edited, wrapping onto more lines as needed, with Cancel and
Save below. It's still one line of text: Enter saves, and line breaks become
spaces. -->

<script lang="ts">
  import { MAX_SAVED_PROJECT_NAME_LENGTH } from '$lib/storage/projects.svelte';
  import { CheckIcon, XIcon } from '@lucide/svelte';
  import type { Attachment } from 'svelte/attachments';

  let {
    value = $bindable(''),
    placeholder = '',
    onsave,
    oncancel,
  }: {
    value?: string;
    placeholder?: string;
    onsave: () => void;
    oncancel: () => void;
  } = $props();

  // As tall as its text, wherever it wraps
  const fitHeight: Attachment<HTMLTextAreaElement> = (node) => {
    void value;
    node.style.height = 'auto';
    node.style.height = `${node.scrollHeight}px`;
  };
</script>

<div class="flex w-full flex-col gap-2">
  <!-- Rounded as the buttons are, but never so much (pill) that the corners
  cut into wrapped lines -->
  <!-- svelte-ignore a11y_autofocus -->
  <textarea
    class="textarea min-h-11 resize-none overflow-hidden rounded-[min(var(--radius-base),0.75rem)] text-lg leading-snug"
    rows="1"
    aria-label="Project name"
    autocomplete="off"
    autofocus
    enterkeyhint="done"
    maxlength={MAX_SAVED_PROJECT_NAME_LENGTH}
    {placeholder}
    bind:value
    oninput={() => (value = value.replace(/\s*[\r\n]+\s*/g, ' '))}
    onkeydown={(e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onsave();
      }
      if (e.key === 'Escape') {
        e.stopPropagation();
        oncancel();
      }
    }}
    {@attach fitHeight}></textarea>
  <div class="flex flex-wrap justify-end gap-2">
    <button
      type="button"
      class="btn hover:preset-tonal-surface"
      onclick={oncancel}
    >
      <XIcon />
      Cancel
    </button>
    <button
      type="button"
      class="btn preset-filled-primary-500"
      onclick={onsave}
    >
      <CheckIcon />
      Save
    </button>
  </div>
</div>
