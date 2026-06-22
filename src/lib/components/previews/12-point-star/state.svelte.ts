// Copyright (c) 2024 - 2026, Thomas (https://github.com/jdvlpr)

// This file is part of Temperature-Blanket-Web-App.

// Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
// under the terms of the GNU General Public License as published by the Free Software Foundation,
// either version 3 of the License, or (at your option) any later version.

// Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
// without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
// See the GNU General Public License for more details.

// You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App.
// If not, see <https://www.gnu.org/licenses/>.

import { CHARACTERS_FOR_URL_HASH } from '$lib/constants/page-constants';
import { gauges } from '$lib/state/gauges-state.svelte';
import { previews } from '$lib/state/preview-state.svelte';
import { weather } from '$lib/state/weather-state.svelte';
import type { WeatherParam } from '$lib/types/gauge-types';
import type { BasePreviewSettings } from '$lib/types/preview-types';
import type { Color } from '$lib/types/yarn-types';
import { setTargets } from '$lib/utils/preview-utils.svelte';
import chroma from 'chroma-js';
import Preview from './Preview.svelte';
import Settings from './Settings.svelte';

interface TwelvePointStarPreviewSettings extends BasePreviewSettings {
  selectedTargets: WeatherParam['id'][];
  sharpness: number; // 1-20, controls star pointiness (divided by 50 for actual ratio)
  centerSize: number; // multiplier of STITCH_SIZE for center star radius
  additionalRoundsColor: Color['hex'];
  showBorder: boolean;
  borderThickness: number;
  borderColor: Color['hex'];
}

export class TwelvePointStarPreviewClass {
  constructor() {
    $effect.root(() => {
      // If a gauge is created or deleted, handle updating the available weather parameter targets
      $effect(() => {
        if (gauges.allCreated.length) {
          this.settings.selectedTargets = setTargets(
            this.settings.selectedTargets,
          );
        }
      });
    });
  }

  // *******************
  // Constant properties
  // *******************
  name = '12-Point Star';

  id = 'twsr';

  svg = $state();

  img = {
    light: './images/preview_icons/12 Point Star.png',
    dark: './images/preview_icons/12 Point Star White.png',
  };

  wpTagId = 16;

  wpTagSlug = '12-point-star';

  settingsComponent = Settings;

  previewComponent = Preview;

  sections = $state<
    {
      points: string;
      color: string;
      isWeather: boolean;
      dayIndex: number;
    }[]
  >([]);

  STITCH_SIZE = 10;

  NUM_POINTS = 12;

  // *******************
  // User settings properties
  // *******************
  settings = $state<TwelvePointStarPreviewSettings>({
    selectedTargets: ['tmax'],
    sharpness: 5,
    centerSize: 1,
    additionalRoundsColor: '#f0f3f3',
    showBorder: false,
    borderThickness: 2,
    borderColor: '#f0f3f3',
    useSeasonTargets: false, // Not implemented yet
  });

  // *******************
  // Derived properties
  // *******************

  /** Group weather data by month, preserving original dayIndex */
  weatherByMonth = $derived.by(() => {
    const months: { dayIndex: number }[][] = Array.from(
      { length: this.NUM_POINTS },
      () => [],
    );
    for (let i = 0; i < weather.data.length; i++) {
      const day = weather.data[i];
      const month = day.date.getUTCMonth(); // 0-11
      months[month].push({ dayIndex: i });
    }
    return months;
  });

  /** Max days in any single month in the dataset */
  maxDaysInMonth = $derived(
    Math.max(...this.weatherByMonth.map((m) => m.length), 1),
  );

  /** Max rows in any single point (month days * number of parameters) */
  maxRows = $derived(
    this.maxDaysInMonth * this.settings.selectedTargets.length,
  );

  /** Sharpness as float*/
  sharpnessFloat = $derived(this.settings.sharpness / 50);

  /** Center star peak radius (at star point tips) */
  centerPeakR = $derived(
    this.settings.centerSize * this.STITCH_SIZE * (1 + this.sharpnessFloat),
  );

  /** Center star valley radius (between star points) */
  centerValleyR = $derived(
    this.settings.centerSize * this.STITCH_SIZE * (1 - this.sharpnessFloat),
  );

  /** How much the peak radius grows per row */
  peakStep = $derived(this.STITCH_SIZE * (1 + this.sharpnessFloat));

  /** How much the valley radius grows per row */
  valleyStep = $derived(this.STITCH_SIZE * (1 - this.sharpnessFloat));

  /** Outermost peak radius */
  outerPeakR = $derived(this.centerPeakR + this.maxRows * this.peakStep);

  /** Outermost valley radius */
  outerValleyR = $derived(this.centerValleyR + this.maxRows * this.valleyStep);

  /** Pre-computed SVG polygon points for the center star shape */
  centerStarPoints = $derived.by(() => {
    const cx = this.width / 2;
    const cy = this.height / 2;
    const totalVertices = this.NUM_POINTS * 2;
    const points: string[] = [];
    for (let i = 0; i < totalVertices; i++) {
      const angle =
        (Math.PI / this.NUM_POINTS) * i -
        Math.PI / 2 +
        Math.PI / this.NUM_POINTS;
      const r = i % 2 === 0 ? this.centerPeakR : this.centerValleyR;
      points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
    }
    return points.join(' ');
  });

