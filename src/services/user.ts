import AxiosRequest, { generateAccessToken, routes } from '@helpers/api';
import { axiosErrorHandler, getErrorMessageByCode } from '@helpers/errors';
import { store } from '@store';
import { type IUserProfile } from '@store/features/user';
import { type IApiErrorResponse } from '@typescript/services';
import { type AxiosError } from 'axios';

export const getUserProfile = async () => {
  const {
    user: { auth }
  } = store.getState();
  const uri = routes.get_user_profile;
  const accessKey = auth?.accessKey as string;
  const secretKey = auth?.secretKey as string;
  const accessToken = await generateAccessToken({
    method: 'GET',
    uri,
    secret: secretKey
  });
  const { axios } = AxiosRequest(accessToken, accessKey);
  return axios
    .get<IUserProfile>(uri)
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
