import AxiosRequest, { generateAccessToken, routes } from '@helpers/api';
import { axiosErrorHandler, getErrorMessageByCode } from '@helpers/errors';
import { store } from '@store';
import { type IUserState } from '@store/features/user';
import {
  type IApiErrorResponse,
} from '@typescript/services';
import { type IGetSettlementIds } from '@typescript/services/report';
import { type AxiosError } from 'axios';
import moment from 'moment';

const contentTypes = {
  csv: 'text/csv;',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;',
  pdf: 'application/pdf;'
};

export const generateSettlementDetailReport = async (params: any) => {
  const {
    user: { auth }
  } = store.getState();

  const accessToken = await generateAccessToken({
    method: 'POST',
    uri: routes.generateDetailReport,
    secret: auth?.secretKey as string
  });

  const { axios } = AxiosRequest(accessToken, auth?.accessKey);
  return axios
    .post<any>(routes.generateDetailReport, null, {
      params
    })
    .then((d) => {
      return d.data;
    })
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

export const generateAuditReport = async (params: any) => {
  const {
    user: { auth }
  } = store.getState();

  const accessToken = await generateAccessToken({
    method: 'POST',
    uri: routes.generateAuditReport,
    secret: auth?.secretKey as string
  });

  const { axios } = AxiosRequest(accessToken, auth?.accessKey);
  return axios
    .post<any>(routes.generateAuditReport, null, {
      params
    })
    .then((d) => {
      return d.data;
    })
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

export const generateSettlementAuditReport = async (params: any) => {
  const {
    user: { auth }
  } = store.getState();

  const accessToken = await generateAccessToken({
    method: 'POST',
    uri: routes.generateSettlementAuditReport,
    secret: auth?.secretKey as string
  });

  const { axios } = AxiosRequest(accessToken, auth?.accessKey);
  return axios
    .post<any>(routes.generateSettlementAuditReport, null, {
      params
    })
    .then((d) => {
      return d.data;
    })
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

export const generateSettlementReport = async (params: any) => {
  const {
    user: { auth }
  } = store.getState();
  const accessToken = await generateAccessToken({
    method: 'POST',
    uri: routes.generateSettlementReport,
    secret: auth?.secretKey as string
  });

  const { axios } = AxiosRequest(accessToken, auth?.accessKey);
  return axios
    .post<any>(routes.generateSettlementReport, null, { params })
    .then((d) => d.data)
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

export const generateSettlementStatementReport = async (
  user: IUserState,
  params: any
) => {


  const accessToken = await generateAccessToken({
    method: 'POST',
    uri: routes.generateSettlementStatementReport,
    secret: user.auth?.secretKey as string
  });

  const { axios } = AxiosRequest(accessToken, user.auth?.accessKey);
  return axios
    .post<any>(routes.generateSettlementStatementReport, null, {
      params
    })
    .then((d) => {
      return d.data;
    })
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

export const generateSettlementBankReport = async (
  user: IUserState,
  paramsValues: any
) => {
  const params = {
    settlementId: paramsValues.settlementId,
    currencyId: paramsValues.currencyId,
    fileType: paramsValues.fileType,
    timezoneOffset: paramsValues.timezoneOffset,
  };

  const accessToken = await generateAccessToken({
    method: 'POST',
    uri: routes.generateSettlementBankReport,
    secret: user.auth?.secretKey as string
  });

  const { axios } = AxiosRequest(accessToken, user.auth?.accessKey);
  return axios
    .post<any>(routes.generateSettlementBankReport, null, {
      params
    })
    .then((d) => {
      return d.data;
    })
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

export const getSettlementIds = async (
  user: IUserState,
  startDate: string,
  endDate: string,
  dfspId: string,
  tzOffSet: string
) => {
  /** Generate Access Token */
  const accessToken = await generateAccessToken({
    method: 'GET',
    uri: routes.getSettlementId,
    secret: user.auth?.secretKey as string
  });

  const { axios } = AxiosRequest(accessToken, user.auth?.accessKey);
  return axios
    .get<IGetSettlementIds>(routes.getSettlementId, {
      params: {
        startDate: startDate,
        endDate: endDate,
        dfspId: dfspId,
        timezoneOffset: tzOffSet
      }
    })
    .then((d) => d.data)
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


export const downloadFile = (
  initialFileName: string,
  fileType: string,
  base64String: string
) => {
  let downloadContentType = '';

  if (fileType == 'csv') {
    downloadContentType = contentTypes.csv;
  } else if (fileType == 'xlsx') {
    downloadContentType = contentTypes.xlsx;
  }else if (fileType == 'pdf') {
    downloadContentType = contentTypes.pdf;
  } 
  else {
    throw 'Content type not supported';
  }

  const downloadLink = document.createElement('a');
  const linkSource = `data:${downloadContentType}base64,${base64String}`;
  downloadLink.href = linkSource;
  downloadLink.download = `${initialFileName}-${moment().format('DDMMMYYYY')}`;
  downloadLink.target = '_blank';
  downloadLink.click();
};
