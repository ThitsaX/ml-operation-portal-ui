import { getAllAuditByParticipant, getMadeByList, getActionList, getAllAuditList } from '@services/audit';
import { UseMutationOptions, useMutation } from '@tanstack/react-query';
import { IGetAuditByParticipantValues } from '@typescript/form';
import { AuditInfo, IApiErrorResponse } from '@typescript/services';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { IGetAction, IGetMadeBy } from '@typescript/services/audit'

export const useGetAllAuditByParticipant = (
  options?: UseMutationOptions<
    AuditInfo[],
    IApiErrorResponse,
    IGetAuditByParticipantValues
  >
) =>
  useMutation<AuditInfo[], IApiErrorResponse, IGetAuditByParticipantValues>(
    getAllAuditByParticipant,
    options
  );

export const useGetAllAudit = (
  options?: UseMutationOptions<
    AuditInfo[],
    IApiErrorResponse,
    IGetAuditByParticipantValues
  >
) =>
  useMutation<AuditInfo[], IApiErrorResponse, IGetAuditByParticipantValues>(
    getAllAuditList,
    options
  );

export const useGetMadeByList = (
  options?: UseQueryOptions<IGetMadeBy[],
    IApiErrorResponse
  >
) =>
  useQuery<IGetMadeBy[], IApiErrorResponse>({
    queryKey: ['getMadeByList'],
    queryFn: getMadeByList,
    ...options
  })

export const useGetActionList = (
  options?: UseQueryOptions<IGetAction[],
    IApiErrorResponse
  >
) =>
  useQuery<IGetAction[], IApiErrorResponse>({
    queryKey: ['getActionList'],
    queryFn: getActionList,
    ...options
  })
