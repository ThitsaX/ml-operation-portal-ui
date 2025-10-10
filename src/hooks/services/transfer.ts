import {
  getAllIdTypes,
  getAllTransferStates,
  getAllTransfers,
  getAllOtherParticipants,
  getTransferDetails
} from '@services/transfer';
import { useQuery } from '@tanstack/react-query';
import {
  type IApiErrorResponse,
  type IGetIdTypesArr,
  type IGetTransferStatesArr,
  type IGetTransferDataArr,
  type IGetOtherParticipantsArr,
  type IGetTransferDetails
} from '@typescript/services';
import { type IUserState } from '@store/features/user';
import { type ITransferValues } from '@typescript/form/transfer';
import moment from 'moment-timezone';

export const useGetAllOtherParticipants = () =>
  useQuery<IGetOtherParticipantsArr, IApiErrorResponse>({
    queryKey: ['getAllOtherParticipants'],
    queryFn: () => getAllOtherParticipants()
  });

export const useGetAllIdTypes = () => {
  const { data, error } = useQuery<IGetIdTypesArr, IApiErrorResponse>({
    queryKey: ['getAllIdTypes'],
    queryFn: getAllIdTypes
  });

  return { data, error };
};

export const useGetAllTransferStates = () => {
  const { data, error } = useQuery<IGetTransferStatesArr, IApiErrorResponse>({
    queryKey: ['getAllTransferStates'],
    queryFn: getAllTransferStates
  });

  return { data, error };
};

export const useGetTransferDetails = (transferId: string) => {
  const { data, error } = useQuery<IGetTransferDetails, IApiErrorResponse>({
    queryKey: ['getTransferDetails', transferId],
    queryFn: () => getTransferDetails(transferId)
  });

  return { data, error };
};

export const useGetAllTransfers = (
  user: IUserState,
  params: ITransferValues,
  pageIndex: number,
  pageSize: number
) => {
  params.fromDate = moment.utc(params.fromDate).format();
  params.toDate = moment.utc(params.toDate).format();

  return useQuery<IGetTransferDataArr, IApiErrorResponse>({
    queryKey: ['getAllTransfers'],
    queryFn: () => getAllTransfers(params, pageIndex, pageSize),
    refetchOnWindowFocus: false,
    enabled: false
  });
};
