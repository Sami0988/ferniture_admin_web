import { baseApi } from '../baseApi';
import { transformPaginatedResponse } from '@/lib/api-transforms';
import type { ApiUser, CreateUserRequest, UpdateUserRequest, ApiResponse, PaginatedResponse } from '@/types/api';

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<PaginatedResponse<ApiUser>, { page?: number; limit?: number }>({
      query: (params) => ({
        url: '/users',
        params,
      }),
      transformResponse: transformPaginatedResponse,
      providesTags: ['User'],
    }),

    getCurrentUser: builder.query<ApiResponse<ApiUser>, void>({
      query: () => '/users/me',
      providesTags: ['User'],
    }),

    getUserById: builder.query<ApiResponse<ApiUser>, string>({
      query: (id) => `/users/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'User', id }],
    }),

    createUser: builder.mutation<ApiResponse<ApiUser>, CreateUserRequest>({
      query: (body) => ({
        url: '/users',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
    }),

    updateUser: builder.mutation<ApiResponse<ApiUser>, { id: string; data: UpdateUserRequest }>({
      query: ({ id, data }) => ({
        url: `/users/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'User', id }, 'User'],
    }),

    deleteUser: builder.mutation<void, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetCurrentUserQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = usersApi;
