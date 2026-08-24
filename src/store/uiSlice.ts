import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type CalendarType = 'gc' | 'ec' | 'ec-fiscal';

interface UiState {
  sidebarCollapsed: boolean;
  activeView: 'list' | 'kanban';
  darkMode: boolean;
  calendar: CalendarType;
}

const initialState: UiState = {
  sidebarCollapsed: false,
  activeView: 'kanban',
  darkMode: false,
  calendar: 'gc',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    setActiveView: (state, action: PayloadAction<'list' | 'kanban'>) => {
      state.activeView = action.payload;
    },
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark');
      }
    },
    toggleCalendar: (state) => {
      const cycle: Record<string, CalendarType> = { gc: 'ec', ec: 'ec-fiscal', 'ec-fiscal': 'gc' };
      state.calendar = cycle[state.calendar] || 'gc';
      if (typeof window !== 'undefined') {
        localStorage.setItem('kw_calendar', state.calendar);
      }
    },
    setCalendar: (state, action: PayloadAction<CalendarType>) => {
      if (!['gc', 'ec', 'ec-fiscal'].includes(action.payload)) return;
      state.calendar = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('kw_calendar', action.payload);
      }
    },
  },
});

export const { toggleSidebar, setSidebarCollapsed, setActiveView, toggleDarkMode, toggleCalendar, setCalendar } = uiSlice.actions;
export default uiSlice.reducer;
