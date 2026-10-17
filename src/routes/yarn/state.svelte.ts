import { TemperatureGauge } from '#lib/state/gauges/temperature-gauge-state.svelte.js';
import { HistoryStateClass } from '#lib/state/project-state.svelte.js';
import type { Color } from '#lib/types/yarn-types.js';
import {
  getYarnPageURL,
  getPaletteFallbackName,
  sameColorList,
} from '#lib/utils/color-utils.js';
import { showHistoryChange } from '#lib/utils/feedback.svelte.js';
import {
  changedColorIndex,
  describeGaugeChange,
  historyToast,
} from '#lib/utils/history-utils.svelte.js';
import {
  closePalette,
  openPalette,
  paletteAutosave,
  paletteChanged,
} from './autosave.svelte';

class YarnState {
  gauge = $state(new TemperatureGauge());
  /**
   * A name for the palette that came with it (opened from the gallery), and
   * the colors it names: Save Palette offers it only while the colors are
   * still those, since other colors are another palette.
   */
  suggestion = $state.raw<{ name: string; colors: Color[] } | null>(null);

  /** The colors as they've been, to undo and redo: each one JSON, with names */
  history = new HistoryStateClass();

  /** Until the page has the colors from its link: nothing goes into history */
  loading = $state(true);

  /** The suggested name, if it's for these colors */
  suggestedNameFor(colors: Color[]) {
    return this.suggestion && sameColorList(this.suggestion.colors, colors)
      ? this.suggestion.name
      : '';
  }

  /** The open palette's name, or what shows in its place */
  get title() {
    return (
      paletteAutosave.name ||
      this.suggestedNameFor(this.gauge.colors) ||
      getPaletteFallbackName(this.gauge.colors)
    );
  }

  /** History starts over from the colors now (opening another palette) */
  startHistory() {
    this.history.stack = [this.#entry()];
    this.history.currentIndex = 0;
    this.showInAddressBar();
  }

  /**
   * A new palette, as on a fresh visit (the Palette menu's New Palette, and
   * after Move to Trash). After a saved palette, history starts over; after
   * one that isn't saved, it's one more step, so Undo brings it back.
   */
  startNew() {
    const wasSaved = Boolean(paletteAutosave.id);
    this.gauge = new TemperatureGauge();
    this.suggestion = null;
    closePalette();
    if (wasSaved) this.startHistory();
    else {
      const entry = this.#entry();
      if (entry !== this.history.current) this.history.push(entry);
      this.showInAddressBar();
    }
  }

  /** One of My Palettes, open here in place of this one, with its own history */
  async openSaved(id: string, colors: Color[]) {
    this.gauge.updateColors({ colors });
    this.gauge.schemeId = 'Custom';
    this.suggestion = null;
    this.startHistory();
    await openPalette(id);
  }

  /** Called a moment after the colors change: one undo step */
  updateHistory() {
    if (this.loading) return;
    const entry = this.#entry();
    if (entry === this.history.current) return;
    this.history.push(entry);
    this.showInAddressBar();
    paletteChanged();
  }

  loadFromHistory({ action }: { action: 'Undo' | 'Redo' }) {
    const before = this.history.current;
    if (action === 'Undo') this.history.undo();
    else this.history.redo();
    const after = this.history.current;
    if (!before || !after || before === after) return;

    const was: Color[] = JSON.parse(before);
    const now: Color[] = JSON.parse(after);
    this.gauge.updateColors({ colors: now });
    this.gauge.schemeId = 'Custom';
    this.showInAddressBar();
    paletteChanged();

    const index = changedColorIndex(
      was.map((color) => color?.hex),
      now.map((color) => color?.hex),
    );
    showHistoryChange({
      gaugeId: this.gauge.id,
      indices: index === null ? [] : [index],
      preview: false,
    });
    const change = describeGaugeChange({ colors: was }, { colors: now });
    historyToast(
      action,
      change ? `${change[0].toUpperCase()}${change.slice(1)}` : 'Colors',
    );
  }

  #entry() {
    return JSON.stringify($state.snapshot(this.gauge.colors));
  }

  /** The address bar holds the colors, so a reload or a copied link keeps them */
  showInAddressBar() {
    if (typeof window === 'undefined') return;
    let href = getYarnPageURL({
      colors: $state.snapshot(this.gauge.colors),
      origin: '',
    });
    // The gallery name stays with the link while the colors are its
    const name = this.suggestedNameFor(this.gauge.colors);
    if (name) href += `&name=${encodeURIComponent(name)}`;
    href += window.location.hash;
    const { pathname, search, hash } = window.location;
    if (href !== pathname + search + hash)
      window.history.replaceState(window.history.state, '', href);
  }
}

export const yarnPageState = new YarnState();
