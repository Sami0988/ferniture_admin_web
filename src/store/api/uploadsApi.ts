import { baseApi } from '../baseApi';
import type { UploadResponse, ApiResponse } from '@/types/api';

export const uploadsApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    uploadImage: builder.mutation<ApiResponse<UploadResponse>, File>({
      query: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return {
          url: '/uploads/image',
          method: 'POST',
          body: formData,
        };
      },
    }),

    uploadDocument: builder.mutation<ApiResponse<UploadResponse>, File>({
      query: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return {
          url: '/uploads/document',
          method: 'POST',
          body: formData,
        };
      },
    }),

    deleteFile: builder.mutation<void, string>({
      query: (publicId) => ({
        url: `/uploads/${encodeURIComponent(publicId)}`,
        method: 'DELETE',
      }),
    }),
  }),
});

export const { useUploadImageMutation, useUploadDocumentMutation, useDeleteFileMutation } = uploadsApi;
