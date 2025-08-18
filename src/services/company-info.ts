import AxiosRequest, { generateAccessToken, routes } from '@helpers/api';
import { axiosErrorHandler, getErrorMessageByCode } from '@helpers/errors';
import { store } from '@store';
import { type IApiErrorResponse } from '@typescript/services';
import {
  type IGetParticipant,
  type IModifyParticipantResponse
} from '@typescript/services/company-info';
import { type AxiosError } from 'axios';

export const getParticipant = async () => {
  const {
    user: { auth, data }
  } = store.getState();
  const uri = routes.get_participant;
  const accessKey = auth?.accessKey as string;
  const secretKey = auth?.secretKey as string;
  const accessToken = await generateAccessToken({
    method: 'GET',
    uri,
    secret: secretKey
  });

  const { axios } = AxiosRequest(accessToken, accessKey);
  return axios
    .get<IGetParticipant>(uri, {
      params: {
        participantId: data?.participant_id
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

export const modifyParticipant = async (data: any) => {
  const {
    user: { auth }
  } = store.getState();
  const uri = routes.modify_participant;
  const accessKey = auth?.accessKey as string;
  const secretKey = auth?.secretKey as string;
  const accessToken = await generateAccessToken({
    method: 'POST',
    uri,
    payload: data,
    secret: secretKey
  });

  const { axios } = AxiosRequest(accessToken, accessKey);
  return axios
    .post<IModifyParticipantResponse>(uri, data)
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
