import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type CalendarType = 'gc' | 'ec';

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
      state.calendar = state.calendar === 'gc' ? 'ec' : 'gc';
      if (typeof window !== 'undefined') {
        localStorage.setItem('kw_calendar', state.calendar);
      }
    },
    setCalendar: (state, action: PayloadAction<CalendarType>) => {
      state.calendar = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('kw_calendar', action.payload);
      }
    },
  },
});

export const { toggleSidebar, setSidebarCollapsed, setActiveView, toggleDarkMode, toggleCalendar, setCalendar } = uiSlice.actions;
export default uiSlice.reducer;
