import AxiosRequest, { generateAccessToken, routes } from '@helpers/api'
import { axiosErrorHandler, getErrorMessageByCode } from '@helpers/errors'
import { store } from '@store'
import { type IApiErrorResponse, IFinalizeSettlement } from '@typescript/services'
import { type AxiosError } from 'axios'
import { ISettlementWindow } from '@typescript/services'

export const getFinalizeSettlementList = async (values: any) => {
    const {
        user: { auth, data }
    } = store.getState()
    const uri = routes.getSettlementList
    const accessKey = auth?.accessKey as string
    const secretKey = auth?.secretKey as string
    const accessToken = await generateAccessToken({
        method: 'GET',
        uri,
        secret: secretKey
    })
    const { axios } = AxiosRequest(accessToken, accessKey)
    return axios
        .get<{ settlementList: IFinalizeSettlement[] }>(uri, {
            params: values
        })
        .then((d) => d.data.settlementList)
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

export const getSettlementWindowsList = async (values: any) => {
    const {
        user: { auth, data }
    } = store.getState()
    const uri = routes.getSettlementWindowsList
    const accessKey = auth?.accessKey as string
    const secretKey = auth?.secretKey as string
    const accessToken = await generateAccessToken({
        method: 'GET',
        uri,
        secret: secretKey
    })
    const { axios } = AxiosRequest(accessToken, accessKey)
    return axios
        .get<{ settlementWindowList: ISettlementWindow[] }>(uri, {
            params: {
                fromDate: values?.fromDate,
                toDate: values?.toDate,
                currency: values?.currency
            }
        })
        .then((d) => d.data.settlementWindowList)
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

export const createSettlementWindow = async (data: any) => {
    const {
        user: { auth }
    } = store.getState()
    const uri = routes.createSettlement
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

export const closeSettlementWindow = async (data: any) => {
    const {
        user: { auth }
    } = store.getState()
    const uri = routes.closeSettlementWindow
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


export const finalizeSettlementWindow = async (data: any) => {
    const {
        user: { auth }
    } = store.getState()
    const uri = routes.finalizeSettlement
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