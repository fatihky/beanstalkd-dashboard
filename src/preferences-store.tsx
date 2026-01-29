import type { SortingState, VisibilityState } from '@tanstack/react-table';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface UserPreferences {
  tubeListColumnVisibility: VisibilityState;
  tubeListSorting: SortingState;

  setVisibility: (
    list: 'tubeListColumnVisibility',
    state: VisibilityState,
  ) => void;
  setSorting: (list: 'tubeListSorting', state: SortingState) => void;
}

export const usePreferencesStore = create(
  persist<UserPreferences>(
    (set) => ({
      tubeListColumnVisibility: {},
      tubeListSorting: [],

      setVisibility: (list, state) =>
        set({
          [list]: state,
        }),
      setSorting: (list, state) =>
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
