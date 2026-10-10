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
  A plus in a dashed slot beside or above one solid color item, for adding a
  color before or after it. Grid view draws the item as a tall tile with the
  slot to its left or right; list view as a row with the slot above or below.
  Built on Lucide's Icon, so it takes the same props (size, class,
  aria-hidden) and looks like its icons. The slot is drawn the way Lucide's
  square-dashed is: solid corners with short dashes between.
-->
<script lang="ts">
  import { Icon } from '@lucide/svelte';
  import type { ComponentProps } from 'svelte';

  type IconNode = NonNullable<ComponentProps<typeof Icon>['iconNode']>;

  let {
    where,
    layout,
    ...props
  }: {
    where: 'before' | 'after';
    layout: 'grid' | 'list';
  } & Omit<ComponentProps<typeof Icon>, 'iconNode'> = $props();

  const round = (n: number) => +n.toFixed(2);

  /** A rounded rectangle (radius 2) of solid corners and 1-unit dashes */
  function dashedRect(x: number, y: number, w: number, h: number): IconNode {
    const paths = [
      `M${x} ${y + 2}a2 2 0 0 1 2-2`,
      `M${x + w - 2} ${y}a2 2 0 0 1 2 2`,
      `M${x + w} ${y + h - 2}a2 2 0 0 1-2 2`,
      `M${x + 2} ${y + h}a2 2 0 0 1-2-2`,
    ];
    // Dashes spread evenly along each side, between the corners
    const side = (length: number, dash: (offset: number) => string) => {
      const count = Math.max(0, Math.round((length - 4) / 5));
      const gap = (length - count) / (count + 1);
      for (let i = 0; i < count; i++) paths.push(dash(2 + gap * (i + 1) + i));
    };
    side(w - 4, (o) => `M${round(x + o)} ${y}h1`);
    side(w - 4, (o) => `M${round(x + o)} ${y + h}h1`);
    side(h - 4, (o) => `M${x} ${round(y + o)}v1`);
    side(h - 4, (o) => `M${x + w} ${round(y + o)}v1`);
    return paths.map((d) => ['path', { d }]);
  }

  const solid = (x: number, y: number, w: number, h: number): IconNode => [
    ['rect', { x, y, width: w, height: h, rx: 2 }],
  ];

  const plus = (x: number, y: number): IconNode => [
    ['path', { d: `M${x - 2} ${y}h4` }],
    ['path', { d: `M${x} ${y - 2}v4` }],
  ];

  // Drawn for "before"; "after" is the same mirrored across the icon
  const mirror = (start: number, size: number, after: boolean) =>
    after ? 24 - start - size : start;
  const mirrorPoint = (at: number, after: boolean) => (after ? 24 - at : at);

  let iconNode = $derived.by((): IconNode => {
    const after = where === 'after';
    if (layout === 'grid')
      return [
        ...dashedRect(mirror(1.5, 13, after), 5, 13, 14),
        ...plus(mirrorPoint(8, after), 12),
        ...solid(mirror(18.5, 4, after), 5, 4, 14),
      ];
    return [
      ...dashedRect(3, mirror(1.5, 13, after), 18, 13),
      ...plus(12, mirrorPoint(8, after)),
      ...solid(3, mirror(18.5, 4, after), 18, 4),
    ];
  });
</script>

<Icon {...props} {iconNode} />
