import {
  getAllParticipantUsers, getContactList, getParticipantProfile,
  getCurrencyList, getLiquidityProfileList, getParticipantList
} from '@services/participant'
import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import {
  type IApiErrorResponse, type IParticipantUser,
  type IBusinessContact, type ILiquidityProfile, type ICurrency,
  type IParticipantProfile
} from '@typescript/services'

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

export const useGetCurrencyList = (
  options?: UseQueryOptions<ICurrency[],
    IApiErrorResponse
  >
) =>
  useQuery<ICurrency[], IApiErrorResponse>({
    queryKey: ['getCurrencyList'],
    queryFn: getCurrencyList,
    ...options
  })

export const useGetParticipantProfile = (
  options?: UseQueryOptions<IParticipantProfile,
    IApiErrorResponse
  >
) =>
  useQuery<IParticipantProfile, IApiErrorResponse>({
    queryKey: ['getParticipantProfile'],
    queryFn: getParticipantProfile,
    ...options
  })

export const useGetContactList = (
  type?: string,
  options?: UseQueryOptions<IBusinessContact[], IApiErrorResponse>
) =>
  useQuery<IBusinessContact[], IApiErrorResponse>({
    queryKey: ['getContactList', type],
    queryFn: ({ queryKey }) => getContactList(queryKey[1] as string),
    ...options
  });



export const useGetLiquidityProfileList = (
  options?: UseQueryOptions<ILiquidityProfile[],
    IApiErrorResponse
  >
) =>
  useQuery<ILiquidityProfile[], IApiErrorResponse>({
    queryKey: ['getLiquidityProfileList'],
    queryFn: getLiquidityProfileList,
    ...options
  })
export const useGetParticipantList = (
  options?: UseQueryOptions<IParticipantProfile[],
    IApiErrorResponse
  >
) =>
  useQuery<IParticipantProfile[], IApiErrorResponse>({
    queryKey: ['getParticipantList'],
    queryFn: getParticipantList,
    ...options
  })


