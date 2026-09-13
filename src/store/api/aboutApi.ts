import { baseApi } from '../baseApi';
import type { AboutPage, UpdateAboutRequest, ApiResponse } from '@/types/api';

function buildAboutFormData(data: Record<string, any>): FormData {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (key === 'image' && value instanceof File) {
      formData.append('image', value);
    } else if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });
  return formData;
}

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
        body: buildAboutFormData(body as Record<string, any>),
      }),
      invalidatesTags: ['About'],
    }),
  }),
});

export const { useGetAboutPageQuery, useUpdateAboutPageMutation } = aboutApi;
