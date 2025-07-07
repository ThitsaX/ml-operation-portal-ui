import { getUserProfile } from '@services/user'
import { type IUserProfile } from '@store/features/user'
import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { type IApiErrorResponse } from '@typescript/services'

export const useGetProfile = (
  options?: UseQueryOptions<IUserProfile, IApiErrorResponse>
) =>
  useQuery<IUserProfile, IApiErrorResponse>({
    queryKey: ['getUserProfile'],
    queryFn: getUserProfile,
    ...options
  })
