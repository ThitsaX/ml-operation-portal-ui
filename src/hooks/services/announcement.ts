import { getAllAnnouncement } from '@services/announcement'
import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { type AnnouncementInfo, type IApiErrorResponse } from '@typescript/services'

export const useGetAllAnnouncement = (
  options?: UseQueryOptions<AnnouncementInfo[], IApiErrorResponse>
) =>
  useQuery<AnnouncementInfo[], IApiErrorResponse>({
    queryKey: ['getAllAnnouncement'],
    queryFn: getAllAnnouncement,
    ...options
  })
