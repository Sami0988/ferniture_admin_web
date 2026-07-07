import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  sidebarCollapsed: boolean;
  activeView: 'list' | 'kanban';
  darkMode: boolean;
}

const initialState: UiState = {
  sidebarCollapsed: false,
  activeView: 'kanban',
  darkMode: false,
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
  },
});

export const { toggleSidebar, setSidebarCollapsed, setActiveView, toggleDarkMode } = uiSlice.actions;
export default uiSlice.reducer;
