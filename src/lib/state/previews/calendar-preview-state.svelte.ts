import CalendarPreview from '$lib/components/previews/CalendarPreview.svelte';
import CalendarSettings from '$lib/components/previews/CalendarSettings.svelte';
import { CHARACTERS_FOR_URL_HASH } from '$lib/constants';
import { gauges, previews, weather } from '$lib/state';
import {
  getDaysInLongestMonth,
  getFactors,
  getMiddleValueOfArray,
  getPossibleDimensions,
  getSquareSectionTargetIds,
  getWeatherTargets,
  setSecondaryTargets,
  setTargets,
  weatherMonthsData,
} from '$lib/utils';
import chroma from 'chroma-js';

export class CalendarPreviewClass {
  constructor() {
    $effect.root(() => {
      // If a gauge is created or deleted, handle updating the available weather parameter targets
      $effect(() => {
        if (gauges.allCreated.length) {
          this.settings.primaryTarget = setTargets(this.settings.primaryTarget);
          this.settings.secondaryTargets = setTargets(
            this.settings.secondaryTargets,
          );
        }
      });

      // If the weather data is grouped by week, then update the start of the week to match the start of the month grouping day
      $effect(() => {
        if (weather.grouping === 'week')
          calendarPreview.settings.weekStartCode =
            weather.monthGroupingStartDay;
      });

      // If a new weather search happens, and the current dimensions are not possible, set new dimensions
      $effect(() => {
        if (
          weather.data.length &&
          !this.possibleDimensions.includes(calendarPreview.settings.dimensions)
        )
          calendarPreview.settings.dimensions = getMiddleValueOfArray(
            this.possibleDimensions,
          );
      });
    });
  }

  // *******************
  // Constant properties
  // *******************

  squareSectionSize = 10;

  weekLength = 7;

  id = 'clnr';

  name = 'Calendar';

  sections = $state([]);

  svg = $state(null);

  img = $state({
    light: './images/preview_icons/Calendar.png',
    dark: './images/preview_icons/Calendar White.png',
  });

  wpTagId = 6;

  wpTagSlug = 'calendar';

  previewComponent = CalendarPreview;

  settingsComponent = CalendarSettings;

  // *******************
  // User settings properties
  // *******************

  settings = $state({
    primaryTarget: 'tmax',
    squareSize: 3,
    secondaryTargets: [],
    dimensions: '3x4',
    weekStartCode: 1,
    monthPadding: 0,
    additionalSquaresColor: '#f0f3f3',
    primaryTargetAsBackup: 1,
  });

  // *******************
  // Derived properties
  // *******************
  dimensionsWidth = $derived(+this.settings.dimensions.split('x')[0]);

  dimensionsHeight = $derived(+this.settings.dimensions.split('x')[1]);

  monthPadding = $derived(
    this.settings.monthPadding ? this.squareSectionSize : 0,
  );

  months = $derived(weatherMonthsData({ weatherData: weather.rawData }));

  factors = $derived(getFactors({ length: this.months.length }));

  possibleDimensions = $derived(
    getPossibleDimensions({ factors: this.factors }),
  );

  daysInLongestMonth = $derived(getDaysInLongestMonth(this.months));

  needsExtraWeek = $derived(
    this.months.some((month) => {
      if (month.days === 31) return month.start > 4;
      if (month.days === 30) return month.start > 5;
    }),
  );

  squaresPerMonth = $derived.by(() => {
    let days = this.daysInLongestMonth;
    if (this.needsExtraWeek) days += calendarPreview.weekLength;
    if (days % calendarPreview.weekLength === 0) return days;
    days =
      calendarPreview.weekLength - (days % calendarPreview.weekLength) + days;
    return days;
  });

  weeksInLongestMonth = $derived(
    this.squaresPerMonth / calendarPreview.weekLength,
  );

  extraSquares = $derived.by(() => {
    let data = [];
    let max = this.squaresPerMonth;
    this.months.forEach((month, index) => {
      let days = [
        ...weather.rawData.filter(
          (day) =>
            day.date.getFullYear() === month.year &&
            day.date.getMonth() === month.month,
        ),
      ];
      let start =
        month.start - this.settings.weekStartCode < 0
          ? calendarPreview.weekLength +
            (month.start - this.settings.weekStartCode)
          : month.start - this.settings.weekStartCode;
      let day = new Date(days[0].date);
      let startDay = new Date(month.year, month.month, month.start + 1);
      if (day.getDate() > startDay.getDate()) start = day.getDate() - 1 + start;
      let extra = max - days.length;
      for (let i = 0; i < extra; i += 1) {
        let value = i;
        let fromEnd = max - extra + i;
        if (i >= start) value = fromEnd; // from end
        if (start === 0 && i === 0) value = fromEnd; // The start of month is first of month, so go from end
        value += index * max;
        data.push(value);
      }
    });
    return data;
  });

  squareSectionsCount = $derived(
    this.settings.squareSize * this.settings.squareSize,
  );

