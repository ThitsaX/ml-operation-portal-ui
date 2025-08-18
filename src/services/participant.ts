import AxiosRequest, { generateAccessToken, routes } from '@helpers/api'
import { axiosErrorHandler, getErrorMessageByCode } from '@helpers/errors'
import { type RootState, store } from '@store'
import { type IApiErrorResponse, type IParticipantUser } from '@typescript/services'
import {
  type ICreateUserValues,
  type IModifyUserValues,
  type IResetPasswordValues
} from '@typescript/form'
import { type AxiosError } from 'axios'

export const createNewParticipantUser = async (data: ICreateUserValues) => {
  const {
    user: { auth }
  } = store.getState()
  const uri = routes.create_new_participant_user
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
    .post<{ is_created: true }>(uri, data)
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

export const modifyParticipantUser = async (data: IModifyUserValues) => {
  const {
    user: { auth }
  } = store.getState()
  const uri = routes.modify_participant_user
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
    .post<{ modified: true }>(uri, data)
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

export const removeParticipantUser = async (data: {
  participant_user_id: string
  participant_id: string
}) => {
  const {
    user: { auth }
  } = store.getState()
  const uri = routes.remove_participant_user
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
    .post<{ removed: true }>(uri, data)
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

export const resetPasswordUser = async (data: IResetPasswordValues) => {
  const {
    user: { auth }
  } = store.getState()
  const uri = routes.reset_password
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
    .post<{ reset: true }>(uri, data)
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

export const getAllParticipantUsers = async () => {
  const {
    user: { auth, data }
  } = store.getState()
  const uri = routes.get_all_participant_users
  const accessKey = auth?.accessKey as string
  const secretKey = auth?.secretKey as string
  const accessToken = await generateAccessToken({
    method: 'GET',
    uri,
    secret: secretKey
  })
  const { axios } = AxiosRequest(accessToken, accessKey)
  return axios
    .get<{ userinfo_list: IParticipantUser[] }>(uri, {
    params: {
      participantId: data?.participant_id
    }
  })
    .then((d) => d.data.userinfo_list)
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
