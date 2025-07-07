import AxiosRequest, { routes } from '@helpers/api'
import { axiosErrorHandler, getErrorMessageByCode } from '@helpers/errors'
import { createAsyncThunk } from '@reduxjs/toolkit'
import { type IApiErrorResponse, type IAuthResponse } from '@typescript/services'
import { type ISignInValues } from '@typescript/form'
import { type AxiosError } from 'axios'

export const login = createAsyncThunk(
  'user/login',
  async (data: ISignInValues, { rejectWithValue }) => {
    const { axios } = AxiosRequest()
    return axios
      .post<IAuthResponse>(routes.login, data)
      .then((d) => d.data)
      .catch((error: AxiosError<IApiErrorResponse>) => {
        const { code, message, ...rest } = axiosErrorHandler(error)
        if (code && message) {
          return rejectWithValue({
            error_code: code,
            default_error_message: getErrorMessageByCode(code),
            i18n_error_messages: null
          })
        }
        return rejectWithValue(rest)
      })
  }
)
