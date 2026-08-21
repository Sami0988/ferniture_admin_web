'use client';

import { useRef } from 'react';
import { Provider } from 'react-redux';
import { makeStore, AppStore } from '@/store';
import { setCalendar } from './uiSlice';
import type { CalendarType } from './uiSlice';

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore>(null);
  if (storeRef.current == null) {
    storeRef.current = makeStore();
    // Hydrate calendar from localStorage synchronously before first render
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('kw_calendar') as CalendarType | null;
      if (stored && stored !== storeRef.current.getState().ui.calendar) {
        storeRef.current.dispatch(setCalendar(stored));
      }
    }
  }

  return <Provider store={storeRef.current}>{children}</Provider>;
}
