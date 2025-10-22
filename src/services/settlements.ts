import AxiosRequest, { generateAccessToken, routes } from '@helpers/api'
import { axiosErrorHandler, getErrorMessageByCode } from '@helpers/errors'
import { store } from '@store'
import { 
    type IApiErrorResponse, 
    IFinalizeSettlement,
    ISettlementWindowState,
    ISettlementModel,
    ISettlementState,
} from '@typescript/services'
import { type AxiosError } from 'axios'
import { ISettlementWindow, INetTransferAmount } from '@typescript/services'
import { 
    ISettlementWindowForm, 
    ISettlementWindowCreateForm, 
    IFinalizeSettlementForm,
    ISettlementScheduleForm,
    ISettlementScheduleModifyForm,
    ISettlementScheduleRemoveForm,
} from '@typescript/form/settlements'


export const getSettlementWindowStateList = async () => {
    const {
        user: { auth }
    } = store.getState()
    const uri = routes.getSettlementWindowStateList
    const accessKey = auth?.accessKey as string
    const secretKey = auth?.secretKey as string
    const accessToken = await generateAccessToken({
        method: 'GET',
        uri,
        secret: secretKey
    })
    const { axios } = AxiosRequest(accessToken, accessKey)
    return axios
        .get<{ settlementWindowStateList: ISettlementWindowState[] }>(uri)
        .then((d) => d.data.settlementWindowStateList)
        .catch((error: AxiosError<IApiErrorResponse>) => {
            const { code, message, ...rest } = axiosErrorHandler(error)
            if (code && message) {
                throw {
                    error_code: code,
                    description: getErrorMessageByCode(code),
                    default_error_message: message,
                    i18n_error_messages: null
                }
            }
            throw rest
        })
};

export const getSettlementModelList = async () => {
    const {
        user: { auth }
    } = store.getState()
    const uri = routes.getSettlementModelList
    const accessKey = auth?.accessKey as string
    const secretKey = auth?.secretKey as string
    const accessToken = await generateAccessToken({
        method: 'GET',
        uri,
        secret: secretKey
    })
    const { axios } = AxiosRequest(accessToken, accessKey)
    return axios
        .get<{ settlementModels: ISettlementModel[] }>(uri)
        .then((d) => d.data.settlementModels)
        .catch((error: AxiosError<IApiErrorResponse>) => {
            const { code, message, ...rest } = axiosErrorHandler(error)
            if (code && message) {
                throw {
                    error_code: code,
                    description: getErrorMessageByCode(code),
                    default_error_message: message,
                    i18n_error_messages: null
                }
            }
            throw rest
        })
};

export const getSettlementStateList = async () => {
    const {
        user: { auth }
    } = store.getState()
    const uri = routes.getSettlementStateList
    const accessKey = auth?.accessKey as string
    const secretKey = auth?.secretKey as string
    const accessToken = await generateAccessToken({
        method: 'GET',
        uri,
        secret: secretKey
    })
    const { axios } = AxiosRequest(accessToken, accessKey)
    return axios
        .get<{ settlementStateList: ISettlementState[] }>(uri)
        .then((d) => d.data.settlementStateList)
        .catch((error: AxiosError<IApiErrorResponse>) => {
            const { code, message, ...rest } = axiosErrorHandler(error)
            if (code && message) {
                throw {
                    error_code: code,
                    description: getErrorMessageByCode(code),
                    default_error_message: message,
                    i18n_error_messages: null
                }
            }
            throw rest
        })
};

export const getFinalizeSettlementList = async (values: IFinalizeSettlementForm) => {
    const {
        user: { auth }
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
                    description: getErrorMessageByCode(code),
                    default_error_message: message,
                    i18n_error_messages: null
                }
            }
            throw rest
        })
}

export const getSettlementWindowsList = async (values: ISettlementWindowForm) => {
    const {
        user: { auth }
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
            params: values
        })
        .then((d) => d.data.settlementWindowList)
        .catch((error: AxiosError<IApiErrorResponse>) => {
            const { code, message, ...rest } = axiosErrorHandler(error)
            if (code && message) {
                throw {
                    error_code: code,
                    description: getErrorMessageByCode(code),
                    default_error_message: message,
                    i18n_error_messages: null
                }
            }
            throw rest
        })
}

export const modifySettlementModel = async (data: {
    settlementModelId: string;
    name: string;
    modelType: string;
    currencyID: string;   // backend expects string, can be ''
    active: boolean;
    autoCloseWindow: boolean;
}) => {
    const {
        user: { auth }
    } = store.getState();
    const uri = routes.modifySettlementModel;
    const accessKey = auth?.accessKey as string;
    const secretKey = auth?.secretKey as string;

    const accessToken = await generateAccessToken({
        method: 'POST',
        uri,
        secret: secretKey,
        payload: data
    });
    const { axios } = AxiosRequest(accessToken, accessKey);
    return axios
        .post<{ is_modified: true }>(uri, data)
        .then((d) => d.data)
        .catch((error: AxiosError<IApiErrorResponse>) => {
            const { code, message, ...rest } = axiosErrorHandler(error);
            if (code && message) {
                throw {
                    error_code: code,
                    description: getErrorMessageByCode(code),
                    default_error_message: message,
                    i18n_error_messages: null
                };
            }
            throw rest;
        });
};

