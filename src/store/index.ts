import { configureStore, isAnyOf } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { baseApi } from './baseApi';
import authReducer, { logout } from './authSlice';
import uiReducer, { toggleCalendar, setCalendar } from './uiSlice';

export const makeStore = () => {
  const store = configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
      auth: authReducer,
      ui: uiReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      })
        .concat(baseApi.middleware)
        .concat((api) => (next) => (action) => {
          // Process the action first so the reducer updates state
          const result = next(action);
          // Then invalidate tags so the refetch reads the NEW calendar value
          if (isAnyOf(toggleCalendar, setCalendar)(action)) {
            store.dispatch(baseApi.util.invalidateTags(['Calendar']));
          }
          if (isAnyOf(logout)(action)) {
            store.dispatch(baseApi.util.resetApiState());
          }
          return result;
        }),
  });

  return store;
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
