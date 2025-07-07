import AxiosRequest, { generateAccessToken, routes } from '@helpers/api';
import { axiosErrorHandler, getErrorMessageByCode } from '@helpers/errors';
import { store } from '@store';
import { type IApiErrorResponse } from '@typescript/services';
import { type AxiosError, type AxiosResponse } from 'axios';
import { type IChangePwdValues } from '@typescript/form';

export const changePassword = async (data: IChangePwdValues) => {
  try {
    const {
      user: { auth }
    } = store.getState();

    const uri = routes.change_password;
    const accessKey = auth?.access_key as string;
    const secretKey = auth?.secret_key as string;

    const accessToken = await generateAccessToken({
      method: 'POST',
      uri,
      payload: data,
      secret: secretKey
    });

    const { axios } = AxiosRequest(accessToken, accessKey);

    const response: AxiosResponse = await axios.post(uri, data);

    return response.data;
  } catch (error: unknown) {
    const { code, message, ...rest } = axiosErrorHandler(
      error as AxiosError<IApiErrorResponse>
    );
    if (code && message) {
      throw {
        error_code: code,
        default_error_message: getErrorMessageByCode(code),
        i18n_error_messages: null
      };
    }

    throw rest;
  }
};
