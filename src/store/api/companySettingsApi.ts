import { baseApi } from '../baseApi';
import type { CompanySetting, CompanyInfo, BulkUpdateSettingsRequest, ApiResponse } from '@/types/api';

export const companySettingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllSettings: builder.query<ApiResponse<CompanySetting[]>, void>({
      query: () => '/company-settings',
      providesTags: ['CompanySetting'],
    }),

    getCompanyInfo: builder.query<ApiResponse<CompanyInfo>, void>({
      query: () => '/company-settings/company-info',
      providesTags: ['CompanySetting'],
    }),

    getSettingByKey: builder.query<ApiResponse<CompanySetting>, string>({
      query: (key) => `/company-settings/${key}`,
      providesTags: (_result, _error, key) => [{ type: 'CompanySetting', id: key }],
    }),

    updateSettings: builder.mutation<ApiResponse<CompanySetting[]>, { key: string; value: string }>({
      query: (body) => ({
        url: '/company-settings',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['CompanySetting'],
    }),

    bulkUpdateSettings: builder.mutation<ApiResponse<CompanySetting[]>, BulkUpdateSettingsRequest>({
      query: (body) => ({
        url: '/company-settings/bulk',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['CompanySetting'],
    }),

    deleteSetting: builder.mutation<void, string>({
      query: (key) => ({
        url: `/company-settings/${key}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['CompanySetting'],
    }),
  }),
});

export const {
  useGetAllSettingsQuery,
  useGetCompanyInfoQuery,
  useGetSettingByKeyQuery,
  useUpdateSettingsMutation,
  useBulkUpdateSettingsMutation,
  useDeleteSettingMutation,
} = companySettingsApi;
