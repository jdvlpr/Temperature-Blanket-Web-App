<!-- Copyright (c) 2024, Thomas (https://github.com/jdvlpr)

This file is part of Temperature-Blanket-Web-App.

Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free Software Foundation, 
either version 3 of the License, or (at your option) any later version.

Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App. 
If not, see <https://www.gnu.org/licenses/>. -->

<script>
  import { projectStatus, units, weather } from '$lib/state';
  import {
    getColorInfo,
    getDaysInLongestMonth,
    getSquareSectionTargetIds,
    getTargetParentGaugeId,
    getWeatherTargets,
    showPreviewImageWeatherDetails,
    weatherMonthsData,
  } from '$lib/utils';
  import { settings } from './CalendarSettings.svelte';
  import { previewsData } from './previews.svelte';

  const previewIndex = previewsData.findIndex((n) => n.id === 'clnr');
  const SQUARE_SECTION_SIZE = 10;
  const WEEK_LENGTH = 7;

  let svg;
  let sections = [];

  $: previewsData[previewIndex].width = width;
  $: previewsData[previewIndex].height = height;
  $: previewsData[previewIndex].svg = svg;

  $: width =
    dimensionsWidth * WEEK_LENGTH * $settings.squareSize * SQUARE_SECTION_SIZE +
    dimensionsWidth * monthPadding;
  $: height = getHeight(
    needsExtraWeek,
    weeksInLongestMonth,
    monthPadding,
    dimensionsHeight,
    $settings.squareSize,
  );

  $: dimensionsWidth = +$settings.dimensions.split('x')[0];
  $: dimensionsHeight = +$settings.dimensions.split('x')[1];

  $: monthPadding = $settings.monthPadding ? SQUARE_SECTION_SIZE : 0;

  $: months = weatherMonthsData({ weatherData: weather.rawData });

  $: daysInLongestMonth = getDaysInLongestMonth(months);

  $: needsExtraWeek = getNeedsExtraWeek(months);

  $: squaresPerMonth = getSquaresPerMonth(daysInLongestMonth, needsExtraWeek);

  $: weeksInLongestMonth = getWeeksInLongestMonth(squaresPerMonth);

  $: extraSquares = getExtraSquares(
    squaresPerMonth,
    months,
    $settings.weekStartCode,
  );

  $: targets = getWeatherTargets({
    weatherParameters: filterTargets.reduce(
      (a, v) => ({ ...a, [v]: true }),
      {},
    ),
  });

  $: if (projectStatus.state.liveURL) {
    const squareSectionsCount = $settings.squareSize * $settings.squareSize;
    const squareSectionParams = getSquareSectionTargetIds(
      squareSectionsCount,
      $settings.primaryTarget,
      $settings.secondaryTargets,
    );
    let row = 0;
    let additionalSquaresAddedCount = 0;
    let monthColumnIndex = 0;
    let monthIndex = 0;
    let monthRowIndex = 0;
    let total = weather.rawData?.length + extraSquares.length;
    let weekIndex = 0;
    let rowPadding = 0;
    let columnPadding = 0;
    let x = 0,
      y = 0; // Yes, these are necessary.
    sections = [];
    for (
      let squareIndex = 0, column = 0, isWeatherSquare = true;
      squareIndex < total;
      squareIndex++, column++
    ) {
      if (
        squareIndex % squaresPerMonth === 0 &&
        weekIndex + 1 === weeksInLongestMonth &&
        squareIndex !== 0
      ) {
        // finished month
        monthIndex += 1;
        weekIndex = 0;
        if (monthIndex % dimensionsWidth === 0) {
          // finished month row
          monthRowIndex += weeksInLongestMonth;
          monthColumnIndex = 0;
          rowPadding += monthPadding;
          columnPadding = 0;
        } else {
          // continue in the same row
          monthColumnIndex += WEEK_LENGTH;
          columnPadding += monthPadding;
        }
        row = monthRowIndex;
        column = monthColumnIndex;
      }
      if (
        squareIndex % WEEK_LENGTH === 0 &&
        squareIndex !== 0 &&
        squareIndex % squaresPerMonth !== 0
      ) {
        // Finished week
        column = monthColumnIndex;
        row += 1;
        weekIndex += 1;
      }
      const square = [];
      let dayIndex = squareIndex - additionalSquaresAddedCount;

      if (extraSquares.includes(squareIndex)) {
        isWeatherSquare = false;
        additionalSquaresAddedCount += 1;
      } else {
        isWeatherSquare = true;
      }

      const xStart =
        column * ($settings.squareSize * SQUARE_SECTION_SIZE) + columnPadding;
      const yStart =
        row * ($settings.squareSize * SQUARE_SECTION_SIZE) + rowPadding;

      let _dayIndex = dayIndex;
      if (weather.grouping === 'week') {
        _dayIndex = Math.ceil((dayIndex - weather.monthGroupingStartDay) / 7);
      }
      for (
        let squareSectionIndex = 0, x = xStart, y = yStart;
        squareSectionIndex < squareSectionsCount;
        squareSectionIndex++
      ) {
        let color;
        if (isWeatherSquare) {
          const day = weather.data[_dayIndex];
          let param = squareSectionParams[squareSectionIndex];
          let value = day[param][units.value];
          if (
            ($settings.primaryTargetAsBackup === 1 && value === 0) ||
            ($settings.primaryTargetAsBackup === 1 && value === null)
          ) {
            param = $settings.primaryTarget;
            value = day[param][units.value];
          }
          let gaugeId = getTargetParentGaugeId(param);
          color = getColorInfo(gaugeId, value).hex;
        } else {
          color = $settings.additionalSquaresColor;
        }
        square.push({
          color,
          x,
          y,
          isWeatherSquare,
          dayIndex: _dayIndex,
        });
        if (
          (squareSectionIndex + 1) % $settings.squareSize === 0 &&
          squareSectionIndex !== 0
        ) {
          x = xStart;
          y += SQUARE_SECTION_SIZE;
        } else {
          x += SQUARE_SECTION_SIZE;
        }
      }
      sections.push(square);
    }
    sections = sections;
  }

  $: filterTargets = [
    ...new Set(
      getSquareSectionTargetIds(
        $settings.squareSize * $settings.squareSize,
        $settings.primaryTarget,
        $settings.secondaryTargets,
      ),
    ),
  ];

  function getHeight(
    _needsExtraWeek,
    _weeksInLongestMonth,
    _monthPadding,
    _dimensionsHeight,
    _squareSize,
  ) {
    let extra = _needsExtraWeek ? 1 : 0;
    let height =
      _dimensionsHeight *
        (_weeksInLongestMonth + extra) *
        _squareSize *
        SQUARE_SECTION_SIZE +
      (_dimensionsHeight - 1) * _monthPadding -
      _dimensionsHeight * _squareSize * SQUARE_SECTION_SIZE; // I don't understand the minus bit at the end but it works
    return height;
  }

  function getSquaresPerMonth(_daysInLongestMonth, _needsExtraWeek) {
    let days = _daysInLongestMonth;
    if (_needsExtraWeek) days += WEEK_LENGTH;
    if (days % WEEK_LENGTH === 0) return days;
    days = WEEK_LENGTH - (days % WEEK_LENGTH) + days;
    return days;
  }

  function getNeedsExtraWeek(_months) {
    return _months.some((month) => {
      if (month.days === 31) return month.start > 4;
      if (month.days === 30) return month.start > 5;
    });
  }

  function getWeeksInLongestMonth(_squaresPerMonth) {
    let weeks = _squaresPerMonth / WEEK_LENGTH;
    return weeks;
  }

  function getExtraSquares(_squaresPerMonth, _months, _weekStart) {
    let data = [];
    let max = _squaresPerMonth;
    months.forEach((month, index) => {
      let days = [
        ...weather.rawData.filter(
          (day) =>
            day.date.getFullYear() === month.year &&
            day.date.getMonth() === month.month,
        ),
      ];
      let start =
        month.start - _weekStart < 0
          ? WEEK_LENGTH + (month.start - _weekStart)
          : month.start - _weekStart;
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
  }
</script>

{#if weather.data}
  <svg
    id="preview-svg-image"
    class="max-h-[80svh] mx-auto"
    aria-hidden="true"
    viewBox="0 0 {width} {height}"
    bind:this={svg}
    on:click={(e) => {
      if (e.target.tagName !== 'rect') return;
      const group = e.target.parentElement;
      if (group.tagName !== 'g') return;

      if (group.dataset.isweathersquare === 'true') {
        let index = +group.dataset.dayindex;
        weather.currentIndex = index;

        showPreviewImageWeatherDetails(targets);
      }
    }}
  >
    {#each sections as square}
      <g
        data-isweathersquare={square[0].isWeatherSquare}
        data-dayindex={square[0].dayIndex}
      >
        {#each square as { color, x, y }}
          <rect
            width={SQUARE_SECTION_SIZE}
            height={SQUARE_SECTION_SIZE}
            fill={color}
            {x}
            {y}
          />
        {/each}
      </g>
    {/each}
  </svg>
{/if}
