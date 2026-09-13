import { baseApi } from '../baseApi';
import { transformPaginatedResponse } from '@/lib/api-transforms';
import type {
  BlogPost,
  CreateBlogPostRequest,
  UpdateBlogPostRequest,
  ApiResponse,
  PaginatedResponse,
} from '@/types/api';

function buildBlogFormData(data: Record<string, any>): FormData {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (key === 'mainImage' && value instanceof File) {
      formData.append('mainImage', value);
    } else if (key === 'featureImages' && Array.isArray(value)) {
      value.forEach((file: File) => formData.append('featureImages', file));
    } else if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });
  return formData;
}

export const blogApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBlogPosts: builder.query<
      PaginatedResponse<BlogPost>,
      { page?: number; limit?: number; category?: string; search?: string }
    >({
      query: (params) => ({
        url: '/admin/blog',
        params: {
          ...(params.page != null && { page: String(params.page) }),
          ...(params.limit != null && { limit: String(params.limit) }),
          ...(params.category != null && { category: params.category }),
          ...(params.search != null && { search: params.search }),
        },
      }),
      transformResponse: transformPaginatedResponse,
      providesTags: ['BlogPost'],
    }),

    getBlogPostById: builder.query<ApiResponse<BlogPost>, string>({
      query: (id) => `/admin/blog/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'BlogPost', id }],
    }),

    createBlogPost: builder.mutation<ApiResponse<BlogPost>, CreateBlogPostRequest>({
      query: (body) => ({
        url: '/admin/blog',
        method: 'POST',
        body: buildBlogFormData(body as Record<string, any>),
      }),
      invalidatesTags: ['BlogPost'],
    }),

    updateBlogPost: builder.mutation<
      ApiResponse<BlogPost>,
      { id: string; data: UpdateBlogPostRequest }
    >({
      query: ({ id, data }) => ({
        url: `/admin/blog/${id}`,
        method: 'PATCH',
        body: buildBlogFormData(data as Record<string, any>),
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'BlogPost', id }, 'BlogPost'],
    }),

    deleteBlogPost: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/blog/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['BlogPost'],
    }),
  }),
});

export const {
  useGetBlogPostsQuery,
  useGetBlogPostByIdQuery,
  useCreateBlogPostMutation,
  useUpdateBlogPostMutation,
  useDeleteBlogPostMutation,
} = blogApi;
