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
  One copy button for a yarn colorway that opens a menu: copy its name or
  its hex code. Each choice shows what it will copy.
-->
<script lang="ts">
  import type { Color } from '$lib/types/yarn-types';
  import { CopyIcon } from '@lucide/svelte';
  import { Menu, Portal } from '@skeletonlabs/skeleton-svelte';
  import { copyColorwayText, iconColorOn } from './colorway-utils';

  interface Props {
    colorway: Color;
    /** `labeled` shows the word "Copy" on wider screens; `swatch` sits right
     * on the yarn swatch: just a black or white icon, tinted on hover */
    variant?: 'icon' | 'labeled' | 'swatch';
  }

  let { colorway, variant = 'icon' }: Props = $props();

  const triggerClasses = {
    icon: 'btn-icon hover:preset-tonal-surface size-8 shrink-0',
    labeled: 'btn hover:preset-tonal-surface shrink-0 px-2 sm:px-3',
    swatch:
      'btn-icon hover-on-color size-8 shrink-0 rounded-full focus-visible:outline-2 focus-visible:outline-current',
  };

  let choices = $derived(
    [
      { value: 'name', label: 'Name', text: colorway.name },
      { value: 'hex', label: 'Hex', text: colorway.hex },
    ].filter((choice): choice is typeof choice & { text: string } =>
      Boolean(choice.text),
    ),
  );

  const itemClass =
    'data-highlighted:bg-surface-200-800 flex items-center justify-between gap-4 text-left data-highlighted:text-inherit';
</script>

{#if choices.length}
  <Menu
    positioning={{
      placement: variant === 'swatch' ? 'bottom-end' : 'bottom-start',
    }}
    onSelect={(details) => {
      const choice = choices.find((c) => c.value === details.value);
      if (choice) copyColorwayText(choice.text);
    }}
  >
    <Menu.Trigger
      class={triggerClasses[variant]}
      style={variant === 'swatch'
        ? `color:${iconColorOn(colorway.hex)}`
        : undefined}
      aria-label="Copy {colorway.name ?? colorway.hex}: name or hex code"
      title="Copy"
    >
      <CopyIcon size={16} aria-hidden="true" />
      {#if variant === 'labeled'}<span class="hidden sm:inline">Copy</span>{/if}
    </Menu.Trigger>
    <Portal>
      <Menu.Positioner>
        <Menu.Content
          class="bg-surface-100-900 z-9999 max-w-[calc(100vw-2rem)]"
        >
          {#each choices as choice (choice.value)}
            <Menu.Item value={choice.value} class={itemClass}>
              <span>Copy {choice.label}</span>
              <span
                class="text-surface-700-300 truncate text-xs {choice.value ===
                'hex'
                  ? 'font-mono'
                  : ''}">{choice.text}</span
              >
            </Menu.Item>
          {/each}
        </Menu.Content>
      </Menu.Positioner>
    </Portal>
  </Menu>
{/if}
