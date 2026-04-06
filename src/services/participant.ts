import AxiosRequest, { generateAccessToken, routes } from '@helpers/api'
import { axiosErrorHandler, getErrorMessageByCode } from '@helpers/errors'
import { type RootState, store } from '@store'
import {
  type IApiErrorResponse, type IParticipantUser,
  type IBusinessContact, type ILiquidityProfile,
  type ICurrency,
  type IParticipantProfile, type IGetParticipantList,
  type IParticipant,
  IParticipantUserRole,
  IParticipantOrganization,
  type IParticipantPositionData
} from '@typescript/services'
import { type ICreateUserValues, type IModifyUserValues, type IResetPasswordValues } from '@typescript/form'
import { type AxiosError } from 'axios'
import { IApprovalRequest } from '@typescript/services'

type ParticipantProfileApi = Omit<IParticipantProfile, 'connectedParticipants'> & {
  connectedParticipants: IParticipant[]
}

const formatConnectedParticipants = (value: IParticipant[]): string => {
  if (value.length === 0) return '-'
  return value
    .map(p => `${p.participantName} (${p.participantDescription})`)
    .join(', ')
}

export const getParticipantPositionList = async () => {
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

export const getParticipantList = async (
) => {
  const {
    user: { auth }
  } = store.getState();
  const uri = routes.getParticipantList;
  const accessKey = auth?.accessKey as string;
  const secretKey = auth?.secretKey as string;
  const accessToken = await generateAccessToken({
    method: 'GET',
    uri,
    secret: secretKey
  });
  const { axios } = AxiosRequest(accessToken, accessKey);
  return axios
    .get<IGetParticipantList>(uri, {
    })
    .then((d) => d.data.participantInfoList)
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


export const modifyContact = async (data: IBusinessContact) => {
  const {
    user: { auth }
  } = store.getState()
  const uri = routes.modifyContact
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


export const resetPasswordUser = async (data: IResetPasswordValues) => {
  const {
    user: { auth }
  } = store.getState()
  const uri = routes.resetPassword
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

export const getUserListByParticipant = async () => {
  const {
    user: { auth, data }
  } = store.getState()
  const uri = routes.getUserListByParticipant
  const accessKey = auth?.accessKey as string
  const secretKey = auth?.secretKey as string
  const accessToken = await generateAccessToken({
    method: 'GET',
    uri,
    secret: secretKey
  })
  const { axios } = AxiosRequest(accessToken, accessKey)
  return axios
    .get<{ userInfoList: IParticipantUser[] }>(uri, {
      params: {
        participantId: data?.participantId
      }
    })
    .then((d) => d.data.userInfoList)
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

export const getRoleListByParticipant = async (participantName: string) => {
  const {
    user: { auth, data }
  } = store.getState()
  const uri = routes.getRoleListByParticipant
  const accessKey = auth?.accessKey as string
  const secretKey = auth?.secretKey as string
  const accessToken = await generateAccessToken({
    method: 'GET',
    uri,
    secret: secretKey
  })
  const { axios } = AxiosRequest(accessToken, accessKey)
  return axios
    .get<{ roleList: IParticipantUserRole[] }>(uri, {
      params: {
        participantName: participantName
      }
    })
    .then((d) => d.data.roleList)
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

export const getOrganizationListByParticipant = async () => {
  const {
    user: { auth, data }
  } = store.getState()
  const uri = routes.getParticipantListByParticipant
  const accessKey = auth?.accessKey as string
  const secretKey = auth?.secretKey as string
  const accessToken = await generateAccessToken({
    method: 'GET',
    uri,
    secret: secretKey
  })
  const { axios } = AxiosRequest(accessToken, accessKey)
  return axios
    .get<{ participantInfoList: IParticipantOrganization[] }>(uri, {
    })
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

export const getParticipantListIncludingHub = async () => {
  const {
    user: { auth, data }
  } = store.getState()
  const uri = routes.getParticipantListIncludingHub
  const accessKey = auth?.accessKey as string
  const secretKey = auth?.secretKey as string
  const accessToken = await generateAccessToken({
    method: 'GET',
    uri,
    secret: secretKey
  })
  const { axios } = AxiosRequest(accessToken, accessKey)
  return axios
    .get<{ participantInfoList: IParticipantOrganization[] }>(uri, {
    })
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

export const createApprovalRequest = async (data: IApprovalRequest) => {
  const {
    user: { auth }
  } = store.getState()
  const uri = routes.createApprovalRequest
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

export const updateParticipantStatus = async (data: any) => {
  const {
    user: { auth }
  } = store.getState()
  const uri = routes.updateParticipantStatus
  const accessKey = auth?.accessKey as string
  const secretKey = auth?.secretKey as string
  const accessToken = await generateAccessToken({
    method: 'PUT',
    uri,
    secret: secretKey,
    payload: data
  })
  const { axios } = AxiosRequest(accessToken, accessKey)
  return axios
    .put<{ isModified: true }>(uri, data)
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

export const getContactList = async (participantId: string) => {
  const {
    user: { auth, data }
  } = store.getState()

  const uri = routes.getContactList
  const accessKey = auth?.accessKey as string
  const secretKey = auth?.secretKey as string
  const accessToken = await generateAccessToken({
    method: 'GET',
    uri,
    secret: secretKey
  })
  const { axios } = AxiosRequest(accessToken, accessKey)
  return axios
    .get<{ contactInfoList: IBusinessContact[] }>(uri, {
      params: {
        participantId: participantId ? participantId : data?.participantId
      }
    })
    .then((d) => d.data.contactInfoList)
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

export const getParticipantCurrencyList = async () => {
  const {
    user: { auth, data }
  } = store.getState()

  const uri = routes.getParticipantCurrency
  const accessKey = auth?.accessKey as string
  const secretKey = auth?.secretKey as string
  const accessToken = await generateAccessToken({
    method: 'GET',
    uri,
    secret: secretKey
  })
  const { axios } = AxiosRequest(accessToken, accessKey)
  return axios
    .get<{ hubCurrencyList: ICurrency[] }>(uri, {
      params: {
        dfspId: "hub"
      }
    })
    .then((d) => d.data.hubCurrencyList)
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

export const getHubCurrency = async () => {
  const {
    user: { auth, data }
  } = store.getState()

  const uri = routes.getHubCurrency
  const accessKey = auth?.accessKey as string
  const secretKey = auth?.secretKey as string
  const accessToken = await generateAccessToken({
    method: 'GET',
    uri,
    secret: secretKey
  })
  const { axios } = AxiosRequest(accessToken, accessKey)
  return axios
    .get<{ currencyInfoList: ICurrency[] }>(uri, {
    })
    .then((d) => d.data.currencyInfoList)
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

export const getParticipantProfile = async (participantId: string): Promise<IParticipantProfile> => {
  const {
    user: { auth, data }
  } = store.getState()
  const uri = routes.getParticipantProfile
  const accessKey = auth?.accessKey as string
  const secretKey = auth?.secretKey as string
  const accessToken = await generateAccessToken({
    method: 'GET',
    uri,
    secret: secretKey
  })
  const { axios } = AxiosRequest(accessToken, accessKey)
  return axios
    .get<ParticipantProfileApi>(uri, {
      params: {
        participantId: participantId
      }
    })
    .then((d) => {
      const profile = d.data
      return {
        ...profile,
        connectedParticipants: formatConnectedParticipants(profile.connectedParticipants as IParticipant[])
      }
    })
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

export const modifyParticipant = async (data: IParticipantProfile) => {
  const {
    user: { auth }
  } = store.getState()
  const uri = routes.modifyParticipant
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

export const createBusinessContact = async (data: IBusinessContact) => {
  const {
    user: { auth }
  } = store.getState()
  const uri = routes.createContact
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

export const getLiquidityProfileList = async (participantId: string) => {
  const {
    user: { auth, data }
  } = store.getState()
  const uri = routes.getLiquidityProfileList
  const accessKey = auth?.accessKey as string
  const secretKey = auth?.secretKey as string
  const accessToken = await generateAccessToken({
    method: 'GET',
    uri,
    secret: secretKey
  })
  const { axios } = AxiosRequest(accessToken, accessKey)
  return axios
    .get<{ liquidityProfileInfoList: ILiquidityProfile[] }>(uri, {
      params: {
        participantId: participantId
      }
    })
    .then((d) => d.data.liquidityProfileInfoList)
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

export const createLiquidityProfile = async (data: ILiquidityProfile) => {
  const {
    user: { auth }
  } = store.getState()
  const uri = routes.createLiquidityProfile
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

export const modifyLiquidityProfile = async (data: ILiquidityProfile) => {
  const {
    user: { auth }
  } = store.getState()
  const uri = routes.modifyLiquidityProfile
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

export const removeContact = async (data: {
  contactId: string
  participantId: string
}) => {
  const {
    user: { auth }
  } = store.getState()
  const uri = routes.removeContact
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

export const removeLiquidityProfile = async (data: {
  liquidityProfileId: string
  participantId: string
}) => {
  const {
    user: { auth }
  } = store.getState()
  const uri = routes.removeLiquidityProfile
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