export const getSettlementSchedulerList = async(settlementModelId: string) => {
    const {
        user: { auth }
    } = store.getState()
    const uri = routes.getSettlementSchedulerList
    const accessKey = auth?.accessKey as string
    const secretKey = auth?.secretKey as string
    const accessToken = await generateAccessToken({
        method: 'GET',
        uri,
        secret: secretKey
    })
    const { axios } = AxiosRequest(accessToken, accessKey)
    return axios
        .get<{ settlementSchedulerList: any[] }>(uri, {
            params: {
                settlementModelId: settlementModelId
            }
        })
        .then((d) => d.data)
        .catch((error: AxiosError<IApiErrorResponse>) => {
            const { code, message, ...rest } = axiosErrorHandler(error)
            if (code && message) {
                throw {
                    error_code: code,
                    description: getErrorMessageByCode(code),
                    default_error_message: message,
                    i18n_error_messages: null
                }
            }
            throw rest
        })
}

export const createSettlementScheduler = async (data: ISettlementScheduleForm) => {
    const {
        user: { auth }
    } = store.getState()
    const uri = routes.createSettlementScheduler
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
                    description: getErrorMessageByCode(code),
                    default_error_message: message,
                    i18n_error_messages: null
                }
            }
            throw rest
        })
}

export const modifySettlementScheduler = async (data: ISettlementScheduleModifyForm) => {
    const {
        user: { auth }
    } = store.getState();
    const uri = routes.modifySettlementScheduler
    const accessKey = auth?.accessKey as string;
    const secretKey = auth?.secretKey as string;
    const accessToken = await generateAccessToken({
        method: 'POST',
        uri,
        secret: secretKey,
        payload: data
    });
    const { axios } = AxiosRequest(accessToken, accessKey);
    return axios
        .post<{ is_modified: true }>(uri, data)
        .then((d) => d.data)
        .catch((error: AxiosError<IApiErrorResponse>) => {
            const { code, message, ...rest } = axiosErrorHandler(error);
            if (code && message) {
                throw {
                    error_code: code,
                    description: getErrorMessageByCode(code),
                    default_error_message: message,
                    i18n_error_messages: null
                };
            }
            throw rest;
        });
};

export const removeSettlementScheduler = async (data: ISettlementScheduleRemoveForm ) => {
    const {
        user: { auth }
    } = store.getState();
    const uri = routes.removeSettlementScheduler
    const accessKey = auth?.accessKey as string;
    const secretKey = auth?.secretKey as string;
    const accessToken = await generateAccessToken({
        method: 'POST',
        uri,
        secret: secretKey,
        payload: data,
    });
    const { axios } = AxiosRequest(accessToken, accessKey);
    return axios
        .post<{ is_removed: true }>(uri, data)
        .then((d) => d.data)
        .catch((error: AxiosError<IApiErrorResponse>) => {
            const { code, message, ...rest } = axiosErrorHandler(error);
            if (code && message) {
                throw {
                    error_code: code,
                    description: getErrorMessageByCode(code),
                    default_error_message: message,
                    i18n_error_messages: null
                };
            }
            throw rest;
        });
};
export const getNetTransferAmountByWindow = async (settlementWindowId: string) => {
    const {
        user: { auth }
    } = store.getState()
    const uri = routes.getNetTransferAmountByWindowId
    const accessKey = auth?.accessKey as string
    const secretKey = auth?.secretKey as string
    const accessToken = await generateAccessToken({
        method: 'GET',
        uri,
        secret: secretKey
    })
    const { axios } = AxiosRequest(accessToken, accessKey)

    return axios
        .get<INetTransferAmount>(uri, {
            params: {
                settlementWindowId: settlementWindowId
            }
        })
        .then((d) => d.data)
        .catch((error: AxiosError<IApiErrorResponse>) => {
            const { code, message, ...rest } = axiosErrorHandler(error)
            if (code && message) {
                throw {
                    error_code: code,
                    description: getErrorMessageByCode(code),
                    default_error_message: message,
                    i18n_error_messages: null
                }
            }
            throw rest
        })
}

export const getNetTransferAmountBySettlement = async (settlementId: string) => {
    const {
        user: { auth }
    } = store.getState()
    const uri = routes.getNetTransferAmountBySettlementId
    const accessKey = auth?.accessKey as string
    const secretKey = auth?.secretKey as string
    const accessToken = await generateAccessToken({
        method: 'GET',
        uri,
        secret: secretKey
    })
    const { axios } = AxiosRequest(accessToken, accessKey)

    return axios
        .get<INetTransferAmount>(uri, {
            params: {
                settlementId: settlementId
            }
        })
        .then((d) => d.data)
        .catch((error: AxiosError<IApiErrorResponse>) => {
            const { code, message, ...rest } = axiosErrorHandler(error)
            if (code && message) {
                throw {
                    error_code: code,
                    description: getErrorMessageByCode(code),
                    default_error_message: message,
                    i18n_error_messages: null
                }
            }
            throw rest
        })
}

export const createSettlementWindow = async (data: ISettlementWindowCreateForm) => {
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
                    description: getErrorMessageByCode(code),
                    default_error_message: message,
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
                    description: getErrorMessageByCode(code),
                    default_error_message: message,
                    i18n_error_messages: null
                }
            }
            throw rest
        })
}


export const finalizeSettlementWindow = async (data: { settlementId: string }) => {
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
        .post<{ finalized: true }>(uri, data)
        .then((d) => d.data)
        .catch((error: AxiosError<IApiErrorResponse>) => {
            const { code, message, ...rest } = axiosErrorHandler(error)
            if (code && message) {
                throw {
                    error_code: code,
                    description: getErrorMessageByCode(code),
                    default_error_message: message,
                    i18n_error_messages: null
                }
            }
            throw rest
        })
}
