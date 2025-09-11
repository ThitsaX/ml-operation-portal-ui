import AxiosRequest, { routes } from '@helpers/api';
import { axiosErrorHandler, getErrorMessageByCode } from '@helpers/errors';
import {
  type IApiErrorResponse,
  type IGetAllAnnouncement,
  type IGreetingMessage
} from '@typescript/services';
import { type AxiosError } from 'axios';

export const getAllAnnouncement = async () => {
  const uri = routes.get_all_announcement;
  const { axios } = AxiosRequest();
  return axios
    .get<IGetAllAnnouncement>(uri)
    .then((d) => d.data.announcementInfoList)
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

export const getGreetingMessage = async () => {
  const uri = routes.getGreetingMessages;
  const { axios } = AxiosRequest();
  return axios
    .get<IGreetingMessage>(uri)
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