  /** Pre-computed SVG polygon points for the outer border star shape */
  borderStarPoints = $derived.by(() => {
    const cx = this.width / 2;
    const cy = this.height / 2;
    const totalVertices = this.NUM_POINTS * 2;
    const points: string[] = [];
    for (let i = 0; i < totalVertices; i++) {
      const angle =
        (Math.PI / this.NUM_POINTS) * i -
        Math.PI / 2 +
        Math.PI / this.NUM_POINTS;
      const r = i % 2 === 0 ? this.outerPeakR : this.outerValleyR;
      points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
    }
    return points.join(' ');
  });

  /** Total SVG width */
  width = $derived.by(() => {
    let ext = 0;
    if (this.settings.showBorder) {
      const rp = this.outerPeakR;
      const rv = this.outerValleyR;
      const angleRad = Math.PI / 12; // 15 degrees
      const sinAngle = Math.sin(angleRad);
      const cosAngle = Math.cos(angleRad);
      const d = Math.sqrt(rp * rp + rv * rv - 2 * rp * rv * cosAngle);
      if (d !== 0) {
        const sinHalfTheta = (rv * sinAngle) / d;
        if (sinHalfTheta !== 0) {
          const halfStrokeWidth = this.settings.borderThickness * this.STITCH_SIZE;
          ext = halfStrokeWidth / sinHalfTheta;
        }
      }
    }
    return Math.ceil((this.outerPeakR + ext) * 2 + this.STITCH_SIZE * 4);
  });

  /** Total SVG height */
  height = $derived(this.width);

  targets = $derived(
    gauges.allCreated
      .map((n) => n.targets)
      .flat()
      .filter((n) => this.settings.selectedTargets.includes(n.id)),
  );

  // *******************
  // URL hash derived from settings
  // *******************
  hash = $derived.by(() => {
    let hash = '&';
    hash += `${this.id}=`;
    hash += `${this.settings.selectedTargets.join('')}`;
    hash += '(';
    hash += `${this.settings.sharpness}${CHARACTERS_FOR_URL_HASH.separator}${this.settings.centerSize}${CHARACTERS_FOR_URL_HASH.separator}${chroma(this.settings.additionalRoundsColor).hex().substring(1)}`;
    if (this.settings.showBorder) {
      hash += `${CHARACTERS_FOR_URL_HASH.separator}1${CHARACTERS_FOR_URL_HASH.separator}${this.settings.borderThickness}${CHARACTERS_FOR_URL_HASH.separator}${chroma(this.settings.borderColor).hex().substring(1)}`;
    }
    hash += ')';
    return hash;
  });

  // *******************
  // Method for loading settings from a url hash string
  // *******************
  load(hash: string) {
    const openParen = hash.indexOf('(');
    const closeParen = hash.indexOf(')');

    // If either parenthesis is missing or in the wrong order, stop
    if (openParen === -1 || closeParen === -1 || closeParen < openParen) return;

    // Extract the part before the parentheses as targets
    const targetsStr = hash.substring(0, openParen);
    const targets = targetsStr.match(/.{1,4}/g);
    if (targets && targets.length) {
      this.settings.selectedTargets = targets;
    }

    // Set the current active id to this
    previews.activeId = this.id;

    // Extract the content inside the parentheses
    const innerContent = hash.substring(openParen + 1, closeParen);

    // Split the content by known separators
    const separators = [
      CHARACTERS_FOR_URL_HASH.separator,
      CHARACTERS_FOR_URL_HASH.separator_alt,
    ];

    let parts = null;

    for (const sep of separators) {
      if (innerContent.includes(sep)) {
        parts = innerContent.split(sep);
        break;
      }
    }

    // If no valid separator found or not enough parts, stop
    if (!parts || parts.length < 3) return;

    // Destructure parts into named settings
    const [
      sharpness,
      centerSize,
      additionalRoundsColor,
      showBorder,
      borderThickness,
      borderColor,
    ] = parts;

    // Try parsing each setting safely
    if (Number.isFinite(+sharpness)) this.settings.sharpness = +sharpness;
    if (Number.isFinite(+centerSize)) this.settings.centerSize = +centerSize;

    if (
      typeof additionalRoundsColor !== 'undefined' &&
      additionalRoundsColor !== null &&
      additionalRoundsColor !== ''
    ) {
      try {
        this.settings.additionalRoundsColor = chroma(
          additionalRoundsColor,
        ).hex();
      } catch (e) {
        console.warn('Invalid color value in hash:', additionalRoundsColor);
      }
    }

    if (
      showBorder !== undefined &&
      (showBorder === '1' || showBorder === '0')
    ) {
      this.settings.showBorder = showBorder === '1';
    } else {
      this.settings.showBorder = false;
    }
    if (borderThickness !== undefined && Number.isFinite(+borderThickness)) {
      this.settings.borderThickness = +borderThickness;
    }
    if (
      typeof borderColor !== 'undefined' &&
      borderColor !== null &&
      borderColor !== ''
    ) {
      try {
        this.settings.borderColor = chroma(borderColor).hex();
      } catch (e) {
        console.warn('Invalid border color value in hash:', borderColor);
      }
    }
  }
}

export const twelvePointStarPreview = new TwelvePointStarPreviewClass();
