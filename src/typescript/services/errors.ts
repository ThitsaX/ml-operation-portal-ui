export interface IApiErrorResponse {
  default_error_message: string
  error_code: string
  i18n_error_messages?: I18nErrorMessages
  description: string
}

export interface I18nErrorMessages {
  en: string
  fr?: string
  [lang: string]: string | undefined
}
