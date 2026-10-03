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

/** Sound, vibration, and motion feedback settings */
export type EffectsPreferences = {
  /** Play small sounds on actions like moving colors or saving */
  sound: boolean;
  /** Vibrate on supporting devices (in practice, Android phones) */
  haptics: boolean;
  /** `'system'` follows the device's Reduce Motion setting; `'reduce'` always reduces motion */
  motion: 'system' | 'reduce';
};

export const DEFAULT_EFFECTS: EffectsPreferences = {
  sound: true,
  haptics: true,
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
  /** Sound, vibration, and motion settings; missing until first changed */
  effects?: EffectsPreferences;
  /** The yarn chosen first where none is, as `{brandId}-{yarnId}`; missing or `''` for none */
  defaultYarn?: string;
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

  try {
    const item = storageArea?.getItem(key);
    storedValue = item ? beforeRead(serializer.parse(item)) : initialValue;
  } catch (error) {
    onParseError(error);
    storedValue = initialValue;
  }

  let state = $state(storedValue);

  function updateStorage(value: T) {
    try {
      const valueToStore = beforeWrite(value);
      storageArea?.setItem(key, serializer.stringify(valueToStore));
    } catch (error) {
      onWriteError(error);
    }
  }

  if (syncTabs && typeof window !== 'undefined' && storage === 'local') {
    window.addEventListener('storage', (event) => {
      if (event.key === key && event.storageArea === localStorage) {
        try {
          const newValue = event.newValue
            ? serializer.parse(event.newValue)
            : initialValue;
          state = beforeRead(newValue);
        } catch (error) {
          onParseError(error);
        }
      }
    });
  }

  $effect.root(() => {
    $effect(() => {
      updateStorage(state);
    });

    return () => {};
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
