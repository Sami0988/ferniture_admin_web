import { baseApi } from '../baseApi';
import { transformPaginatedResponse } from '@/lib/api-transforms';
import type {
  WebsiteProduct,
  ApiResponse,
  PaginatedResponse,
} from '@/types/api';

function buildProductFormData(data: Record<string, any>): FormData {
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

export const productsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<PaginatedResponse<WebsiteProduct>, { page?: number; limit?: number; division?: string; search?: string }>({
      query: (params) => ({
        url: '/admin/products',
        params,
      }),
      transformResponse: transformPaginatedResponse,
      providesTags: ['Product'],
    }),

    createProduct: builder.mutation<ApiResponse<WebsiteProduct>, {
      name: string;
      description?: string;
      price?: number;
      division: string;
      category?: string;
      materialId?: string;
      isFeatured?: boolean;
      isActive?: boolean;
      mainImage?: File;
      featureImages?: File[];
    }>({
      query: (body) => ({
        url: '/admin/products',
        method: 'POST',
        body: buildProductFormData(body),
      }),
      invalidatesTags: ['Product'],
    }),

    updateProduct: builder.mutation<ApiResponse<WebsiteProduct>, {
      id: string;
      data: {
        name?: string;
        description?: string;
        price?: number;
        division?: string;
        category?: string;
        materialId?: string;
        isFeatured?: boolean;
        isActive?: boolean;
        mainImage?: File;
        featureImages?: File[];
      };
    }>({
      query: ({ id, data }) => ({
        url: `/admin/products/${id}`,
        method: 'PATCH',
        body: buildProductFormData(data),
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

    getProductById: builder.query<ApiResponse<WebsiteProduct>, string>({
      query: (id) => `/admin/products/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Product', id }],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetProductByIdQuery,
} = productsApi;
