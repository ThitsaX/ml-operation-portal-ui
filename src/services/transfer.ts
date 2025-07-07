import AxiosRequest, { generateAccessToken, routes } from '@helpers/api';
import { axiosErrorHandler, getErrorMessageByCode } from '@helpers/errors';
import { type IApiErrorResponse } from '@typescript/services/errors';
import { type AxiosError, type AxiosResponse } from 'axios';
import { type ITransferValues } from '@typescript/form/transfer';
import {
  type IGetTransferDataArr,
  type IGetTransferStatesArr,
  type IGetIdTypesArr,
  type IGetOtherParticipantsArr,
  type IGetTransferDetails
} from '@typescript/services';
import { type IUserState } from '@store/features/user';
import { store } from '@store';

export const getAllOtherParticipants = async () => {
  const {
    user: { auth, data }
  } = store.getState();
  const uri = routes.get_all_other_participants;
  const accessKey = auth?.access_key as string;
  const secretKey = auth?.secret_key as string;

  const accessToken = await generateAccessToken({
    method: 'GET',
    uri,
    secret: secretKey
  });

  const { axios } = AxiosRequest(accessToken, accessKey);

  return axios
    .get<IGetOtherParticipantsArr>(uri, {
      params: {
        participant_id: data?.participant_id
      }
    })
    .then((d) => d.data)
    .catch((error: AxiosError<IApiErrorResponse>) => {
      const { code, message, ...rest } = axiosErrorHandler(error);
      if (code && message) {
        throw {
          error_code: code,
          default_error_message: getErrorMessageByCode(code),
          i18n_error_messages: null
        };
      }
      throw rest;
    });
};

export const getAllIdTypes = async () => {
  const {
    user: { auth }
  } = store.getState();

  const uri = routes.get_all_id_type;
  const accessKey = auth?.access_key as string;
  const secretKey = auth?.secret_key as string;

  const accessToken = await generateAccessToken({
    method: 'GET',
    uri,
    secret: secretKey
  });

  const { axios } = AxiosRequest(accessToken, accessKey);

  return axios
    .get<IGetIdTypesArr>(uri)
    .then((d) => d.data)
    .catch((error: AxiosError<IApiErrorResponse>) => {
      const { code, message, ...rest } = axiosErrorHandler(error);
      if (code && message) {
        throw {
          error_code: code,
          default_error_message: getErrorMessageByCode(code),
          i18n_error_messages: null
        };
      }
      throw rest;
    });
};

export const getAllTransferStates = async () => {
  const {
    user: { auth }
  } = store.getState();

  const uri = routes.get_all_transfer_state;
  const accessKey = auth?.access_key as string;
  const secretKey = auth?.secret_key as string;

  const accessToken = await generateAccessToken({
    method: 'GET',
    uri,
    secret: secretKey
  });

  const { axios } = AxiosRequest(accessToken, accessKey);

  return axios
    .get<IGetTransferStatesArr>(uri)
    .then((d) => d.data)
    .catch((error: AxiosError<IApiErrorResponse>) => {
      const { code, message, ...rest } = axiosErrorHandler(error);
      if (code && message) {
        throw {
          error_code: code,
          default_error_message: getErrorMessageByCode(code),
          i18n_error_messages: null
        };
      }
      throw rest;
    });
};

export const getAllTransfers = async (data: Partial<ITransferValues>) => {
  const {
    user: { auth }
  } = store.getState();

  const uri = routes.get_all_transfer;
  const accessKey = auth?.access_key as string;
  const secretKey = auth?.secret_key as string;

  const accessToken = await generateAccessToken({
    method: 'GET',
    uri,
    secret: secretKey
  });

  const { axios } = AxiosRequest(accessToken, accessKey);

  return axios
    .get<IGetTransferDataArr>(uri, {
      params: data
    })
    .then((d) => d.data);
};

export const getTransferDetails = async (transferId: string, timezone?: string) => {

  const {
    user: { auth }
  } = store.getState();

  const uri = routes.get_transfer_detail;
  const accessKey = auth?.access_key as string;
  const secretKey = auth?.secret_key as string;

  const accessToken = await generateAccessToken({
    method: 'GET',
    uri,
    secret: secretKey
  });

  const { axios } = AxiosRequest(accessToken, accessKey);

  return await axios
    .get<IGetTransferDetails>(uri, {
      params: {
        transferId,
        timezone
      }
    })
    .then((d) => d.data);
};
