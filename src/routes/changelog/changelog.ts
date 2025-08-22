// Copyright (c) 2024, Thomas (https://github.com/jdvlpr)
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

import { PUBLIC_GITHUB_LINK } from '$env/static/public';
import { ICONS } from '$lib/constants';
import type { ChangelogItem } from '$lib/types';
import { CloudCogIcon, MoonStarIcon, RocketIcon } from '@lucide/svelte';

export const entries: ChangelogItem[] = [
  {
    date: 'August, 2025',
    notes: [
      {
        icon: ICONS.checkCircle,
        text: `22 colorways`,
        title: 'Added New Yarn: Kelbourne Woolens - Skipper',
      },
    ],
    version: '5.15.0',
  },
  {
    notes: [
      {
        icon: ICONS.checkCircle,
        text: `63 colorways`,
        title: 'Added New Yarn: DROPS - Kid Silk',
      },
      {
        icon: ICONS.checkCircle,
        text: `34 colorways`,
        title: 'Added New Yarn: Hobbii - Baby Cotton Organic',
      },
      {
        icon: ICONS.checkCircle,
        text: `21 colorways`,
        title: 'Added New Yarn: Knitting for Olive - Compatible Cashmere',
      },
    ],
    version: '5.14.0',
  },
  {
    notes: [
      {
        icon: ICONS.checkCircle,
        text: `38 colorways`,
        title: 'Added New Yarn: Blue Sky Fibers - Organic Cotton Worsted',
      },
      {
        icon: ICONS.checkCircle,
        text: `30 colorways`,
        title: 'Added New Yarn: Blue Sky Fibers - Sweater',
      },
      {
        icon: ICONS.checkCircle,
        text: `27 colorways`,
        title: 'Added New Yarn: Blue Sky Fibers - Woolstok Light',
      },
      {
        icon: ICONS.checkCircle,
        text: `48 colorways`,
        title: 'Added New Yarn: Sirdar - Stories',
      },
    ],
    version: '5.13.0',
  },
  {
    date: 'July, 2025',
    notes: [
      {
        icon: ICONS.checkCircle,
        text: `52 colorways`,
        title: 'Added New Yarn: King Cole - Cottonsoft DK',
      },
      {
        icon: ICONS.checkCircle,
        text: `27 colorways`,
        title: 'Added New Yarn: Sandnes - Duo',
      },
      {
        icon: ICONS.checkCircle,
        text: `26 colorways`,
        title: 'Added New Yarn: The Fibre Co. - Cirro',
      },
    ],
    version: '5.12.0',
  },
  {
    notes: [
      {
        icon: ICONS.checkCircle,
        text: `62 colorways`,
        title: 'Added New Yarn: Círculo - Amigurumi Soft',
      },
      {
        icon: ICONS.checkCircle,
        text: `37 colorways`,
        title: 'Added New Yarn: Knitting for Olive - Pure Silk',
      },
      {
        icon: ICONS.checkCircle,
        text: `93 colorways`,
        title: 'Added New Yarn: Silk City Fibers - Bambu 7',
      },
      {
        icon: ICONS.checkCircle,
        text: `12 colorways`,
        title: 'Added New Yarn: Yarnalia - Marvel',
      },
    ],
    version: '5.11.0',
  },
  {
    date: 'June, 2025',
    notes: [
      {
        icon: ICONS.checkCircle,
        text: `108 colorways`,
        title: 'Added New Yarn: LindeHobby - Cotton 8/8',
      },
    ],
    version: '5.10.0',
  },
  {
    notes: [
      {
        icon: ICONS.checkCircle,
        text: `85 colorways`,
        title: 'Added New Yarn: Knitting for Olive - Merino',
      },
      {
        icon: ICONS.checkCircle,
        text: `120 colorways`,
        title: 'Added New Yarn: Yarnsmiths - Cotton DK',
      },
    ],
    version: '5.9.0',
  },
  {
    date: 'May, 2025',
    notes: [
      {
        icon: ICONS.checkCircle,
        text: `100 colorways`,
        title: 'Added New Yarn: Hobbii - Embroidery Yarn',
      },
      {
        icon: ICONS.checkCircle,
        text: `62 colorways`,
        title: 'Added New Yarn: Hobbii - Rainbow Deluxe',
      },
    ],
    version: '5.8.0',
  },
  {
    date: 'April, 2025',
    notes: [
      {
        icon: ICONS.checkCircle,
        text: `62 colorways`,
        title: 'Added New Yarn: Premier - Parfait Chunky',
      },
    ],
    version: '5.7.0',
  },
  {
    notes: [
      {
        IconComponent: CloudCogIcon,
        instructions: `To see the new settings, press the Weather Source button in the Project Planner. If you notice any issues or have feedback about the new model settings, please <a href="/contact" target="_blank" class="link">contact me</a>.`,
        text: 'Choose a more consistent weather data model when using Open-Meteo as a weather data source. See more details in the <a href="/documentation#weather-sources" class="link" target="_blank">documentation</a>. This is a beta feature—it should prevent historical data from being altered, but it has not been thoroughly tested. An option has also been added to not fill missing data when using Meteostat as a weather source.',
        title:
          'New Weather Source Settings <span class="badge bg-tertiary-50-950 ml-2">Beta</span>',
      },
    ],
    version: '5.6.0',
  },
  {
    notes: [
      {
        icon: ICONS.design,
        instructions: 'Try it out in the Preview tab of the Project Planner',
        text: `Each round in a square represents one day`,
        title: 'Added New Preview Type: Square Rounds',
      },
    ],
    version: '5.5.0',
  },
  {
    notes: [
      {
        icon: ICONS.checkCircle,
        text: `30 colorways`,
        title: 'Added New Yarn: DROPS - Sky',
      },
      {
        icon: ICONS.checkCircle,
        text: `23 colorways`,
        title: 'Added New Yarn: 4 Seasons - Flinders Cotton 8 Ply',
      },
      {
        icon: ICONS.checkCircle,
        text: `37 colorways`,
        title: 'Added New Yarn: Purl Soho - Good Wool',
      },
    ],
    version: '5.4.0',
  },
  {
    notes: [
      {
        IconComponent: MoonStarIcon,
        text: 'Add colors for phases of the moon into your preview designs.',
        title: 'Added Feature: Moon Phase Gauge',
      },
    ],
    version: '5.3.0',
  },
  {
    notes: [
      {
        icon: ICONS.wrench,
        text: `The fix introduced in v5.2.33 didn't completely solve the issue of dates shifting; some locations were still experiencing the issue. This update addresses the issue by using Universal Time Coordinated (UTC) throughout the application when converting dates, with added fixes to keep the v5.2.33 functionality in the cases where that update solved the problem.`,
        instructions: `If you notice any issues regarding weather data, please <a href="/contact/forms/2025-03-weather-data" target="_blank" class="link">let me know</a>.`,
        title: 'Fixed Weather Data Dates Issue #2',
      },
    ],
    version: '5.2.35',
  },
  {
    notes: [
      {
        icon: ICONS.wrench,
        text: `An issue for some locations (I believe it was introduced in v5.2.2) caused weather data dates to be off by one in the weather table and/or the preview image. I believe the issue was caused by how dates were converted throughout the application between ISO 8601 strings ('YYYY-MM-DD') and Date objects in Universal Time Coordinated (UTC). This update addresses the issue by converting ISO 8601 dates to Date objects using the local timezone instead of UTC.`,
        instructions: `If you notice any issues regarding weather data, please <a href="/contact/forms/2025-03-weather-data" target="_blank" class="link">let me know</a>.`,
        title: 'Fixed Weather Data Dates Issue',
      },
    ],
    version: '5.2.33',
  },
  {
    date: 'March, 2025',
    notes: [
      {
        icon: ICONS.wrench,
        text: `An issue was introduced in v5.0.0 where weather data from Meteostat was slightly different than previous versions. This happened because the location's elevation was not being included in the weather data request. This update fixes the issue by including the location's elevation in the weather request, so weather data from Meteostat should be the same as before the v5.0.0 update.`,
        title: 'Fixed Meteostat Weather Data Issue',
      },
    ],
    version: '5.2.2',
  },
  {
    notes: [
      {
        icon: ICONS.design,
        text: 'Option to add borders around each square for the Squares and Calendar preview type',
        title: 'Added Feature: Border Around Squares',
      },
    ],
    version: '5.2.0',
  },
  {
    notes: [
      {
        icon: ICONS.checkCircle,
        text: `Added 70 colorways`,
        title: 'Added Yarn: Purl Soho - Linen Quill',
      },
      {
        icon: ICONS.checkCircle,
        text: `Added 53 colorways`,
        title: 'Added Yarn: Tufting Europe - New Zealand Wool',
      },
    ],
    version: '5.1.0',
  },
  {
    notes: [
      {
        IconComponent: RocketIcon,
        instructions:
          "<a href='/blog/2025-03-20-version-5' class='link'>Learn more and read the update announcement.</a>",
        text: `Updated design, new features, and rewritten with Svelte 5 and Skeleton 3`,
        title: 'Version 5 Release',
      },
    ],
    version: '5.0.0',
  },
  {
    notes: [
      {
        icon: ICONS.checkCircle,
        text: `Added 27 colorways`,
        title: 'Added Yarn: Knit Picks - Heatherly Sport',
      },
    ],
    version: '4.23.0',
  },
  {
    notes: [
      {
        icon: ICONS.checkCircle,
        text: `Added 84 colorways`,
        title: 'Added Yarn: Ice Yarns - Classic DK',
      },
    ],
    version: '4.22.0',
  },
  {
    date: 'February, 2025',
    notes: [
      {
        icon: ICONS.checkCircle,
        text: `Added 46 colorways`,
        title: 'Added Yarn: DROPS - Safran',
      },
      {
        icon: ICONS.checkCircle,
        text: `Added 12 colorways`,
        title: 'Updated Yarn: Cascade - 220 Superwash',
      },
    ],
    version: '4.21.0',
  },
  {
    notes: [
      {
        icon: ICONS.checkCircle,
        text: `60 colorways`,
        title: 'Added Yarn: Bendigo Woolen Mills - Classic 8 Ply',
      },
    ],
    version: '4.20.0',
  },
  {
    notes: [
      {
        icon: ICONS.wrench,
        text: `The Daytime Rows preview image was inaccurately representing the number of daytime and night stitches in each row. This update uses the actual daytime and night stitches values to generate the preview image, ensuring that it accurately reflects the values in the stitches table. Consequently, the apparent line between the daytime and night sections in the preview image may appear more jagged (less of a smooth curve). However, it provides a more precise representation of the final project's appearance. Only the Daytime Rows preview image in the Project Planner is affected by this update; preview images on Project Gallery pages created before this update remain unchanged.`,
        title: 'Fixed Daytime Rows Preview Image',
      },
    ],
    version: '4.19.1',
  },
  {
    notes: [
      {
        icon: ICONS.checkCircle,
        text: `35 colorways`,
        title: 'Added Yarn: Sandnes - Line',
      },
    ],
    version: '4.19.0',
  },
  {
    notes: [
      {
        icon: ICONS.checkCircle,
        text: `21 colorways`,
        title: 'Added Yarn: Knit Picks - Woolen Cotton',
      },
    ],
    version: '4.18.0',
  },
  {
    date: 'January, 2025',
    notes: [
      {
        icon: ICONS.checkCircle,
        text: `43 colorways`,
        title: 'Added Yarn: Tessiland - Chuck',
      },
    ],
    version: '4.17.0',
  },
  {
    notes: [
      {
        icon: ICONS.checkCircle,
        text: `36 colorways`,
        title: 'Added Yarn: DROPS - Lima',
      },
      {
        icon: ICONS.checkCircle,
        text: `33 colorways`,
        title: 'Added Yarn: Hobbii - Daily Stitch Acrylic XL',
      },
    ],
    version: '4.16.0',
  },
  {
    notes: [
      {
        icon: ICONS.checkCircle,
        text: `65 colorways`,
        title: 'Added Yarn: Alize - Cotton Gold',
      },
      {
        icon: ICONS.checkCircle,
        text: `58 colorways`,
        title: 'Added Yarn: Bellissimo - Bellissimo 8',
      },
      {
        icon: ICONS.checkCircle,
        text: `47 colorways`,
        title: 'Added Yarn: Fiddlesticks - Superb 10',
      },
      {
        icon: ICONS.checkCircle,
        text: `21 colorways`,
        title: 'Added Yarn: Filatura Di Crosa - Zara 8',
      },
      {
        icon: ICONS.checkCircle,
        text: `57 colorways`,
        title: 'Added Yarn: Hobbii - Amigo Chunky',
      },
      {
        icon: ICONS.checkCircle,
        text: `61 colorways`,
        title: 'Added Yarn: Hobbii - Amigo XL',
      },
      {
        icon: ICONS.checkCircle,
        text: `18 colorways`,
        title: 'Added Yarn: Lion Brand - Re-Spun',
      },
    ],
    version: '4.15.0',
  },
  {
    notes: [
      {
        icon: ICONS.checkCircle,
        text: `25 colorways`,
        title: 'Added Yarn: Gründl - Funny uni',
      },
      {
        icon: ICONS.checkCircle,
        text: `49 colorways`,
        title: 'Added Yarn: Himalaya - Velvet',
      },
      {
        icon: ICONS.checkCircle,
        text: `41 colorways`,
        title: 'Added Yarn: LindeHobby - Velvet Lux',
      },
      {
        icon: ICONS.checkCircle,
        text: `7 colorways`,
        title: 'Added Yarn: Loops & Threads - Color Craft',
      },
    ],
    version: '4.14.0',
  },
  {
    notes: [
      {
        icon: ICONS.checkCircle,
        text: `85 colorways`,
        title: 'Added Yarn: Fiddlesticks - Superb 8',
      },
      {
        icon: ICONS.checkCircle,
        text: `18 colorways`,
        title: 'Added Yarn: Hobbii - Acacia',
      },
      {
        icon: ICONS.checkCircle,
        text: `12 colorways`,
        title: 'Added Yarn: Source of Fibre - Clear As Cotton',
      },
      {
        icon: ICONS.checkCircle,
        text: `21 colorways`,
        title: "Added Yarn: The Women's Institute - Premium Acrylic",
      },
    ],
    version: '4.13.0',
  },
  {
    notes: [
      {
        icon: ICONS.checkCircle,
        text: `57 colorways`,
        title: 'Added Yarn: 4 Seasons - Marvel 8 Ply',
      },
      {
        icon: ICONS.checkCircle,
        text: `110 colorways`,
        title: 'Added Yarn: Cascade - 220 Superwash Merino',
      },
      {
        icon: ICONS.checkCircle,
        text: `506 colorways`,
        title: 'Added Yarn: DMC - Six-Strand Embroidery Floss',
      },
      {
        icon: ICONS.checkCircle,
        text: `68 colorways`,
        title: 'Added Yarn: Katia - Promo Fin',
      },
    ],
    version: '4.12.0',
  },
  {
    notes: [
      {
        icon: ICONS.checkCircle,
        text: `57 colorways`,
        title: 'Added Yarn: DROPS - Paris',
      },
      {
        icon: ICONS.checkCircle,
        text: `86 colorways`,
        title: 'Added Yarn: Miss Babs - Sojourn',
      },
      {
        icon: ICONS.checkCircle,
        text: `31 colorways`,
        title: 'Added Yarn: Pingouin - Pingo First',
      },
    ],
    version: '4.11.0',
  },
  {
    date: 'December, 2024',
    notes: [
      {
        icon: ICONS.checkCircle,
        text: `35 colorways`,
        title: 'Added Yarn: Coop Knits - Socks Yeah!',
      },
      {
        icon: ICONS.checkCircle,
        text: `18 colorways`,
        title: 'Added Yarn: Lion Brand - Wool-Ease DK',
      },
      {
        icon: ICONS.checkCircle,
        text: `Added 20 new colorways`,
        title: 'Updated Yarn: Stylecraft - Special DK',
      },
    ],
    version: '4.10.0',
  },
  {
    notes: [
      {
        icon: ICONS.checkCircle,
        text: `57 colorways`,
        title: 'Added Yarn: Sandnes - Peer Gynt',
      },
      {
        icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
</svg>
`,
        text: `Merry Christmas & Happy New Year! Enjoy the new <a href="/" class="link">wintry background image</a> on the Project Planner home page`,
        title: 'New Seasonal Background Image',
      },
    ],
    version: '4.9.0',
  },
  {
    notes: [
      {
        icon: ICONS.checkCircle,
        text: `75 colorways`,
        title: 'Added Yarn: Hobbii - Friends Cotton 8/8',
      },
      {
        icon: ICONS.checkCircle,
        text: `22 colorways`,
        title: 'Added Yarn: Source of Fibre - Dirty DK',
      },
      {
        icon: ICONS.checkCircle,
        text: `Added 34 new colorways`,
        title: 'Updated Yarn: Knit Picks - Swish Worsted',
      },
    ],
    version: '4.8.0',
  },
  {
    date: 'November, 2024',
    notes: [
      {
        icon: ICONS.checkCircle,
        text: `14 colorways`,
        title: 'Added Yarn: Hobbii - Udon',
      },
      {
        icon: ICONS.checkCircle,
        text: `25 colorways`,
        title: 'Added Yarn: West Yorkshire Spinners - The Croft DK',
      },
    ],
    version: '4.7.0',
  },
  {
    notes: [
      {
        icon: ICONS.checkCircle,
        text: `45 colorways`,
        title: 'Added Yarn: Ice Yarns - Lorena Worsted',
      },
      {
        icon: ICONS.checkCircle,
        text: `29 colorways`,
        title: 'Added Yarn: Knitting for Olive - Cotton Merino',
      },
    ],
    version: '4.6.0',
  },
  {
    notes: [
      {
        icon: ICONS.checkCircle,
        text: `13 new colorways`,
        title: 'Added New Yarn Colorways: Caron - One Pound',
      },
      {
        icon: ICONS.checkCircle,
        text: `50 colorways`,
        title: 'Added Yarn: Hobbii - Friends Wheel',
      },
      {
        icon: ICONS.checkCircle,
        text: `50 colorways`,
        title: 'Added Yarn: Hobbii - Twister Solid',
      },
      {
        icon: ICONS.checkCircle,
        text: `39 colorways`,
        title: 'Added Yarn: Hobbii - Winter Glow Solid',
      },
    ],
    version: '4.5.0',
  },
  {
    date: 'September, 2024',
    notes: [
      {
        icon: `<svg
      xmlns="http://www.w3.org/2000/svg"
      class="size-6"
      viewBox="0 0 20 20"
      ><path
        fill="currentColor"
        d="M2.75 4a.75.75 0 0 0 0 1.5h14.5a.75.75 0 0 0 0-1.5zM2 9.25C2 8.56 2.56 8 3.25 8h13.5a1.25 1.25 0 1 1 0 2.5H3.25C2.56 10.5 2 9.94 2 9.25m0 5.5c0-.966.784-1.75 1.75-1.75h12.5a1.75 1.75 0 1 1 0 3.5H3.75A1.75 1.75 0 0 1 2 14.75"
      /></svg
    >`,
        instructions:
          "<a href='/blog/yarn-weights' class='link'>See the Yarn Weights chart</a>",
        text: `Yarns include weight information. When selecting or searching for a yarn colorway, you can filter results by yarn weight.`,
        title: 'Added Yarn Weights',
      },
    ],
    version: '4.2.0',
  },

  {
    notes: [
      {
        icon: ICONS.wrench,
        text: `Project locations can now include future dates even when the weather source is Open-Meteo. Previously this was possible only when the weather source was Meteostat.`,
        title: 'Allow Future Dates in Open-Meteo Weather Data',
      },
    ],
    version: '4.0.5',
  },
  {
    notes: [
      {
        icon: `<svg xmlns="http://www.w3.org/2000/svg" class="size-6" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33s1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2"/></svg>`,
        instructions:
          "<a href='/blog/2024-09-03-now-open-source' class='link'>Read the blog post</a>",
        text: `Collaborate and contribute to this web app in the <a href=${PUBLIC_GITHUB_LINK} class="link" target="_blank">GitHub repository</a>`,
        title: 'Open Source!',
      },
    ],
    version: '4.0.0',
  },
  {
    date: 'August, 2024',
    notes: [
      {
        icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="m20.893 13.393-1.135-1.135a2.252 2.252 0 0 1-.421-.585l-1.08-2.16a.414.414 0 0 0-.663-.107.827.827 0 0 1-.812.21l-1.273-.363a.89.89 0 0 0-.738 1.595l.587.39c.59.395.674 1.23.172 1.732l-.2.2c-.212.212-.33.498-.33.796v.41c0 .409-.11.809-.32 1.158l-1.315 2.191a2.11 2.11 0 0 1-1.81 1.025 1.055 1.055 0 0 1-1.055-1.055v-1.172c0-.92-.56-1.747-1.414-2.089l-.655-.261a2.25 2.25 0 0 1-1.383-2.46l.007-.042a2.25 2.25 0 0 1 .29-.787l.09-.15a2.25 2.25 0 0 1 2.37-1.048l1.178.236a1.125 1.125 0 0 0 1.302-.795l.208-.73a1.125 1.125 0 0 0-.578-1.315l-.665-.332-.091.091a2.25 2.25 0 0 1-1.591.659h-.18c-.249 0-.487.1-.662.274a.931.931 0 0 1-1.458-1.137l1.411-2.353a2.25 2.25 0 0 0 .286-.76m11.928 9.869A9 9 0 0 0 8.965 3.525m11.928 9.868A9 9 0 1 1 8.965 3.525" />
</svg>`,
        text: `Use more than 100 locations per project (increased from 50).`,
        title: 'More Locations Per Project',
      },
      {
        icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
</svg>
`,
        text: `Get just one day of weather data per location (changed from a minimum of two days per location). This opens up new project options, for example using a location's weather data if you traveled there only one day.`,
        title: 'One-day Locations',
      },
    ],
    version: '3.35.0',
  },
  {
    date: 'July, 2024',
    notes: [
      {
        icon: ICONS.design,
        text: "Rearranged items the navigation sidebar, simplified the page footer, added analytics cookie confirmation, added Getting Started guide, and added <a href='/privacy' class='link'>Privacy</a> and <a href='/contact' class='link'>Contact</a> pages.",
        title: 'Modified Design',
      },
    ],
    version: '3.28.3',
  },
  {
    date: 'February, 2024',
    notes: [
      {
        icon: ICONS.wrench,
        text: 'When getting weather data from Meteostat, some requests would include an invalid elevation parameter. The issue has been fixed by removing the invalid elevation parameter from the request.',
        title: 'Repaired Weather Data Request',
      },
    ],
    version: '3.24.0',
  },
  {
    notes: [
      {
        icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
</svg>`,
        instructions:
          "For projects with missing or recent weather data, see the Weather section for more information. You can also read the explanation in the <a href='/faq' class='link'>FAQs</a>.",
        text: 'New alert visuals and revised text clarify that recent weather data can change as weather sources get the latest information.',
        title: 'Added Note for Recent Weather Data',
      },
    ],
    version: '3.23.1',
  },
  {
    notes: [
      {
        icon: ICONS.design,
        instructions:
          'In the palette creator, in the Random colorways tool, tap or hover over a colorway to view the lock button.',
        text: 'When generating random colorways, lock the ones you like and generate new ones for the rest.',
        title: 'Added Feature: Lock Colorways',
      },
    ],
    version: '3.21.0',
  },
  {
    date: '',
    notes: [
      {
        icon: ICONS.wrench,
        instructions:
          'You can change this by customizing ranges in the Colors section and by changing layout options in the Preview sections.',
        text: 'New projects now use the daily high instead of the daily average temperature by default.',
        title: 'Default High Temperatures',
      },
    ],
    version: '3.18.2',
  },
  {
    notes: [
      {
        icon: `<svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-6 h-6"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="m6.75 7.5 3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z"
                />
            </svg>`,
        instructions:
          "<a href='/api/yarn-colorways' class='link'>Yarn Colorways API</a>",
        text: 'Developers can use the API to find yarn by color in their apps.',
        title: 'New - Yarn Colorways API',
      },
    ],
    version: '3.18.0',
  },
  {
    notes: [
      {
        icon: ICONS.design,
        instructions:
          'Tap or hover over a color palette to see or edit details.',
        text: 'View or edit colors directly from the palette preview.',
        title: 'Interactive Color Palettes',
      },
      {
        icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24"
                ><g fill="none" stroke="currentColor" stroke-width="1.5"
                    ><path
                        d="M7 12H6c-1.886 0-2.828 0-3.414.586C2 13.172 2 14.114 2 16v2c0 1.886 0 2.828.586 3.414C3.172 22 4.114 22 6 22h2c1.886 0 2.828 0 3.414-.586C12 20.828 12 19.886 12 18v-1"
                    /><path
                        d="M12 7h-1c-1.886 0-2.828 0-3.414.586C7 8.172 7 9.114 7 11v2c0 1.886 0 2.828.586 3.414C8.172 17 9.114 17 11 17h2c1.886 0 2.828 0 3.414-.586C17 15.828 17 14.886 17 13v-1"
                    /><path
                        d="M12 6c0-1.886 0-2.828.586-3.414C13.172 2 14.114 2 16 2h2c1.886 0 2.828 0 3.414.586C22 3.172 22 4.114 22 6v2c0 1.886 0 2.828-.586 3.414C20.828 12 19.886 12 18 12h-2c-1.886 0-2.828 0-3.414-.586C12 10.828 12 9.886 12 8z"
                    /></g
                ></svg
            >`,
        instructions:
          "<a href='/yarn-palette-gallery' class='link'>View the Yarn Palette Gallery</a>.",
        text: 'Browse user-created yarn colorway combinations.',
        title: 'Yarn Palette Gallery',
      },
    ],
    version: '3.10.0',
  },
  {
    notes: [
      {
        icon: ICONS.wrench,
        text: '',
        title: 'Fixed Issue with Daytime Data not Displaying',
      },
    ],
    version: '3.0.1',
  },
  {
    notes: [
      {
        icon: ICONS.design,
        instructions:
          "<a href='/blog/2023-12-19-version-3-unified-site-design' class='link'>Read the blog post about Version 3</a>",
        text: 'New sidebar navigation, unified design across all pages, and improved performance.',
        title: 'Updated Site Design',
      },
    ],
    version: '3.0.0',
  },
  {
    date: 'October, 2023',
    notes: [
      {
        icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 256 256"><path fill="currentColor" d="M144 204a16 16 0 1 1-16-16a16 16 0 0 1 16 16Zm73-124l15.52-15.51a12 12 0 0 0-17-17L200 63l-15.51-15.49a12 12 0 0 0-17 17L183 80l-15.49 15.51a12 12 0 0 0 17 17L200 97l15.51 15.52a12 12 0 0 0 17-17Zm-41.9 75.3a80 80 0 0 0-94.13 0a12 12 0 1 0 14.13 19.4a56 56 0 0 1 65.87 0a12 12 0 0 0 14.13-19.4ZM131.71 68h.3a12 12 0 0 0 .28-24H128A176.27 176.27 0 0 0 16.39 83.91a12 12 0 1 0 15.23 18.55A152.24 152.24 0 0 1 128 68h3.71Zm-.12 48a12 12 0 0 0 .82-24H128a126.66 126.66 0 0 0-79.45 27.64a12 12 0 0 0 14.9 18.81A102.89 102.89 0 0 1 128 116c1.2 0 2.41 0 3.59.06Z"/></svg>`,
        instructions:
          "Install or add the page to your homescreen as a <a class='link' href='https://support.google.com/chrome/answer/9658361?hl=en&co=GENIE.Platform%3DDesktop#:~:text=On%20your%20computer%2C%20open%20Chrome,instructions%20to%20install%20the%20PWA' target='_blank' rel='noopener noreferrer'>Progressive Web App</a>.",
        text: 'Use the Yarn Palette Creator and Yarn Colorway Finder even without internet connection.',
        title: 'Added Offline Features',
      },
    ],
    version: '2.6.8',
  },
  {
    notes: [
      {
        icon: ICONS.wrench,
        instructions:
          'Go to the Colors tab and press the Configure Ranges button, or select the range from the color list.',
        text: 'One place for setting up and editing all color ranges. Instantly see how changing one range affects the others near it, without having to open a new modal for each color.',
        title: 'Range Configuration',
      },
      {
        icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 shrink-0" viewBox="0 0 256 256"
                            ><g fill="currentColor"
                                ><path d="M176 128a48 48 0 1 1-48-48a48 48 0 0 1 48 48Z" opacity=".2" /><path
                                    d="M221.87 83.16A104.1 104.1 0 1 1 195.67 49l22.67-22.68a8 8 0 0 1 11.32 11.32l-96 96a8 8 0 0 1-11.32-11.32l27.72-27.72a40 40 0 1 0 17.87 31.09a8 8 0 1 1 16-.9a56 56 0 1 1-22.38-41.65l22.75-22.75a87.88 87.88 0 1 0 23.13 29.67a8 8 0 0 1 14.44-6.9Z"
                                /></g
                            ></svg
                        >`,
        instructions:
          'Adjust the settings in the Colors tab by pressing the Configure Ranges button, under Generate Ranges select Automatic, then select from the Balance Focus modes.',
        text: 'Automatically generate ranges containing similar number of days. On by default for new projects. Only applies to Temperature Gauges.',
        title: 'New Smart Ranges',
      },
    ],
    version: '2.4.5',
  },
  {
    date: 'September, 2023',
    notes: [
      {
        icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24"><path fill="currentColor" d="M11 13.5v8H3v-8h8M12 2l5.5 9h-11L12 2m5.5 11c2.5 0 4.5 2 4.5 4.5S20 22 17.5 22S13 20 13 17.5s2-4.5 4.5-4.5Z"/></svg>`,
        instructions:
          'Use the Theme Switcher at the top of the page or in the menu to change the look and feel of the page.',
        text: '',
        title: 'New Themes!',
      },
      {
        icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
</svg>`,
        instructions:
          '<a href="/yarn-colorway-finder" class="link">Open the Yarn Colorway Finder</a>',
        text: 'Search for yarn colorways by HTML color name or hex code.',
        title: 'Yarn Colorway Finder',
      },
      {
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0"/><path d="m10 16.5l2-3l2 3m-2-3v-2l3-1m-6 0l3 1"/><circle cx="12" cy="7.5" r=".5" fill="currentColor"/></g></svg>`,
        text: '',
        title: 'Improved Website Accessibility',
      },
    ],
    version: '2.4.0',
  },
  {
    date: 'August, 2023',
    notes: [
      {
        icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
</svg>`,
        instructions:
          '<a href="/weather" class="link">See the Weather Forecast page</a>',
        text: 'Hourly and daily temperature and precipitation data from <a href="https://open-meteo.com" class="link">Open-Meteo</a>.',
        title: 'New Weather Forecast Page',
      },
    ],
    version: '2.3.1',
  },
  {
    date: 'July, 2023',
    notes: [
      {
        icon: ICONS.wrench,
        text: 'Fixed issue with the Weather Source setting unexpectedly changing when using Undo or Redo.',
        title: 'Error Correction',
      },
    ],
    version: '2.0.1',
  },
  {
    notes: [
      {
        icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5" />
</svg>
`,
        text: "Previous version numbers didn't always follow the SemVer format, causing problems with some features.",
        title: 'Updated Versioning System',
      },
    ],
    version: '2.0.0',
  },
  {
    notes: [
      {
        icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
</svg>`,
        text: 'Changed the default weather source from <a href="https://meteostat.net" class="link">Meteostat</a> to <a href="https://open-meteo.com" class="link">Open-Meteo</a>.',
        title: 'Weather Sources',
      },
    ],
    version: '1.905',
  },
  {
    date: 'April, 2023',
    notes: [
      {
        icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
</svg>`,
        instructions:
          'In the Colors tab or on the Yarn Palette Creator page, press the Image Palette button to get colors from an image.',
        text: 'Get yarn colors from an image.',
        title: 'Image Palette',
      },
    ],
    version: '1.871',
  },
  {
    date: 'March, 2023',
    notes: [
      {
        icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
</svg>
`,
        instructions:
          'When you save a project, it will automatically be saved to your browser so you can find it later.',
        text: '',
        title: 'Save Projects to Your Browser',
      },
      {
        icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
</svg>`,
        instructions: 'Select a value from the weather data table to edit it.',
        text: '',
        title: 'Edit Weather Data',
      },
      {
        icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
</svg>`,
        instructions:
          'In the Weather tab, press the Import Weather Data button to upload a CSV file.',
        text: '',
        title: 'Import Weather Data',
      },
    ],
    version: '1.858',
  },
  {
    date: 'January, 2023',
    notes: [
      {
        icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
</svg>`,
        instructions: 'In the Weather tab, select Weekly.',
        text: 'Grouping weather by weeks makes for a shorter project.',
        title: 'Weekly Weather Data',
      },
    ],
    version: '1.818',
  },
  {
    notes: [
      {
        icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V13.5zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V18zm2.498-6.75h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V13.5zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V18zm2.504-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V18zm2.498-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zM8.25 6h7.5v2.25h-7.5V6zM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0012 2.25z" />
</svg>`,
        instructions:
          'In the Colors tab, press the Configure Ranges button, then press Advanced Controls.',
        text: 'Change how gauge ranges are calculated',
        title: 'Range Calculation Methods',
      },
    ],
    version: '1.808',
  },
  {
    date: 'August, 2022',
    notes: [
      {
        icon: ICONS.wrench,
        text: 'Switched to using <a href="https://svelte.dev" class="link">Svelte</a> instead of vanilla Javascript.',
        title: 'Improved Website Performance',
      },
    ],
    version: '1.808',
  },
  {
    date: 'June, 2022',
    notes: [
      {
        icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M12.75 3.03v.568c0 .334.148.65.405.864l1.068.89c.442.369.535 1.01.216 1.49l-.51.766a2.25 2.25 0 01-1.161.886l-.143.048a1.107 1.107 0 00-.57 1.664c.369.555.169 1.307-.427 1.605L9 13.125l.423 1.059a.956.956 0 01-1.652.928l-.679-.906a1.125 1.125 0 00-1.906.172L4.5 15.75l-.612.153M12.75 3.031a9 9 0 00-8.862 12.872M12.75 3.031a9 9 0 016.69 14.036m0 0l-.177-.529A2.25 2.25 0 0017.128 15H16.5l-.324-.324a1.453 1.453 0 00-2.328.377l-.036.073a1.586 1.586 0 01-.982.816l-.99.282c-.55.157-.894.702-.8 1.267l.073.438c.08.474.49.821.97.821.846 0 1.598.542 1.865 1.345l.215.643m5.276-3.67a9.012 9.012 0 01-5.276 3.67m0 0a9 9 0 01-10.275-4.835M15.75 9c0 .896-.393 1.7-1.016 2.25" />
</svg>`,
        instructions:
          'In the Preview tab, press the Share to Gallery button to add your project to the gallery.',
        text: 'Created the <a href="/gallery" class="link">project gallery</a> to showcase user-created projects.',
        title: 'Project Gallery',
      },
    ],
    version: '1.680',
  },
  {
    date: 'February, 2022',
    notes: [
      {
        icon: ICONS.wrench,
        text: '',
        title: 'Fixed Unit Conversion Issues',
      },
    ],
    version: '1.3.2',
  },
  {
    notes: [
      {
        icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                    </svg>
                    `,
        text: 'After a year of adding features, bug-fixing, and fixing issues, version one is stable and ready for use.',
        title: 'First Stable Version',
      },
    ],
    version: '1.0.0',
  },
  {
    date: 'January, 2022',
    notes: [
      {
        icon: ICONS.wrench,
        instructions:
          'If you open a project created before January 22nd, 2022, you’ll need to update your project by entering missing information and re-saving it.',
        text: 'In order to improve the accuracy and functionality of the site both now and in the future, this update unfortunately includes breaking changes to previously saved projects. I apologize for any inconvenience, and will try to limit the amount of these kinds of changes in the future.',
        title: 'Save Project in URL',
      },
    ],
    version: '0.98',
  },
  {
    date: 'January, 2021',
    notes: [
      {
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path fill="currentColor" d="M9.967 8.193L5 13h3v6h4v-6h3L9.967 8.193zM18 1H2C.9 1 0 1.9 0 3v12c0 1.1.9 2 2 2h4v-2H2V6h16v9h-4v2h4c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zM2.5 4.25a.75.75 0 1 1 0-1.5a.75.75 0 0 1 0 1.5zm2 0a.75.75 0 1 1 0-1.5a.75.75 0 0 1 0 1.5zM18 4H6V3h12.019L18 4z"/></svg>`,
        text: 'Temperature-blanket.com is open to the public.',
        title: 'Public Beta Access',
      },
    ],
  },
];
