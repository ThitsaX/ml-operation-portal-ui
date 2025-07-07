import { getParticipant } from '@services/company-info'
import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { type IApiErrorResponse } from '@typescript/services'
import { type IGetParticipant } from '@typescript/services/company-info'

export const useGetParticipant = (
  options?: UseQueryOptions<IGetParticipant, IApiErrorResponse>
) =>
  useQuery<IGetParticipant, IApiErrorResponse>({
    queryKey: ['getParticipant'],
    queryFn: getParticipant,
    ...options
  })
