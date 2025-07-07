import AxiosRequest, { routes } from '@helpers/api';
import { axiosErrorHandler, getErrorMessageByCode } from '@helpers/errors';
import {
  type IApiErrorResponse,
  type IGetAllAnnouncement
} from '@typescript/services';
import { type AxiosError } from 'axios';

export const getAllAnnouncement = async () => {
  const uri = routes.get_all_announcement;
  const { axios } = AxiosRequest();
  return axios
    .get<IGetAllAnnouncement>(uri)
    .then((d) => d.data.announcement_info_list)
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
