import { CHARACTERS_FOR_URL_HASH } from '$lib/constants';
import { DEFAULT_SEASONS } from '$lib/constants/seasons-constants';
import { getSeasonForDate } from '$lib/utils/seasons-utils.svelte';
import { gauges, previews, weather, localState, project } from '$lib/state';
import {
  displayNumber,
  setTargets,
  sum,
  getColorInfo,
  getWeatherValue,
  runPreview,
} from '$lib/utils';
import chroma from 'chroma-js';
import Preview from './Preview.svelte';
import Settings from './Settings.svelte';
import { untrack } from 'svelte';
import { weatherDataUpdatedKey } from '$lib/components/WeatherTableWrapper.svelte';

// Special marker used to indicate an "extras" row for days outside all seasons
const EXTRAS_TARGET = '__extras__';

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

  getSectionStitchesCount(dayIndex: number) {
    if (this.settings.lengthTarget === 'none')
      return this.settings.stitchesPerRow;
    if (this.settings.lengthTarget === 'custom')
      return this.settings.stitchesPerDay;
    let value = Math.abs(
      (weather.data[dayIndex] as any)[this.settings.lengthTarget][
        localState.value.units as any
      ],
    );
    if (isNaN(value)) value = this.settings.stitchesPerDay;
    if (value === 0) value = 1;
    return value;
  }

  // *******************
  // Derived properties
  // *******************
  previewIndex = $state(0);

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
      ? [...new Set(this.settings.seasonTargets.flat())]
      : this.settings.selectedTargets,
  );

  width = $derived(this.settings.stitchesPerRow * this.stitchSize);

  layout = $derived.by(() => {
    // Ensure reactivity to project changes
    project.url.href;
    weatherDataUpdatedKey.value;
    // Early return if no data is available
    if (
      !window ||
      !weather.data.length ||
      !gauges.allCreated.length ||
      project.status.loading
    ) {
      return { sections: [], height: 0 };
    }

    // Setup constants
    let columnIndex = 0; // Current column index
    let stitchYRow = 0; // Current row position
    let isWeatherSection: boolean; // Flag indicating if it's a weather section
    let lineWidth: number; // Width of the current line
    let remainderLineCount = 0; // Count of remaining stitches in the line
    let currentVisualRowHeight = 0; // Track the max height of the current row being rendered

    // Loop through each section
    const sections: any[] = [];

    for (
      let sectionIndex = 0, dayIndex = 0;
      sectionIndex < this.totalSections;
      sectionIndex++, dayIndex++
    ) {
      let section = []; // Array to store stitches in the section
      let sectionStitchesCount: number; // Count of stitches in the section

      // Check if the current section index is greater than or equal to the total number of days
      if (sectionIndex >= weather.data.length) {
        // If so, it means we are in the additional stitches section
        isWeatherSection = false;
        // Set the section stitches count to the number of additional stitches needed
        sectionStitchesCount = this.countOfAdditionalStitches;
      } else {
        // Otherwise, we are in the weather section
        isWeatherSection = true;
        // Get the section stitches count based on the day index using the getSectionStitchesCount function
        sectionStitchesCount = this.getSectionStitchesCount(dayIndex);
      }

      // Loop through each stitch in the section
      for (
        let sectionStitchIndex = 0;
        sectionStitchIndex < sectionStitchesCount;

      ) {
        if (remainderLineCount > 0) {
          // If there are remaining stitches from the previous line, reset the stitch index and adjust the stitch count
          sectionStitchIndex = 0;
          sectionStitchesCount = remainderLineCount;
        }

        if (columnIndex === this.width / this.stitchSize) {
          // If the current column index reaches the width limit, reset the column index and move to the next row
          columnIndex = 0;
          stitchYRow += currentVisualRowHeight;
          currentVisualRowHeight = 0;
        }

        if (
          sectionStitchesCount <=
          this.width / this.stitchSize - columnIndex
        ) {
          // If the remaining stitches fit within the current row, set the line width and reset the remainder count
          lineWidth = sectionStitchesCount;
          remainderLineCount = 0;
        } else {
          // If the remaining stitches exceed the current row, set the line width to the remaining space and update the remainder count
          lineWidth = this.width / this.stitchSize - columnIndex;
          remainderLineCount = sectionStitchesCount - lineWidth;
        }

        // Determine active targets depending on section type and season usage
        let activeTargets: string[];
        if (isWeatherSection) {
          activeTargets = this.getTargetsForDay(dayIndex);
          // If using season targets, a missing/empty target list should render as a single extras row.
          if (
            this.settings.useSeasonTargets &&
            (!activeTargets || activeTargets.length === 0)
          ) {
            activeTargets = [EXTRAS_TARGET];
          }
        } else {
          // For filler (non-weather) sections:
          // - If using seasons, make the filler a single extras row so it matches the expected fallback style.
          // - If not using seasons, use the activeSelectedTargets (or selectedTargets) so the filler matches normal stacks.
          activeTargets = this.settings.useSeasonTargets
            ? [EXTRAS_TARGET]
            : this.activeSelectedTargets;

          // Defensive fallback: ensure at least one row is rendered.
          if (!activeTargets || activeTargets.length === 0)
            activeTargets = [EXTRAS_TARGET];
        }

        for (
          let paramIndex = 0,
            y2 = stitchYRow,
            x = columnIndex * this.stitchSize;
          paramIndex < activeTargets.length;
          paramIndex++, y2 += this.stitchSize
        ) {
          let color: string;

          if (isWeatherSection) {
            let param = activeTargets[paramIndex] as any;
            if (param === EXTRAS_TARGET) {
              color = this.settings.extrasColor;
            } else {
              let value = getWeatherValue({ dayIndex, param });
              const colorInfo = getColorInfo({ param, value });
              color = colorInfo.hex || '#cccccc';
            }
          } else {
            color = this.settings.extrasColor;
          }

          // Push the stitch object to the section array
          section.push({
            width: lineWidth * this.stitchSize,
            height: this.stitchSize,
            color,
            x,
            y: y2,
            isWeatherSection,
            dayIndex,
          });
        }

        // Handling row wrapping and height increment:
        const currentBlockHeight = activeTargets.length * this.stitchSize;
        if (currentBlockHeight > currentVisualRowHeight) {
          currentVisualRowHeight = currentBlockHeight;
        }

        columnIndex += lineWidth;
        sectionStitchIndex += lineWidth;

        // If row is full
        if (columnIndex >= this.width / this.stitchSize) {
          columnIndex = 0;
          stitchYRow += currentVisualRowHeight;
          currentVisualRowHeight = 0; // Reset for next row
        }

        sections.push(section);
      }
    }

    return {
      sections,
      height: stitchYRow + currentVisualRowHeight,
    };
  });

  hasDatesOutOfSeasonsRanges = $derived.by(() => {
    if (!this.settings.useSeasonTargets) return false;
    for (let i = 0; i < weather.data.length; i++) {
      const date = weather.data?.[i]?.date;
      const season = getSeasonForDate(date, localState.value.seasons) as any;
      if (!season) return true;
    }
    return false;
  });

  sections = $derived(this.layout.sections);

  height = $derived(this.layout.height);

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

  totalRows = $derived.by(() => {
    if (!this.settings.useSeasonTargets)
      return this.rows * this.settings.selectedTargets.length;
    let rowCount = 0;
    for (let i = 0; i < weather.data.length; i++) {
      const targets = this.getTargetsForDay(i);
      const dayStitches = this.getSectionStitchesCount(i);
      const dayRows = Math.ceil(dayStitches / this.settings.stitchesPerRow);
      rowCount += dayRows * targets.length;
    }
    return rowCount;
  });

  // *******************
  // URL hash derived from settings
  // *******************
  hash = $derived.by(() => {
    let hash = '&';
    hash += `${this.id}=`;
    // Add the targets to the hash
    if (!this.settings.useSeasonTargets)
      hash += `${this.settings.selectedTargets.join('')}`;
    // Or add the season targets if used
    else
      hash += this.settings.seasonTargets
        .map((t) => t.join(''))
        .join(CHARACTERS_FOR_URL_HASH.separator);
    hash += '(';
    hash += this.settings.stitchesPerRow;

    // Add the other settings to the hash
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
      if (startIndex && i > startIndex) {
        // Only look for separators after the opening parenthesis
        // Separators may be present before if using season targets
        if (
          hash[i] === CHARACTERS_FOR_URL_HASH.separator ||
          hash[i] == CHARACTERS_FOR_URL_HASH.separator_alt
        )
          separatorIndex = i;
      }
      if (hash[i] === '!') exclamationIndex = i;
      if (hash[i] === ')') lengthEndIndex = i;
    }

    // If the format of the hash is incorrect, stop processing
    if (startIndex === undefined || lengthEndIndex === undefined) return;

    // Extract the targets from the hash
    let targetsStr = hash.substring(0, startIndex);

    if (
      targetsStr.includes(CHARACTERS_FOR_URL_HASH.separator) ||
      targetsStr.includes(CHARACTERS_FOR_URL_HASH.separator_alt)
    ) {
      // Season targets are being used
      let seasonsTargets: string[] | string[][] = [];
      if (targetsStr.includes(CHARACTERS_FOR_URL_HASH.separator))
        seasonsTargets = targetsStr.split(CHARACTERS_FOR_URL_HASH.separator);
      if (targetsStr.includes(CHARACTERS_FOR_URL_HASH.separator_alt))
        seasonsTargets = targetsStr.split(
          CHARACTERS_FOR_URL_HASH.separator_alt,
        );

      seasonsTargets = seasonsTargets.map((seasonTargetStr) => {
        const targetsMatch = seasonTargetStr.match(/.{1,4}/g);
        if (targetsMatch) return targetsMatch;
        return [];
      });

      if (seasonsTargets && seasonsTargets.length === DEFAULT_SEASONS.length) {
        // if there are valid season targets, update the settings
        this.settings.useSeasonTargets = true;
        this.settings.seasonTargets = seasonsTargets as string[][];
      }
    } else {
      // Season targets are not being used, so extract targets every four characters
      const targetsMatch = targetsStr.match(/.{1,4}/g);
      if (targetsMatch) {
        this.settings.selectedTargets = targetsMatch;
      }
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
    if (!date) return [EXTRAS_TARGET];

    const dateObj = new Date(date);
    const season = getSeasonForDate(dateObj, localState.value.seasons) as any;

    if (!season) return [EXTRAS_TARGET];

    // Find the index of the season in the user's seasons list
    const seasonIndex = localState.value.seasons.indexOf(season);

    // If matching by reference fails (indexOf -1), fall back to checking date range equality
    if (seasonIndex === -1) {
      for (let i = 0; i < localState.value.seasons.length; i++) {
        if (
          localState.value.seasons[i].startDate === season.startDate &&
          localState.value.seasons[i].endDate === season.endDate
        ) {
          const st = this.settings.seasonTargets[i];
          return st && st.length ? st : [EXTRAS_TARGET];
        }
      }
      return [EXTRAS_TARGET];
    }

    const st = this.settings.seasonTargets[seasonIndex];
    return st && st.length ? st : [EXTRAS_TARGET];
  }
}

export const rowsPreview = new RowsPreviewClass();
