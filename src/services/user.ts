import AxiosRequest, { generateAccessToken, routes } from '@helpers/api';
import { axiosErrorHandler, getErrorMessageByCode } from '@helpers/errors';
import { store } from '@store';
import { type IUserProfile } from '@store/features/user';
import { type IApiErrorResponse, type IParticipantUserForm, type IModifyUser } from '@typescript/services';
import { type AxiosError } from 'axios';

export const getUserProfile = async () => {
  const {
    user: { auth }
  } = store.getState();
  const uri = routes.getUserProfile;
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

export const createUser = async (user: IParticipantUserForm) => {
  const {
    user: { auth }
  } = store.getState()
  const uri = routes.createUser

  const accessKey = auth?.accessKey as string
  const secretKey = auth?.secretKey as string
  const accessToken = await generateAccessToken({
    method: 'POST',
    uri,
    secret: secretKey,
    payload: user
  })
  const { axios } = AxiosRequest(accessToken, accessKey)
  return axios
    .post<{ isModified: true }>(uri, user)
    .then((d) => d.data)
    .catch((error: AxiosError<IApiErrorResponse>) => {
      const { code, message, ...rest } = axiosErrorHandler(error)
      if (code && message) {
        throw {
          error_code: code,
          default_error_message: getErrorMessageByCode(code),
          i18n_error_messages: null
        }
      }
      throw rest
    })
}

export const modifyUser = async (user: IModifyUser) => {
  const {
    user: { auth }
  } = store.getState()
  const uri = routes.modifyUser

  const accessKey = auth?.accessKey as string
  const secretKey = auth?.secretKey as string
  const accessToken = await generateAccessToken({
    method: 'POST',
    uri,
    secret: secretKey,
    payload: user
  })
  const { axios } = AxiosRequest(accessToken, accessKey)
  return axios
    .post<{ isModified: true }>(uri, user)
    .then((d) => d.data)
    .catch((error: AxiosError<IApiErrorResponse>) => {
      const { code, message, ...rest } = axiosErrorHandler(error)
      if (code && message) {
        throw {
          error_code: code,
          default_error_message: getErrorMessageByCode(code),
          i18n_error_messages: null
        }
      }
      throw rest
    })
}

export const modifyUserStatus = async (userId: string, status: string) => {
  const {
    user: { auth }
  } = store.getState()
  const uri = routes.modifyUserStatus
  const data = {
    userId: userId,
    userStatus: status
  }
  const accessKey = auth?.accessKey as string
  const secretKey = auth?.secretKey as string
  const accessToken = await generateAccessToken({
    method: 'POST',
    uri,
    secret: secretKey,
    payload: data
  })
  const { axios } = AxiosRequest(accessToken, accessKey)
  return axios
    .post<{ isModified: true }>(uri, data)
    .then((d) => d.data)
    .catch((error: AxiosError<IApiErrorResponse>) => {
      const { code, message, ...rest } = axiosErrorHandler(error)
      if (code && message) {
        throw {
          error_code: code,
          default_error_message: getErrorMessageByCode(code),
          i18n_error_messages: null
        }
      }
      throw rest
    })
}
