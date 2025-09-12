import AxiosRequest, { generateAccessToken, routes } from '@helpers/api'
import { axiosErrorHandler, getErrorMessageByCode } from '@helpers/errors'
import { type RootState, store } from '@store'
import { PendingApprovalStatus, type IApiErrorResponse, type IPendingApproval } from '@typescript/services'
import { type AxiosError } from 'axios'


export const getAllPendingApprovals = async () => {
  const {
    user: { auth, data }
  } = store.getState()
  const uri = routes.getPendingApprovals
  const accessKey = auth?.accessKey as string
  const secretKey = auth?.secretKey as string
  const accessToken = await generateAccessToken({
    method: 'GET',
    uri,
    secret: secretKey
  })
  const { axios } = AxiosRequest(accessToken, accessKey)
  return axios
    .get<{ pendingApprovalList: IPendingApproval[] }>(uri, {
    })
    .then((d) => d.data.pendingApprovalList)
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



export const modifyApprovalAction = async (
  approvalRequestId: string,
  action: PendingApprovalStatus
) => {
  const data = { approvalRequestId, action };
  const {
    user: { auth }
  } = store.getState()
  const uri = routes.modifyApprovalAction
  const accessKey = auth?.accessKey as string
  const secretKey = auth?.secretKey as string
  const accessToken = await generateAccessToken({
    method: 'POST',
    uri,
    secret: secretKey,
    payload: { approvalRequestId, action }
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
