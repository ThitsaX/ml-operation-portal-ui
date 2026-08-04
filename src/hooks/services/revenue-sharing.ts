// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import { getPendingRevenueApprovalList, getRevenueConfigList, getRevenuePartyList, getRevenueRoundingPolicy } from '@services/revenue-sharing';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import {
  type IApiErrorResponse,
  type IRevenueConfig,
  type IRevenuePendingApproval,
  type IRevenueParty,
  type IRevenueRoundingPolicy
} from '@typescript/services';

export const useGetRevenuePartyList = (
  options?: UseQueryOptions<IRevenueParty[], IApiErrorResponse>
) =>
  useQuery<IRevenueParty[], IApiErrorResponse>({
    queryKey: ['getRevenuePartyList'],
    queryFn: getRevenuePartyList,
    ...options
  });

export const useGetRevenueConfigList = (
  options?: UseQueryOptions<IRevenueConfig[], IApiErrorResponse>
) =>
  useQuery<IRevenueConfig[], IApiErrorResponse>({
    queryKey: ['getRevenueConfigList'],
    queryFn: getRevenueConfigList,
    ...options
  });

export const useGetRevenueRoundingPolicy = (
  options?: UseQueryOptions<IRevenueRoundingPolicy, IApiErrorResponse>
) =>
  useQuery<IRevenueRoundingPolicy, IApiErrorResponse>({
    queryKey: ['getRevenueRoundingPolicy'],
    queryFn: getRevenueRoundingPolicy,
    ...options
  });

export const useGetPendingRevenueApprovalList = (
  options?: UseQueryOptions<IRevenuePendingApproval[], IApiErrorResponse>
) =>
  useQuery<IRevenuePendingApproval[], IApiErrorResponse>({
    queryKey: ['getPendingRevenueApprovalList'],
    queryFn: getPendingRevenueApprovalList,
    ...options
  });
