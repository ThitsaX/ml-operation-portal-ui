import { getAllParticipantUsers } from '@services/participant'
import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { type IApiErrorResponse, type IParticipantUser } from '@typescript/services'

export const useGetAllParticipants = (
  options?: UseQueryOptions<IParticipantUser[],
  IApiErrorResponse
  >
) =>
  useQuery<IParticipantUser[], IApiErrorResponse>({
    queryKey: ['getAllParticipantUsers'],
    queryFn: getAllParticipantUsers,
    ...options
  })