  squareSectionParams = $derived(
    getSquareSectionTargetIds(
      this.squareSectionsCount,
      this.settings.primaryTarget,
      this.settings.secondaryTargets,
    ),
  );

  filterTargets = $derived([...new Set(this.squareSectionParams)]);

  targets = $derived(
    getWeatherTargets({
      weatherParameters: this.filterTargets.reduce(
        (a, v) => ({ ...a, [v]: true }),
        {},
      ),
    }),
  );

  width = $derived(
    this.dimensionsWidth *
      this.weekLength *
      this.settings.squareSize *
      this.squareSectionSize +
      this.dimensionsWidth * this.monthPadding,
  );

  height = $derived.by(() => {
    let extra = this.needsExtraWeek ? 1 : 0;
    let height =
      this.dimensionsHeight *
        (this.weeksInLongestMonth + extra) *
        this.settings.squareSize *
        calendarPreview.squareSectionSize +
      (this.dimensionsHeight - 1) * this.monthPadding -
      this.dimensionsHeight *
        this.settings.squareSize *
        calendarPreview.squareSectionSize; // I don't understand the minus bit at the end but it works
    return height;
  });

  // *******************
  // URL hash derived from settings
  // *******************

  hash = $derived.by(() => {
    let hash = '&';
    hash += `${this.id}=`;
    hash += `${this.settings.primaryTarget}(${this.settings.squareSize}${CHARACTERS_FOR_URL_HASH.separator}${this.settings.dimensions}${
      CHARACTERS_FOR_URL_HASH.separator
    }${this.settings.weekStartCode}${CHARACTERS_FOR_URL_HASH.separator}${this.settings.monthPadding ? 1 : 0}${
      CHARACTERS_FOR_URL_HASH.separator
    }${chroma(this.settings.additionalSquaresColor).hex().substring(1)})`;
    hash += `${this.settings.primaryTargetAsBackup}`;
    if (this.settings.secondaryTargets) {
      this.settings.secondaryTargets.forEach((item) => {
        hash += `${item.targetId}(${item.indexes.join(CHARACTERS_FOR_URL_HASH.separator)})`;
      });
    }
    return hash;
  });

  // *******************
  // Method for loading settings from a url hash string
  // *******************
  load(hash) {
    let _settings = JSON.parse(JSON.stringify(defaultSettings));

    let startIndex = [],
      endIndex = [];
    const separatorIndex = [];
    for (let i = 0; i < hash.length; i++) {
      if (hash[i] === '(') startIndex.push(i);
      if (
        hash[i] === CHARACTERS_FOR_URL_HASH.separator ||
        hash[i] === CHARACTERS_FOR_URL_HASH.separator_alt
      )
        separatorIndex.push(i);
      if (hash[i] === ')') endIndex.push(i);
    }
    if (!startIndex || !separatorIndex || !endIndex) return; // format of hash was wrong, so stop processing

    this.settings.primaryTarget = hash.substring(0, startIndex[0]);
    this.settings.squareSize = +hash.substring(
      startIndex[0] + 1,
      separatorIndex[0],
    );
    this.settings.dimensions = hash.substring(
      separatorIndex[0] + 1,
      separatorIndex[1],
    );
    this.settings.dimensions = this.settings.dimensions.replace('×', 'x'); // sometimes firefox formated this as multiplcation sign
    this.settings.weekStartCode = +hash.substring(
      separatorIndex[1] + 1,
      separatorIndex[2],
    );
    this.settings.monthPadding = +hash.substring(
      separatorIndex[2] + 1,
      separatorIndex[3],
    );
    this.settings.additionalSquaresColor = chroma(
      hash.substring(separatorIndex[3] + 1, endIndex[0]),
    ).hex();
    this.settings.primaryTargetAsBackup = +hash.substring(
      endIndex[0] + 1,
      endIndex[0] + 2,
    );
    // Secondary Targets
    if (startIndex.length > 1) {
      for (let i = 1; i < startIndex.length; i++) {
        let targetId = hash.substring(startIndex[i] - 4, startIndex[i]);
        if (targetId === 'time') targetId = 'dayt'; // Bug fix in 1.67 (previous id was daytime so it got cut off)
        const secondaryParamSeparatorIndex = separatorIndex.filter(
          (item) => item > startIndex[i] && item < endIndex[i],
        );
        let start = startIndex[i] + 1;
        for (
          let positionIndex = 0;
          positionIndex < secondaryParamSeparatorIndex.length + 1;
          positionIndex++
        ) {
          let end =
            typeof secondaryParamSeparatorIndex[positionIndex] === 'undefined'
              ? endIndex[i]
              : secondaryParamSeparatorIndex[positionIndex];
          let value = hash.substring(start, end);
          start = end + 1;
          this.settings.secondaryTargets = setSecondaryTargets(
            [targetId, +value],
            this.settings.secondaryTargets,
          );
        }
      }
    }
    previews.activeId = this.id;
  }
}

export const calendarPreview = new CalendarPreviewClass();
