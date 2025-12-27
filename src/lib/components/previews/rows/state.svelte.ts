import { CHARACTERS_FOR_URL_HASH } from '$lib/constants';
import {
  DEFAULT_SEASONS,
  getSeasonForMonth,
} from '$lib/constants/seasons-constants';
import { gauges, previews, weather, localState } from '$lib/state';
import { displayNumber, setTargets, sum } from '$lib/utils';
import chroma from 'chroma-js';
import Preview from './Preview.svelte';
import Settings from './Settings.svelte';

export class RowsPreviewClass {
  constructor() {
    $effect.root(() => {
      // If a gauge is created or deleted, handle updating the available weather parameter targets
      $effect(() => {
        if (gauges.allCreated.length) {
          this.settings.selectedTargets = setTargets(
            this.settings.selectedTargets,
          );
          // Also validate season targets
          if (this.settings.useSeasonTargets) {
            this.settings.seasonTargets = this.settings.seasonTargets.map(
              (target) => setTargets(target) || target,
            );
          }
        }
      });
    });
  }

  // *******************
  // Constant properties
  // *******************
  stitchSize = 10;

  id = 'rows';

  name = 'Rows';

  sections = $state<any[]>([]);

  svg = $state<SVGSVGElement | null>(null);

  img = $state({
    light: './images/preview_icons/Rows.png',
    dark: './images/preview_icons/Rows White.png',
  });

  wpTagId = 2;

  wpTagSlug = 'rows';

  previewComponent = Preview;

  settingsComponent = Settings;

  // *******************
  // User settings properties
  // *******************
  settings = $state({
    selectedTargets: ['tmax'],
    stitchesPerRow: 300,
    stitchesPerDay: 300,
    lengthTarget: 'none',
    extrasColor: '#f0f3f3',
    useSeasonTargets: false,
    seasonTargets: [['tmax'], ['tmax'], ['tmax'], ['tmax']], // [spring, summer, fall, winter]
  });

  // *******************
  // Derived properties
  // *******************
  totalStitches = $derived.by(() => {
    if (this.settings.lengthTarget === 'none')
      return this.settings.stitchesPerRow * weather.data?.length;
    if (this.settings.lengthTarget === 'custom')
      return this.settings.stitchesPerDay * weather.data?.length;
    return sum(this.settings.lengthTarget);
  });

  rows = $derived(Math.ceil(this.totalStitches / this.settings.stitchesPerRow));

  // Get the target IDs to use for rendering
  activeSelectedTargets = $derived(
    this.settings.useSeasonTargets
      ? this.settings.seasonTargets.flat()
      : this.settings.selectedTargets,
  );

  width = $derived(this.settings.stitchesPerRow * this.stitchSize);

  height = $derived(
    this.rows * this.stitchSize * this.activeSelectedTargets.length,
  );

  countOfAdditionalStitches = $derived(
    displayNumber(
      this.rows * this.settings.stitchesPerRow - this.totalStitches,
      6,
    ),
  );

  totalSections = $derived(
    this.countOfAdditionalStitches > 0
      ? weather.data?.length + 1
      : weather.data?.length,
  );

  targets = $derived(
    gauges.allCreated
      .flatMap((n) => n.targets)
      .filter((n) => this.activeSelectedTargets.includes(n.id)),
  );

  totalRows = $derived(this.rows * this.activeSelectedTargets.length);

  // *******************
  // URL hash derived from settings
  // *******************
  hash = $derived.by(() => {
    let hash = '&';
    hash += `${this.id}=`;
    hash += `${this.activeSelectedTargets.join('')}`;
    hash += '(';
    hash += this.settings.stitchesPerRow;
    // Add season targets if enabled
    if (this.settings.useSeasonTargets) {
      hash += `${CHARACTERS_FOR_URL_HASH.separator}${this.settings.seasonTargets.map((t) => t.join('')).join(CHARACTERS_FOR_URL_HASH.separator)}`;
    }
    // here's the rub...
    if (
      this.countOfAdditionalStitches > 0 &&
      this.settings.lengthTarget !== 'none'
    )
      hash += `${CHARACTERS_FOR_URL_HASH.separator}${chroma(this.settings.extrasColor).hex().substring(1)}`;
    if (this.settings.lengthTarget === 'custom')
      hash += `!${this.settings.stitchesPerDay}`;
    else if (this.settings.lengthTarget !== 'none')
      hash += `!${this.settings.lengthTarget}`;
    hash += ')';
    return hash;
  });

