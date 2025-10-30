import { getMadeByList, getActionList, getAllAuditList } from '@services/audit';
import { UseMutationOptions, useMutation } from '@tanstack/react-query';
import { IGetAuditByParticipantValues } from '@typescript/form';
import { AuditInfo, IGetAuditByParticipant, IApiErrorResponse } from '@typescript/services';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { IGetAction, IGetMadeBy } from '@typescript/services/audit'


export const useGetAllAudit = (
  options?: UseMutationOptions<
    IGetAuditByParticipant,
    IApiErrorResponse,
    IGetAuditByParticipantValues
  >
) =>
  useMutation<IGetAuditByParticipant, IApiErrorResponse, IGetAuditByParticipantValues>(
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
