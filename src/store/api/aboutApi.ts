import { baseApi } from '../baseApi';
import type { AboutPage, UpdateAboutRequest, ApiResponse } from '@/types/api';

export const aboutApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAboutPage: builder.query<ApiResponse<AboutPage>, void>({
      query: () => '/admin/about',
      providesTags: ['About'],
    }),

    updateAboutPage: builder.mutation<ApiResponse<AboutPage>, UpdateAboutRequest>({
      query: (body) => {
        const hasImage = body.image instanceof File;
        if (hasImage) {
          const formData = new FormData();
          Object.entries(body).forEach(([key, value]) => {
            if (key === 'image' && value instanceof File) {
              formData.append('image', value);
            } else if (value !== undefined && value !== null) {
              formData.append(key, String(value));
            }
          });
          return { url: '/admin/about', method: 'PATCH', body: formData };
        }
        return { url: '/admin/about', method: 'PATCH', body };
      },
      invalidatesTags: ['About'],
    }),
  }),
});

export const { useGetAboutPageQuery, useUpdateAboutPageMutation } = aboutApi;
