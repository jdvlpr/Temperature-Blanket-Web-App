import type { LocationType, PageLayout, Unit } from '$lib/types';

// User preferences for the web app stored in local storage
type Preferences = {
  disableToastAnalytics: boolean;
  theme: {
    id: string; // `"classic"` or one of the presets in plugins.themes.presets in [tailwind.config.js])
    mode: 'light' | 'dark' | 'system';
  };
  layout: PageLayout;
  units: Unit;
};

export const preferences = persistedState<Preferences>('preferences', {
  disableToastAnalytics: false,
  theme: {
    id: 'classic',
    mode: 'system',
  },
  layout: 'list',
  units: 'imperial',
});

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
