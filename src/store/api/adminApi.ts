import { baseApi } from '../baseApi';
import { transformPaginatedResponse } from '@/lib/api-transforms';
import type {
  WebsiteProduct,
  CreateProductRequest,
  UpdateProductRequest,
  WebsiteGallery,
  WebsiteTestimonial,
  WebsiteContact,
  WebsiteQuote,
  WebsiteFaq,
  CreateFaqRequest,
  UpdateFaqRequest,
  ApiResponse,
  PaginatedResponse,
} from '@/types/api';

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Products
    getProducts: builder.query<PaginatedResponse<WebsiteProduct>, { page?: number; limit?: number }>({
      query: (params) => ({
        url: '/admin/products',
        params,
      }),
      transformResponse: transformPaginatedResponse,
      providesTags: ['Product'],
    }),

    createProduct: builder.mutation<ApiResponse<WebsiteProduct>, CreateProductRequest>({
      query: (body) => ({
        url: '/admin/products',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Product'],
    }),

    updateProduct: builder.mutation<ApiResponse<WebsiteProduct>, { id: string; data: UpdateProductRequest }>({
      query: ({ id, data }) => ({
        url: `/admin/products/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Product', id }, 'Product'],
    }),

    deleteProduct: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Product'],
    }),

    // Gallery
    addGalleryImage: builder.mutation<ApiResponse<WebsiteGallery>, { imageUrl: string; caption?: string; category: string }>({
      query: (body) => ({
        url: '/admin/gallery',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Gallery'],
    }),

    updateGalleryImage: builder.mutation<ApiResponse<WebsiteGallery>, { id: string; data: Partial<WebsiteGallery> }>({
      query: ({ id, data }) => ({
        url: `/admin/gallery/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Gallery', id }, 'Gallery'],
    }),

    toggleGalleryFeatured: builder.mutation<ApiResponse<WebsiteGallery>, string>({
      query: (id) => ({
        url: `/admin/gallery/${id}/feature`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Gallery'],
    }),

    deleteGalleryImage: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/gallery/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Gallery'],
    }),

    // Testimonials
    getTestimonials: builder.query<ApiResponse<WebsiteTestimonial[]>, void>({
      query: () => '/admin/testimonials',
      providesTags: ['Testimonial'],
    }),

    approveTestimonial: builder.mutation<ApiResponse<WebsiteTestimonial>, string>({
      query: (id) => ({
        url: `/admin/testimonials/${id}/approve`,
        method: 'PATCH',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Testimonial', id }, 'Testimonial'],
    }),

    toggleTestimonialFeatured: builder.mutation<ApiResponse<WebsiteTestimonial>, string>({
      query: (id) => ({
        url: `/admin/testimonials/${id}/feature`,
        method: 'PATCH',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Testimonial', id }, 'Testimonial'],
    }),

    deleteTestimonial: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/testimonials/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Testimonial'],
    }),

    // Contact
    getContacts: builder.query<PaginatedResponse<WebsiteContact>, { page?: number; limit?: number }>({
      query: (params) => ({
        url: '/admin/contact',
        params,
      }),
      transformResponse: transformPaginatedResponse,
      providesTags: ['Contact'],
    }),

    updateContactStatus: builder.mutation<ApiResponse<WebsiteContact>, { id: string; status: string }>({
      query: ({ id, status }) => ({
        url: `/admin/contact/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Contact', id }, 'Contact'],
    }),

    // Quotes
    getQuotes: builder.query<PaginatedResponse<WebsiteQuote>, { page?: number; limit?: number }>({
      query: (params) => ({
        url: '/admin/quotes',
        params,
      }),
      transformResponse: transformPaginatedResponse,
      providesTags: ['Quote'],
    }),

    updateQuoteStatus: builder.mutation<ApiResponse<WebsiteQuote>, { id: string; status: string }>({
      query: ({ id, status }) => ({
        url: `/admin/quotes/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Quote', id }, 'Quote'],
    }),

    // FAQs
    getFaqs: builder.query<ApiResponse<WebsiteFaq[]>, void>({
      query: () => '/admin/faqs',
      providesTags: ['Faq'],
    }),

    createFaq: builder.mutation<ApiResponse<WebsiteFaq>, CreateFaqRequest>({
      query: (body) => ({
        url: '/admin/faqs',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Faq'],
    }),

    updateFaq: builder.mutation<ApiResponse<WebsiteFaq>, { id: string; data: UpdateFaqRequest }>({
      query: ({ id, data }) => ({
        url: `/admin/faqs/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Faq', id }, 'Faq'],
    }),

    deleteFaq: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/faqs/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Faq'],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useAddGalleryImageMutation,
  useUpdateGalleryImageMutation,
  useToggleGalleryFeaturedMutation,
  useDeleteGalleryImageMutation,
  useGetTestimonialsQuery,
  useApproveTestimonialMutation,
  useToggleTestimonialFeaturedMutation,
  useDeleteTestimonialMutation,
  useGetContactsQuery,
  useUpdateContactStatusMutation,
  useGetQuotesQuery,
  useUpdateQuoteStatusMutation,
  useGetFaqsQuery,
  useCreateFaqMutation,
  useUpdateFaqMutation,
  useDeleteFaqMutation,
} = adminApi;
