import AxiosRequest, { generateAccessToken, routes } from '@helpers/api'
import { axiosErrorHandler, getErrorMessageByCode } from '@helpers/errors'
import { type RootState, store } from '@store'
import {
  type IApiErrorResponse, type IParticipantUser, type IParticipantUserForm,
  type IBusinessContact, type ILiquidityProfile,
  type ICurrency,
  type IParticipantProfile, type IGetParticipantList,
  IParticipantUserRole,
  IParticipantOrganization,
} from '@typescript/services'
import { type ICreateUserValues, type IModifyUserValues, type IResetPasswordValues } from '@typescript/form'
import { type AxiosError } from 'axios'
import { IApprovalRequest } from '@typescript/services'
import { IModifyUser } from '@typescript/services'

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
        dfspId: "wallet1"
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

export const getParticipantProfile = async (participantId: string) => {
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
    .get<IParticipantProfile>(uri, {
      params: {
        participantId: participantId
      }
    })
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