import { getParticipantPositionList } from '@services/dashboard'
import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { type IApiErrorResponse, type IParticipantPositionData } from '@typescript/services'

export const useGetDashboard = (
  options?: UseQueryOptions<IParticipantPositionData[], IApiErrorResponse>
) =>
  useQuery<IParticipantPositionData[], IApiErrorResponse>({
    queryKey: ['getParticipantPositionList'],
    queryFn: getParticipantPositionList,
    ...options
  })
