// Copyright (c) 2024 - 2026, Thomas (https://github.com/jdvlpr)
//
// This file is part of Temperature-Blanket-Web-App.
//
// Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
// under the terms of the GNU General Public License as published by the Free Software Foundation,
// either version 3 of the License, or (at your option) any later version.
//
// Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
// without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
// See the GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App.
// If not, see <https://www.gnu.org/licenses/>.

// Short help a ? button shows in place (HelpIcon), with the same text on its
// Guides & Help page, where the section has the same id as `href`'s anchor.

import GroupingWeather from '#lib/components/docs/help/GroupingWeather.svelte';
import ImportFileRequirements from '#lib/components/docs/help/ImportFileRequirements.svelte';
import LinkUnavailable from '#lib/components/docs/help/LinkUnavailable.svelte';
import MixedSnow from '#lib/components/docs/help/MixedSnow.svelte';
import Seasons from '#lib/components/docs/help/Seasons.svelte';
import type { Component } from 'svelte';

export type HelpTopic = { title: string; href: string; content: Component };

export const HELP_TOPICS = {
  'link-unavailable': {
    title: 'Link Unavailable',
    href: '/documentation/colors-and-yarn#link-unavailable',
    content: LinkUnavailable,
  },
  'grouping-weather-data': {
    title: 'Daily or Weekly Weather',
    href: '/documentation/weather#grouping-weather-data',
    content: GroupingWeather,
  },
  'mixed-snow-parameters': {
    title: 'Mixed Snow Parameters',
    href: '/documentation/weather#mixed-snow-parameters',
    content: MixedSnow,
  },
  'import-weather-data-file-requirements': {
    title: 'CSV File Requirements',
    href: '/documentation/weather#import-weather-data-file-requirements',
    content: ImportFileRequirements,
  },
  'assigning-seasons': {
    title: 'Seasons',
    href: '/documentation/preview#assigning-seasons',
    content: Seasons,
  },
} satisfies Record<string, HelpTopic>;

export type HelpTopicId = keyof typeof HELP_TOPICS;
