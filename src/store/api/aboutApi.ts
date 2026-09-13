import { baseApi } from '../baseApi';
import type { AboutPage, UpdateAboutRequest, ApiResponse } from '@/types/api';

export const aboutApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAboutPage: builder.query<ApiResponse<AboutPage>, void>({
      query: () => '/admin/about',
      providesTags: ['About'],
    }),

    updateAboutPage: builder.mutation<ApiResponse<AboutPage>, UpdateAboutRequest>({
      query: (body) => ({
        url: '/admin/about',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['About'],
    }),
  }),
});

export const { useGetAboutPageQuery, useUpdateAboutPageMutation } = aboutApi;