  // *******************
  // Method for loading settings from a url hash string
  // *******************
  load(hash: string) {
    // Initialize variables
    let startIndex: number | undefined,
      separatorIndex: number | undefined,
      exclamationIndex: number | undefined,
      lengthEndIndex: number | undefined;

    // Iterate through the hash string to find the indices of specific characters
    for (let i = 0; i < hash.length; i++) {
      if (hash[i] === '(') startIndex = i;
      if (
        hash[i] === CHARACTERS_FOR_URL_HASH.separator ||
        hash[i] == CHARACTERS_FOR_URL_HASH.separator_alt
      )
        separatorIndex = i;
      if (hash[i] === '!') exclamationIndex = i;
      if (hash[i] === ')') lengthEndIndex = i;
    }

    // If the format of the hash is incorrect, stop processing
    if (startIndex === undefined || lengthEndIndex === undefined) return;

    // Extract the targets from the hash and update the settings
    let targetsStr = hash.substring(0, startIndex);
    const targetsMatch = targetsStr.match(/.{1,4}/g);
    if (targetsMatch) {
      this.settings.selectedTargets = targetsMatch;
    }

    // Extract the stitches per row from the hash and update the settings
    let stitchesPerRow: number | undefined;
    if (separatorIndex) {
      stitchesPerRow = +hash.substring(startIndex + 1, separatorIndex);
    } else if (exclamationIndex) {
      stitchesPerRow = +hash.substring(startIndex + 1, exclamationIndex);
    } else if (lengthEndIndex) {
      stitchesPerRow = +hash.substring(startIndex + 1, lengthEndIndex);
    }
    if (stitchesPerRow !== undefined)
      this.settings.stitchesPerRow = stitchesPerRow;

    // Extract season targets if they exist (between first and potential second separator)
    let secondSeparatorIndex = -1;
    let firstSeparatorAfterParen = separatorIndex;
    if (separatorIndex !== undefined) {
      for (let i = separatorIndex + 1; i < hash.length; i++) {
        if (
          hash[i] === CHARACTERS_FOR_URL_HASH.separator ||
          hash[i] == CHARACTERS_FOR_URL_HASH.separator_alt
        ) {
          secondSeparatorIndex = i;
          break;
        }
      }
    }

    // Check if we have season targets
    if (
      firstSeparatorAfterParen !== undefined &&
      secondSeparatorIndex > firstSeparatorAfterParen
    ) {
      const seasonTargetsStr = hash.substring(
        firstSeparatorAfterParen + 1,
        secondSeparatorIndex,
      );
      const seasonTargets = seasonTargetsStr.split(
        CHARACTERS_FOR_URL_HASH.separator,
      );
      if (seasonTargets && seasonTargets.length === 4) {
        this.settings.useSeasonTargets = true;
        this.settings.seasonTargets = seasonTargets.map(
          (t) => t.match(/.{1,4}/g) || [],
        );
        // Update separator index to the second one for color extraction
        separatorIndex = secondSeparatorIndex;
      }
    }

    // Extract the color from the hash and update the settings
    let color = '';
    if (separatorIndex && exclamationIndex) {
      color = hash.substring(separatorIndex + 1, exclamationIndex);
    } else if (separatorIndex && lengthEndIndex) {
      color = hash.substring(separatorIndex + 1, lengthEndIndex);
    }
    if (chroma.valid(color)) this.settings.extrasColor = chroma(color).hex();

    // Extract the length target or stitches per row from the hash and update the settings
    if (exclamationIndex) {
      let content = hash.substring(exclamationIndex + 1, lengthEndIndex);
      if (isNaN(+content)) this.settings.lengthTarget = content;
      else if (!isNaN(+content)) {
        this.settings.stitchesPerDay = +content;
        this.settings.lengthTarget = 'custom';
      }
    }

    // Update active preview
    previews.activeId = this.id;
  }

  /**
   * Get the target for a specific day index based on season
   */
  getTargetsForDay(dayIndex: number): string[] {
    if (!this.settings.useSeasonTargets) {
      return this.settings.selectedTargets;
    }

    const date = weather.data?.[dayIndex]?.date;
    if (!date) return this.settings.selectedTargets;

    const month = new Date(date).getMonth() + 1; // getMonth returns 0-11
    const season = getSeasonForMonth(month, localState.value.seasons);

    if (!season) return this.settings.selectedTargets;

    // Find the index by matching against DEFAULT_SEASONS
    // Use a simple index approach - the order is always: spring (0), summer (1), fall (2), winter (3)
    let seasonIndex = 0;
    const userSeasons = localState.value.seasons;
    for (let i = 0; i < userSeasons.length; i++) {
      const userSeason = userSeasons[i];
      const defaultSeason = DEFAULT_SEASONS[i];
      // Match by comparing the month arrays
      if (
        userSeason &&
        defaultSeason &&
        JSON.stringify(userSeason['months']) ===
          JSON.stringify(defaultSeason['months'])
      ) {
        seasonIndex = i;
        break;
      }
    }
    return (
      this.settings.seasonTargets[seasonIndex] || this.settings.selectedTargets
    );
  }
}

export const rowsPreview = new RowsPreviewClass();
