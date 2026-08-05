// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import {
  getDeliveryLogs,
  getNdcThresholdApprovals,
  getNdcWorkerConfigurationByJobName,
  getSchemeThresholdConfiguration
} from '@services/ndc-configurations';
import {
  type IApiErrorResponse,
  type INdcSchemeConfiguration,
  type INdcDeliveryLogsRequest,
  type INdcDeliveryLogsResponse,
  type INdcThresholdApprovalsRequest,
  type INdcThresholdApprovalsResponse,
  type INdcWorkerConfiguration
} from '@typescript/services';

type NdcQueryOptions<TData> = Omit<
  UseQueryOptions<TData, IApiErrorResponse, TData>,
  'queryKey' | 'queryFn'
>;

export const useGetDeliveryLogs = (
  params: INdcDeliveryLogsRequest,
  options?: NdcQueryOptions<INdcDeliveryLogsResponse>
) =>
  useQuery<INdcDeliveryLogsResponse, IApiErrorResponse, INdcDeliveryLogsResponse>(
    {
      queryKey: ['getDeliveryLogs', params],
      queryFn: () => getDeliveryLogs(params),
      keepPreviousData: true,
      ...options
    }
  );
export const useGetNdcThresholdApprovals = (
  params: INdcThresholdApprovalsRequest,
  options?: NdcQueryOptions<INdcThresholdApprovalsResponse>
) =>
  useQuery<INdcThresholdApprovalsResponse, IApiErrorResponse, INdcThresholdApprovalsResponse>(
    {
      queryKey: ['getNdcThresholdApprovals', params],
      queryFn: () => getNdcThresholdApprovals(params),
      keepPreviousData: true,
      ...options
    }
  );

export const useGetSchemeThresholdConfiguration = (
  options?: NdcQueryOptions<INdcSchemeConfiguration>
) =>
  useQuery<INdcSchemeConfiguration, IApiErrorResponse, INdcSchemeConfiguration>(
    {
      queryKey: ['getSchemeThresholdConfiguration'],
      queryFn: getSchemeThresholdConfiguration,
      ...options
    }
  );

export const useGetNdcWorkerConfigurationByJobName = (
  options?: NdcQueryOptions<INdcWorkerConfiguration>
) =>
  useQuery<INdcWorkerConfiguration, IApiErrorResponse, INdcWorkerConfiguration>(
    {
      queryKey: ['getNdcWorkerConfigurationByJobName'],
      queryFn: () => getNdcWorkerConfigurationByJobName(),
      ...options
    }
  );
