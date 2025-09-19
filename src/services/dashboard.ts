import AxiosRequest, { generateAccessToken, routes } from '@helpers/api'
import { axiosErrorHandler, getErrorMessageByCode } from '@helpers/errors'
import { store } from '@store'
import { type IParticipant, type IApiErrorResponse, type IParticipantPositionData } from '@typescript/services'
import { type AxiosError } from 'axios'

export const getDashboardData = async () => {
  const {
    user: { auth }
  } = store.getState()
  const uri = routes.getParticipantPositionList
  const accessKey = auth?.accessKey as string
  const secretKey = auth?.secretKey as string
  const accessToken = await generateAccessToken({
    method: 'GET',
    uri,
    secret: secretKey
  })
  const { axios } = AxiosRequest(accessToken, accessKey)
  return axios
    .get<{ participantPositionsData: IParticipantPositionData[] }>(uri)
    .then((d) => d.data.participantPositionsData)
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

export const syncHubParticipantsToPortal = async () => {
  const {
    user: { auth }
  } = store.getState()
  const uri = routes.syncHubParticipantsToPortal
  const accessKey = auth?.accessKey as string
  const secretKey = auth?.secretKey as string
  const accessToken = await generateAccessToken({
    method: 'POST',
    uri,
    secret: secretKey
  })
  const { axios } = AxiosRequest(accessToken, accessKey)
  return axios
    .post<{ data: true }>(uri)
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

export const getParticipantList = async () => {
  const {
    user: { auth }
  } = store.getState()
  const uri = routes.get_all_participants
  const accessKey = auth?.accessKey as string
  const secretKey = auth?.secretKey as string
  const accessToken = await generateAccessToken({
    method: 'GET',
    uri,
    secret: secretKey
  })
  const { axios } = AxiosRequest(accessToken, accessKey)
  return axios
    .get<{ participantInfoList: IParticipant[] }>(uri)
    .then((d) => d.data.participantInfoList)
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