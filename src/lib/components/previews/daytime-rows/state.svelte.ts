import { HOURS_PER_DAY } from '$lib/constants';
import { gauges, previews, weather } from '$lib/state';
import type { BasePreviewSettings, WeatherParam } from '$lib/types';
import { dateToISO8601String, displayNumber, setTargets } from '$lib/utils';
import Preview from './Preview.svelte';
import Settings from './Settings.svelte';

interface DaytimeRowsPreviewSettings extends BasePreviewSettings {
  daytimeTarget: WeatherParam['id'];
  nightTarget: WeatherParam['id'];
  stitchesPerRow: number;
  daytimePosition: 'left' | 'right' | 'center' | 'sides';
}

export class DaytimeRowsPreviewClass {
  constructor() {
    $effect.root(() => {
      // If a gauge is created or deleted, handle updating the available weather parameter targets
      $effect(() => {
        if (gauges.allCreated.length) {
          this.settings.daytimeTarget = setTargets(this.settings.daytimeTarget);
          this.settings.nightTarget = setTargets(this.settings.nightTarget);
        }
      });
    });
  }

  // *******************
  // Constant properties
  // *******************
  name = 'Daytime Rows';

  id = 'rsun';

  svg = $state();

  img = {
    light: './images/preview_icons/Daylight Rows.png',
    dark: './images/preview_icons/Daylight Rows White.png',
  };

  wpTagId = 4;

  wpTagSlug = 'daylight-rows';

  settingsComponent = Settings;

  previewComponent = Preview;

  sections = $state([]);

  STITCH_SIZE = 10;

  // *******************
  // User settings properties
  // *******************
  settings = $state<DaytimeRowsPreviewSettings>({
    daytimeTarget: 'tmax',
    nightTarget: 'tmin',
    stitchesPerRow: 300,
    daytimePosition: 'left', // 'left' || 'right' || 'center' || 'sides'
    useSeasonTargets: false,
  });

  // *******************
  // Derived properties
  // *******************

  width = $derived(this.settings.stitchesPerRow * this.STITCH_SIZE);

  height = $derived(weather.data?.length * this.STITCH_SIZE);

  targets = $derived(
    gauges.allCreated
      .map((n) => n.targets)
      .flat()
      .filter(
        (n) =>
          this.settings.nightTarget === n.id ||
          this.settings.daytimeTarget === n.id,
      ),
  );

  daytimeLabel = $derived.by(() => {
    switch (this.settings.daytimePosition) {
      case 'left':
        return 'left side';
      case 'right':
        return 'right side';
      case 'center':
        return 'center';
      case 'sides':
        return 'sides';
      default:
        return '';
    }
  });

  nightLabel = $derived.by(() => {
    switch (this.settings.daytimePosition) {
      case 'left':
        return 'right side';
      case 'right':
        return 'left side';
      case 'center':
        return 'sides';
      case 'sides':
        return 'center';
      default:
        return '';
    }
  });

  tableData = $derived.by(() => {
    return weather.data?.map((n, i) => {
      let left, center, right, divided;
      let daytimeStitches = displayNumber(
        (n.dayt['imperial'] * this.settings.stitchesPerRow) / HOURS_PER_DAY,
        0,
      );

      let nightStitches = displayNumber(
        this.settings.stitchesPerRow - daytimeStitches,
        0,
      );

      switch (this.settings.daytimePosition) {
        case 'left':
          left = daytimeStitches;
          right = nightStitches;
          break;
        case 'right':
          left = nightStitches;
          right = daytimeStitches;
          break;
        case 'center':
          divided = nightStitches / 2;
          if (!Number.isInteger(divided)) {
            divided = Math.ceil(divided);
            daytimeStitches -= 1;
          }
          left = divided;
          center = daytimeStitches;
          right = divided;
          break;
        case 'sides':
          divided = daytimeStitches / 2;
          if (!Number.isInteger(divided)) {
            divided = Math.ceil(divided);
            nightStitches -= 1;
          }
          left = divided;
          center = nightStitches;
          right = divided;
          break;
        default:
          break;
      }

      return {
        row: i + 1,
        date: dateToISO8601String(n.date),
        left,
        center,
        right,
      };
    });
  });

  // *******************
  // URL hash derived from settings
  // *******************
  hash = $derived.by(() => {
    let hash = '&';
    hash += `${this.id}=`;
    hash += `${this.settings.daytimeTarget}${this.settings.nightTarget}(${this.settings.stitchesPerRow})`;
    switch (this.settings.daytimePosition) {
      case 'left':
        hash += '0';
        break;
      case 'right':
        hash += '1';
        break;
      case 'center':
        hash += '2';
        break;
      case 'sides':
        hash += '3';
        break;
      default:
        break;
    }
    return hash;
  });

  // *******************
  // Method for loading settings from a url hash string
  // *******************
  load(hash) {
    let startIndex, lengthEndIndex;

    for (let i = 0; i < hash.length; i++) {
      if (hash[i] === '(') startIndex = i;
      if (hash[i] === ')') lengthEndIndex = i;
    }

    if (!startIndex || !lengthEndIndex) return; // format of hash was wrong, so stop processing
    // targets
    let targets = hash.substring(0, startIndex);
    targets = targets.match(/.{1,4}/g);
    this.settings.daytimeTarget = targets[0];
    this.settings.nightTarget = targets[1];

    // stitches per row
    this.settings.stitchesPerRow = +hash.substring(
      startIndex + 1,
      lengthEndIndex,
    );

    // Added daytimePosition from v1.815
    if (hash.length > lengthEndIndex + 1) {
      switch (hash.substring(lengthEndIndex + 1, lengthEndIndex + 2)) {
        case '0':
          this.settings.daytimePosition = 'left';
          break;
        case '1':
          this.settings.daytimePosition = 'right';
          break;
        case '2':
          this.settings.daytimePosition = 'center';
          break;
        case '3':
          this.settings.daytimePosition = 'sides';
          break;

        default:
          break;
      }
    }

    previews.activeId = this.id;
  }
}

export const daytimeRowsPreview = new DaytimeRowsPreviewClass();
