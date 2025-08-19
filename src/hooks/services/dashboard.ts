import { getDashboardData } from '@services/dashboard'
import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { type IApiErrorResponse, type IParticipantPositionData } from '@typescript/services'


export const useGetDashboard = (
  options?: UseQueryOptions<IParticipantPositionData[], IApiErrorResponse>
) =>
  useQuery<IParticipantPositionData[], IApiErrorResponse>({
    queryKey: ['getDashboardData'],
    queryFn: getDashboardData,
    ...options
  })

