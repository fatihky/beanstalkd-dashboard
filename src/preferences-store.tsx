import type { ColumnVisibilityState, SortingState } from '@tanstack/react-table';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface UserPreferences {
  tubeListColumnVisibility: ColumnVisibilityState;
  tubeListSorting: SortingState;

  setVisibility: (
    list: 'tubeListColumnVisibility',
    state: ColumnVisibilityState,
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
