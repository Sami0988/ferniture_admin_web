import { baseApi } from '../baseApi';
import type { ContactInfo, UpdateContactInfoRequest, ApiResponse } from '@/types/api';

export const contactInfoApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getContactInfo: builder.query<ApiResponse<ContactInfo>, void>({
      query: () => '/admin/contact-info',
      providesTags: ['ContactInfo'],
    }),

    updateContactInfo: builder.mutation<ApiResponse<ContactInfo>, UpdateContactInfoRequest>({
      query: (body) => ({
        url: '/admin/contact-info',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['ContactInfo'],
    }),
  }),
});

export const { useGetContactInfoQuery, useUpdateContactInfoMutation } = contactInfoApi;
