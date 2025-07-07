import AxiosRequest, { generateAccessToken, routes } from '@helpers/api'
import { axiosErrorHandler, getErrorMessageByCode } from '@helpers/errors'
import { type RootState, store } from '@store'
import { type IApiErrorResponse, type IGetDashboardData } from '@typescript/services'
import { type AxiosError } from 'axios'

export const getDashboardData = async () => {
  const {
    user: { auth }
  } = store.getState()
  const uri = routes.get_dashboard_data
  const accessKey = auth?.access_key as string
  const secretKey = auth?.secret_key as string
  const accessToken = await generateAccessToken({
    method: 'GET',
    uri,
    secret: secretKey
  })
  const { axios } = AxiosRequest(accessToken, accessKey)
  return axios
    .get<IGetDashboardData>(uri)
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
