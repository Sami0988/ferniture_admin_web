import { baseApi } from '../baseApi';
import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  MfaVerifyRequest,
  MfaVerifyResponse,
  MfaSetupResponse,
  MfaConfirmRequest,
  MfaDisableRequest,
  MfaRegenerateBackupCodesRequest,
  MfaRegenerateBackupCodesResponse,
  ChangePasswordRequest,
} from '@/types/api';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<ApiResponse<LoginResponse>, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),

    verifyMfa: builder.mutation<ApiResponse<MfaVerifyResponse>, MfaVerifyRequest>({
      query: (body) => ({
        url: '/auth/mfa/verify',
        method: 'POST',
        body,
      }),
    }),

    setupMfa: builder.mutation<ApiResponse<MfaSetupResponse>, void>({
      query: () => ({
        url: '/auth/mfa/setup',
        method: 'POST',
      }),
    }),

    confirmMfa: builder.mutation<ApiResponse<{ backupCodes: string[] }>, MfaConfirmRequest>({
      query: (body) => ({
        url: '/auth/mfa/confirm',
        method: 'POST',
        body,
      }),
    }),

    disableMfa: builder.mutation<ApiResponse<void>, MfaDisableRequest>({
      query: (body) => ({
        url: '/auth/mfa/disable',
        method: 'POST',
        body,
      }),
    }),

    regenerateBackupCodes: builder.mutation<ApiResponse<MfaRegenerateBackupCodesResponse>, MfaRegenerateBackupCodesRequest>({
      query: (body) => ({
        url: '/auth/mfa/regenerate-backup-codes',
        method: 'POST',
        body,
      }),
    }),

    refreshToken: builder.mutation<ApiResponse<{ tokens: { accessToken: string; refreshToken: string } }>, { refreshToken: string }>({
      query: (body) => ({
        url: '/auth/refresh',
        method: 'POST',
        body,
      }),
    }),

    changePassword: builder.mutation<ApiResponse<void>, ChangePasswordRequest>({
      query: (body) => ({
        url: '/auth/change-password',
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

export const {
  useLoginMutation,
  useVerifyMfaMutation,
  useSetupMfaMutation,
  useConfirmMfaMutation,
  useDisableMfaMutation,
  useRegenerateBackupCodesMutation,
  useRefreshTokenMutation,
  useChangePasswordMutation,
  useLogoutMutation,
} = authApi;
