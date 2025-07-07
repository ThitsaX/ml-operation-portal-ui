import { getDashboardData } from '@services/dashboard'
import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { type IApiErrorResponse, type IGetDashboardData } from '@typescript/services'

export const useGetDashboard = (
  options?: UseQueryOptions<IGetDashboardData, IApiErrorResponse>
) =>
  useQuery<IGetDashboardData, IApiErrorResponse>({
    queryKey: ['getDashboardData'],
    queryFn: getDashboardData,
    ...options
  })
