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
  One choice from a few, as a menu styled like the View and Sort menus. The
  button names the setting and the current choice, e.g. "Units: °C / mm", and
  each option can have a few words under it.
-->
<script lang="ts" generics="T extends string">
  import {
    menuContentClass,
    menuItemClass,
    menuTriggerClass,
  } from '$lib/components/menu-styles';
  import { CheckIcon, ChevronDownIcon } from '@lucide/svelte';
  import { Menu, Portal } from '@skeletonlabs/skeleton-svelte';
  import type { Component } from 'svelte';

  interface Props {
    /** Each choice; `short` is what the button shows (the label by default) */
    options: readonly {
      value: T;
      label: string;
      short?: string;
      details?: string;
    }[];
    value: T | null | undefined;
    onchange: (value: T) => void;
    /** Names the setting on the button, e.g. "Units" */
    label: string;
    icon: Component<{ size?: number; 'aria-hidden'?: 'true' }>;
  }

  let { options, value, onchange, label, icon: Icon }: Props = $props();

  let current = $derived(options.find((option) => option.value === value));
</script>

<Menu positioning={{ placement: 'bottom-start' }}>
  <Menu.Trigger class={menuTriggerClass}>
    <Icon size={18} aria-hidden="true" />
    <span>{label}: {current?.short ?? current?.label ?? ''}</span>
    <ChevronDownIcon size={18} aria-hidden="true" />
  </Menu.Trigger>
  <Portal>
    <Menu.Positioner>
      <Menu.Content class={menuContentClass}>
        {#each options as option (option.value)}
          <Menu.OptionItem
            type="radio"
            value={option.value}
            checked={option.value === current?.value}
            onCheckedChange={() => onchange(option.value)}
            class={menuItemClass}
          >
            <span class="flex min-w-0 flex-1 flex-col">
              <span>{option.label}</span>
              {#if option.details}
                <span class="text-surface-700-300 text-xs"
                  >{option.details}</span
                >
              {/if}
            </span>
            <CheckIcon
              size={18}
              class="shrink-0 {option.value === current?.value
                ? ''
                : 'invisible'}"
              aria-hidden="true"
            />
          </Menu.OptionItem>
        {/each}
      </Menu.Content>
    </Menu.Positioner>
  </Portal>
</Menu>
