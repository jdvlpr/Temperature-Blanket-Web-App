import type { PaletteImageSettings } from '$lib/features/palette-image/layout';
import type { PageLayout } from '$lib/types/page-types';
import type { Unit } from '$lib/types/weather-types';
import { DEFAULT_SEASONS } from '$lib/constants/seasons-constants';

// Season configuration type
type SeasonConfig = {
  id: string;
  label: string;
  startDate: string; // MM-DD format
  endDate: string; // MM-DD format
};

/** Motion feedback settings */
export type EffectsPreferences = {
  /** `'system'` follows the device's Reduce Motion setting; `'reduce'` always reduces motion */
  motion: 'system' | 'reduce';
};

export const DEFAULT_EFFECTS: EffectsPreferences = {
  motion: 'system',
};

// User preferences for the web app stored in local storage
type LocalStatePreferencesType = {
  disableToastAnalytics: boolean;
  layout: PageLayout;
  seasons: SeasonConfig[];
  theme: {
    id: string; // `"classic"` or one of the presets in plugins.themes.presets in [tailwind.config.js])
    mode: 'light' | 'dark' | 'system';
    roundness?: 'sharp' | 'rounded' | 'pill'; // Controls --radius-base and --radius-container
    spacing?: 'compact' | 'normal' | 'relaxed'; // Controls --spacing
    textScale?: 'small' | 'normal' | 'large'; // Controls --text-scaling
    headingStyle?: 'classic' | 'playful' | 'refined'; // Controls heading font-variation-settings
  };
  units: Unit | null;
  /** The palette image export's last settings; missing until first changed */
  paletteImage?: PaletteImageSettings;
  /** Motion settings; missing until first changed */
  effects?: EffectsPreferences;
  /** The yarn chosen first where none is, as `{brandId}-{yarnId}`; missing or `''` for none */
  defaultYarn?: string;
  /** View › Fill with color: colorway cards and rows, and palette colors, take their yarn's color; missing until first changed (off) */
  fillColor?: boolean;
};

export const preferences = persistedState<LocalStatePreferencesType>(
  'preferences',
  {
    disableToastAnalytics: false,
    layout: 'list',
    seasons: DEFAULT_SEASONS,
    theme: {
      id: 'classic',
      mode: 'system',
      roundness: 'pill',
      spacing: 'normal',
      textScale: 'normal',
      headingStyle: 'classic',
    },
    units: null,
  },
);

// The following persisted state functionality was copied from: https://github.com/oMaN-Rod/svelte-persisted-state/blob/main/src/lib/index.svelte.ts
type Serializer<T> = {
  parse: (text: string) => T;
  stringify: (object: T) => string;
};

type StorageType = 'local' | 'session';

interface Options<T> {
  storage?: StorageType;
  serializer?: Serializer<T>;
  syncTabs?: boolean;
  onWriteError?: (error: unknown) => void;
  onParseError?: (error: unknown) => void;
  beforeRead?: (value: T) => T;
  beforeWrite?: (value: T) => T;
}

function getStorage(type: StorageType) {
  return type === 'local' ? localStorage : sessionStorage;
}

export function persistedState<T>(
  key: string,
  initialValue: T,
  options: Options<T> = {},
) {
  const {
    storage = 'local',
    serializer = JSON,
    syncTabs = true,
    onWriteError = console.error,
    onParseError = console.error,
    beforeRead = (v: T) => v,
    beforeWrite = (v: T) => v,
  } = options;

  const browser =
    typeof window !== 'undefined' && typeof document !== 'undefined';
  const storageArea = browser ? getStorage(storage) : null;

  let storedValue: T;
  // What's in storage as far as this tab knows: last read there, written
  // there, or sent by another tab. Never written back, or two tabs could
  // echo each other's changes forever (each passing on the other's older one)
  let synced: string | null = null;

  try {
    const item = storageArea?.getItem(key);
    synced = item ?? null;
    storedValue = item ? beforeRead(serializer.parse(item)) : initialValue;
  } catch (error) {
    onParseError(error);
    storedValue = initialValue;
  }

  let state = $state(storedValue);

  function updateStorage(value: T) {
    try {
      const serialized = serializer.stringify(beforeWrite(value));
      if (serialized === synced) return;
      storageArea?.setItem(key, serialized);
      synced = serialized;
    } catch (error) {
      onWriteError(error);
    }
  }

  // Another tab changed it, or cleared storage: take that, without writing
  // it back
  function onStorage(event: StorageEvent) {
    if (event.storageArea !== localStorage) return;
    try {
      if (event.key === key) {
        synced = event.newValue;
        state = beforeRead(
          event.newValue ? serializer.parse(event.newValue) : initialValue,
        );
      } else if (event.key === null) {
        state = initialValue;
        synced = serializer.stringify(beforeWrite(initialValue));
      }
    } catch (error) {
      onParseError(error);
    }
  }

  const listening =
    syncTabs && typeof window !== 'undefined' && storage === 'local';
  if (listening) window.addEventListener('storage', onStorage);

  const stopSaving = $effect.root(() => {
    $effect(() => {
      updateStorage(state);
    });
  });

  // Replaced when this file changes in development: the old copy stops, or
  // it would keep listening and writing alongside the new one
  import.meta.hot?.dispose(() => {
    if (listening) window.removeEventListener('storage', onStorage);
    stopSaving();
  });

  return {
    get value() {
      return state;
    },
    set value(newValue: T) {
      state = newValue;
    },
    reset() {
      state = initialValue;
    },
  };
}
