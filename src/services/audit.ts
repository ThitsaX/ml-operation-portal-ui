import AxiosRequest, { generateAccessToken, routes } from '@helpers/api';
import { axiosErrorHandler, getErrorMessageByCode } from '@helpers/errors';
import { store } from '@store';
import { IGetAuditByParticipantValues } from '@typescript/form';
import {
  IGetAuditByParticipant,
  type IApiErrorResponse
} from '@typescript/services';
import { type AxiosError } from 'axios';

export const getAllAuditByParticipant = async (
  values: IGetAuditByParticipantValues
) => {
  const {
    user: { auth }
  } = store.getState();
  const uri = routes.get_all_audit_by_participant;
  const accessKey = auth?.accessKey as string;
  const secretKey = auth?.secretKey as string;
  const accessToken = await generateAccessToken({
    method: 'GET',
    uri,
    secret: secretKey
  });
  const { axios } = AxiosRequest(accessToken, accessKey);
  return axios
    .get<IGetAuditByParticipant>(uri, {
      params: values
    })
    .then((d) => d.data.audit_info_list)
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
