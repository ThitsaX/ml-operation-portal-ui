import AxiosRequest, { generateAccessToken, routes } from '@helpers/api';
import { axiosErrorHandler, getErrorMessageByCode } from '@helpers/errors';
import { store } from '@store';
import { type IUserState } from '@store/features/user';
import {
  type IApiErrorResponse,
  type IGetAllOtherParticipant
} from '@typescript/services';
import { type IGetSettlementIds } from '@typescript/services/report';
import { type AxiosError } from 'axios';
import moment from 'moment';

const contentTypes = {
  csv: 'text/csv;',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;'
};

export const generateSettlementDetailReport = async (params: any) => {
  const {
    user: { auth }
  } = store.getState();

  const accessToken = await generateAccessToken({
    method: 'POST',
    uri: routes.generate_settlement_detail_report,
    secret: auth?.secretKey as string
  });

  const { axios } = AxiosRequest(accessToken, auth?.accessKey);
  return axios
    .post<any>(routes.generate_settlement_detail_report, null, {
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
    uri: routes.generate_settlement_report,
    secret: auth?.secretKey as string
  });

  const { axios } = AxiosRequest(accessToken, auth?.accessKey);
  return axios
    .post<any>(routes.generate_settlement_report, null, { params })
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
  paramsValues: any
) => {
  const params = {
    start_date: paramsValues.startDate,
    end_date: paramsValues.endDate,
    fsp_id: user.data?.participantName,
    timezoneoffset: paramsValues.timezoneoffset,
    file_type: paramsValues.fileType
  };

  const accessToken = await generateAccessToken({
    method: 'POST',
    uri: routes.generate_settlement_statement_report,
    secret: user.auth?.secretKey as string
  });

  const { axios } = AxiosRequest(accessToken, user.auth?.accessKey);
  return axios
    .post<any>(routes.generate_settlement_statement_report, null, {
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

export const generateFeeReport = async (
  user: IUserState,
  paramsValues: any
) => {
  const params = {
    start_date: paramsValues.startDate,
    end_date: paramsValues.endDate,
    from_fsp_id: paramsValues.fromFspId,
    to_fsp_id: paramsValues.toFspId,
    time_zone_offset: paramsValues.tzOffSet,
    file_type: paramsValues.fileType
  };

  const accessToken = await generateAccessToken({
    method: 'POST',
    uri: routes.generate_fee_report,
    secret: user.auth?.secretKey as string
  });

  const { axios } = AxiosRequest(accessToken, user.auth?.accessKey);
  return axios
    .post<any>(routes.generate_fee_report, null, {
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
  tzOffSet: string
) => {
  /** Generate Access Token */
  const accessToken = await generateAccessToken({
    method: 'GET',
    uri: routes.get_settlementIds,
    secret: user.auth?.secretKey as string
  });

  const { axios } = AxiosRequest(accessToken, user.auth?.accessKey);
  return axios
    .get<IGetSettlementIds>(routes.get_settlementIds, {
      params: {
        start_date: startDate,
        end_date: endDate,
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

export const getAllOtherParticipants = async (
  user: IUserState,
  params: any
) => {
  const { participantId } = params;

  /** Generate Access Token */
  const accessToken = await generateAccessToken({
    method: 'GET',
    uri: routes.get_all_other_participants,
    secret: user.auth?.secretKey as string
  });

  const { axios } = AxiosRequest(accessToken, user.auth?.accessKey);
  return axios
    .get<IGetAllOtherParticipant>(routes.get_all_other_participants, {
      params: { participantId: participantId }
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
  } else {
    throw 'Content type not supported';
  }

  const downloadLink = document.createElement('a');
  const linkSource = `data:${downloadContentType}base64,${base64String}`;
  downloadLink.href = linkSource;
  downloadLink.download = `${initialFileName}_${moment().format('DD-MM-YYYY')}`;
  downloadLink.target = '_blank';
  downloadLink.click();
};
