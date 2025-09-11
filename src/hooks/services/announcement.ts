import { getAllAnnouncement, getGreetingMessage } from '@services/announcement'
import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { type AnnouncementInfo, type IApiErrorResponse, type IGreetingMessage } from '@typescript/services'

export const useGetAllAnnouncement = (
  options?: UseQueryOptions<AnnouncementInfo[], IApiErrorResponse>
) =>
  useQuery<AnnouncementInfo[], IApiErrorResponse>({
    queryKey: ['getAllAnnouncement'],
    queryFn: getAllAnnouncement,
    ...options
  })


export const useGetGreetingMessage = (
  options?: UseQueryOptions<IGreetingMessage, IApiErrorResponse>
) =>
  useQuery<IGreetingMessage, IApiErrorResponse>({
    queryKey: ['getGreetingMessage'],
    queryFn: getGreetingMessage,
    ...options
  })
