import i18n, { type supportedLngs } from '@locales'
import { type IApiErrorResponse } from '@typescript/services'
import { humanize } from '@utils'
import { type AxiosError } from 'axios'
import defaultErrorCodes from './errorCodes'

export const getErrorNameByCode = (code: string) => {
  const { t } = i18n
  const error = defaultErrorCodes[code as keyof typeof defaultErrorCodes]
  const errorName = error ? t(`${error.key}_TITLE`) : humanize(code)
  return errorName
}

export const getErrorMessageByCode = (code: string) => {
  const { t } = i18n
  const error = defaultErrorCodes[code as keyof typeof defaultErrorCodes]
  const errorLocalizeMessage = error ? t(error.key) : humanize(code)
  return errorLocalizeMessage
}

export const getRequestErrorMessage = (
  error: IApiErrorResponse | null,
  lang: supportedLngs = 'en',
  fallbackLng: supportedLngs = 'en'
) => {
  const i18nErrorMessage = error?.i18n_error_messages

  if (i18nErrorMessage != null) {
    return (
      i18nErrorMessage[lang] ??
      i18nErrorMessage[fallbackLng] ??
      error?.default_error_message
    )
  }
  return error?.default_error_message
}

export interface IAxiosErrorHandlerReturn {
  code: string | null
  message: string | null
}
export const axiosErrorHandler = <T = any>({
  code = '',
  message,
  ...rest
}: AxiosError<T>): IAxiosErrorHandlerReturn & Partial<IApiErrorResponse> => {
  if (
    (rest.response != null) &&
    rest.response?.headers?.['content-type'].includes('application/json')
  ) {
    return { code: null, message: null, ...rest.response?.data }
  }
  return { code, message }
}

export default defaultErrorCodes
