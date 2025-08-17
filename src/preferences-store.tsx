import type { VisibilityState } from '@tanstack/react-table';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface UserPreferences {
  tubeListColumnVisibility: VisibilityState;

  setVisibility: (
    list: 'tubeListColumnVisibility',
    state: VisibilityState,
  ) => void;
}

export const usePreferencesStore = create(
  persist<UserPreferences>(
    (set) => ({
      tubeListColumnVisibility: {},

      setVisibility: (list, state) =>
        set({
          [list]: state,
        }),
    }),
    {
      name: 'beanstalkd-ts-console:preferences',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
