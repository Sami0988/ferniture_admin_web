import { baseApi } from '../baseApi';
import type { LoginRequest, LoginResponse, ApiResponse } from '@/types/api';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<ApiResponse<LoginResponse>, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),

    refreshToken: builder.mutation<ApiResponse<{ tokens: { accessToken: string; refreshToken: string } }>, { refreshToken: string }>({
      query: (body) => ({
        url: '/auth/refresh',
        method: 'POST',
        body,
      }),
    }),

    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
    }),
  }),
});

export const { useLoginMutation, useRefreshTokenMutation, useLogoutMutation } = authApi;
