import { getAllAuditByParticipant } from '@services/audit';
import { UseMutationOptions, useMutation } from '@tanstack/react-query';
import { IGetAuditByParticipantValues } from '@typescript/form';
import { AuditInfo, IApiErrorResponse } from '@typescript/services';

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
