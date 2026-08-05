// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import {
  getUserListByParticipant, getParticipantListIncludingHub, getRoleListByParticipant, getOrganizationListByParticipant, getContactList, getParticipantProfile,
  getParticipantCurrencyList, getHubCurrency, getLiquidityProfileList, getParticipantList,
  getParticipantPositionList,
  getRoleList,
  getParticipantCurrencyListByDfspId,
  getParticipantListByDirectIndirect,
  getDfspVisualConfigList,
} from '@services/participant'
import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import {
  type IApiErrorResponse, type IParticipantUser,
  type IBusinessContact, type ILiquidityProfile, type ICurrency,
  type IParticipantProfile,
  IParticipantOrganization,
  type IParticipantPositionData,
  type IParticipantUserRole,
  type IThresholdDetail,
} from '@typescript/services'


export const useGetUserListByParticipant = (
  options?: UseQueryOptions<IParticipantUser[],
    IApiErrorResponse
  >
) =>
  useQuery<IParticipantUser[], IApiErrorResponse>({
    queryKey: ['getUserListByParticipant'],
    queryFn: getUserListByParticipant,
    ...options
  })

export const useGetRoleList = (
  options?: UseQueryOptions<IParticipantUserRole[],
    IApiErrorResponse
  >
) =>
  useQuery<IParticipantUserRole[], IApiErrorResponse>({
    queryKey: ['getRoleList'],
    queryFn: getRoleList,
    ...options
  })



export const useGetOrganizationListByParticipant = (
  options?: UseQueryOptions<IParticipantOrganization[],
    IApiErrorResponse
  >
) =>
  useQuery<IParticipantOrganization[], IApiErrorResponse>({
    queryKey: ['getOrganizationListByParticipant'],
    queryFn: getOrganizationListByParticipant,
    ...options
  })

export const useGetParticipantListIncludingHub = (
  options?: UseQueryOptions<IParticipantOrganization[],
    IApiErrorResponse
  >
  ) =>
  useQuery<IParticipantOrganization[], IApiErrorResponse>({
    queryKey: ['getParticipantListIncludingHub'],
    queryFn: getParticipantListIncludingHub,
    ...options
  })

export const useGetParticipantListByDirectIndirect = (
  options?: UseQueryOptions<IParticipantOrganization[],
    IApiErrorResponse
  >
) =>
  useQuery<IParticipantOrganization[], IApiErrorResponse>({
    queryKey: ['getParticipantListByDirectIndirect'],
    queryFn: getParticipantListByDirectIndirect,
    ...options
  })

export const useGetDfspVisualConfigList = (
  options?: UseQueryOptions<IThresholdDetail[],
    IApiErrorResponse
  >
) =>
  useQuery<IThresholdDetail[], IApiErrorResponse>({
    queryKey: ['getDfspVisualConfigList'],
    queryFn: getDfspVisualConfigList,
    ...options
  })
export const useGetParticipantCurrencyList = (
  options?: UseQueryOptions<ICurrency[],
    IApiErrorResponse
  >
) =>
  useQuery<ICurrency[], IApiErrorResponse>({
    queryKey: ['getParticipantCurrencyList'],
    queryFn: getParticipantCurrencyList,
    ...options
  })

export const useGetParticipantCurrencyListByDfspId = (
  dfspId: string,
  options?: UseQueryOptions<ICurrency[], IApiErrorResponse>
) =>
  useQuery<ICurrency[], IApiErrorResponse>({
    queryKey: ['getParticipantCurrencyListByDfspId', dfspId],
    queryFn: ({ queryKey }) =>
      getParticipantCurrencyListByDfspId(queryKey[1] as string),
    enabled: Boolean(dfspId),
    ...options
  })

export const useGetHubCurrency = (
  options?: UseQueryOptions<ICurrency[],
    IApiErrorResponse
  >
) =>
  useQuery<ICurrency[], IApiErrorResponse>({
    queryKey: ['getHubCurrency'],
    queryFn: getHubCurrency,
    ...options
  })

export const useGetContactList = (
  type: string,
  options?: UseQueryOptions<IBusinessContact[], IApiErrorResponse>
) =>
  useQuery<IBusinessContact[], IApiErrorResponse>({
    queryKey: ['getContactList', type],
    queryFn: ({ queryKey }) => getContactList(queryKey[1] as string),
    ...options
  });

export const useGetLiquidityProfileList = (
  type:string,
  options?: UseQueryOptions<ILiquidityProfile[],
    IApiErrorResponse
  >
) =>
  useQuery<ILiquidityProfile[], IApiErrorResponse>({
    queryKey: ['getLiquidityProfileList', type],
    queryFn:({queryKey})=> getLiquidityProfileList(queryKey[1] as string),
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

  export const useGetParticipantPositionList = (
  options?: UseQueryOptions<IParticipantPositionData[], IApiErrorResponse>
) =>
  useQuery<IParticipantPositionData[], IApiErrorResponse>({
    queryKey: ['getParticipantPositionList'],
    queryFn: getParticipantPositionList,
    ...options
  })
