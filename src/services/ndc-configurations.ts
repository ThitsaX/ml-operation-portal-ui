// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import AxiosRequest, { generateAccessToken, routes } from '@helpers/api';
import { axiosErrorHandler, getErrorMessageByCode } from '@helpers/errors';
import { store } from '@store';
import {
  type IApiErrorResponse,
  type INdcSchemeConfiguration,
  type IModifyNdcSchemeConfigurationRequest,
  type IModifyNdcSchemeConfigurationResponse,
  type INdcWorkerConfigurationResponse,
  type IModifyNdcWorkerConfigurationRequest,
  type IModifyNdcWorkerConfigurationResponse,
  type INdcDfspConfiguration,
  type ICreateNdcDfspConfigurationRequest,
  type ICreateNdcDfspConfigurationResponse,
  type INdcThresholdDetailsRequest,
  type INdcThresholdDetailsResponse,
  type INdcDeliveryLogsRequest,
  type INdcDeliveryLogsResponse,
  type ICreateNdcThresholdApprovalRequest,
  type ICreateNdcThresholdApprovalResponse,
  type INdcThresholdApprovalsRequest,
  type INdcThresholdApprovalsResponse,
  type IModifyNdcThresholdApprovalDecisionRequest,
  type IModifyNdcThresholdApprovalDecisionResponse,
} from '@typescript/services';
import { type AxiosError } from 'axios';

export const DEFAULT_NDC_WORKER_JOB_NAME = 'NdcThresholdWorker';

const parseJsonWithLargeIntegersAsStrings = (data: string) => {
  if (!data) return data;

  return JSON.parse(data.replace(/:\s*(-?\d{16,})(?=[,\]}])/g, ': "$1"'));
};

export const getSchemeThresholdConfiguration = async () => {
  const {
    user: { auth }
  } = store.getState();
  const uri = routes.getSchemeThresholdConfiguration;
  const accessKey = auth?.accessKey as string;
  const secretKey = auth?.secretKey as string;
  const accessToken = await generateAccessToken({
    method: 'GET',
    uri,
    secret: secretKey
  });
  const { axios } = AxiosRequest(accessToken, accessKey);
  return axios
    .get<INdcSchemeConfiguration>(uri, {
      transformResponse: [parseJsonWithLargeIntegersAsStrings]
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

export const modifyNdcSchemeConfiguration = async (
  id: string,
  data: IModifyNdcSchemeConfigurationRequest
) => {
  const {
    user: { auth }
  } = store.getState();
  const uri = routes.modifyThresholdConfiguration;
  const accessKey = auth?.accessKey as string;
  const secretKey = auth?.secretKey as string;
  const accessToken = await generateAccessToken({
    method: 'PUT',
    uri,
    secret: secretKey,
    payload: data
  });
  const { axios } = AxiosRequest(accessToken, accessKey);
  return axios
    .put<IModifyNdcSchemeConfigurationResponse>(uri, data, {
      params: { id },
      transformResponse: [parseJsonWithLargeIntegersAsStrings]
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

export const getNdcWorkerConfiguration = async (schedulerConfigId: string) => {
  const {
    user: { auth }
  } = store.getState();
  const uri = routes.getSchedulerConfigById;
  const accessKey = auth?.accessKey as string;
  const secretKey = auth?.secretKey as string;
  const accessToken = await generateAccessToken({
    method: 'GET',
    uri,
    secret: secretKey
  });
  const { axios } = AxiosRequest(accessToken, accessKey);
  return axios
    .get<INdcWorkerConfigurationResponse>(uri, {
      params: { schedulerConfigId },
      transformResponse: [parseJsonWithLargeIntegersAsStrings]
    })
    .then((d) => d.data.config)
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

export const getNdcWorkerConfigurationByJobName = async (
  jobName = DEFAULT_NDC_WORKER_JOB_NAME
) => {
  const {
    user: { auth }
  } = store.getState();
  const uri = routes.getSchedulerConfigByJobName;
  const accessKey = auth?.accessKey as string;
  const secretKey = auth?.secretKey as string;
  const accessToken = await generateAccessToken({
    method: 'GET',
    uri,
    secret: secretKey
  });
  const { axios } = AxiosRequest(accessToken, accessKey);
  return axios
    .get<INdcWorkerConfigurationResponse>(uri, {
      params: { jobName },
      transformResponse: [parseJsonWithLargeIntegersAsStrings]
    })
    .then((d) => d.data.config)
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
export const modifyWorkerConfig = async (
  id: string,
  data: IModifyNdcWorkerConfigurationRequest
) => {
  const {
    user: { auth }
  } = store.getState();
  const uri = routes.modifyWorkerConfig;
  const accessKey = auth?.accessKey as string;
  const secretKey = auth?.secretKey as string;
  const accessToken = await generateAccessToken({
    method: 'PUT',
    uri,
    secret: secretKey,
    payload: data
  });
  const { axios } = AxiosRequest(accessToken, accessKey);
  return axios
    .put<IModifyNdcWorkerConfigurationResponse>(uri, data, {
      params: { schedulerConfigId: id }
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

export const getNdcDfspConfiguration = async (dfspId: string) => {
  const {
    user: { auth }
  } = store.getState();
  const uri = routes.getNdcDfspConfiguration;
  const accessKey = auth?.accessKey as string;
  const secretKey = auth?.secretKey as string;
  const accessToken = await generateAccessToken({
    method: 'GET',
    uri,
    secret: secretKey
  });
  const { axios } = AxiosRequest(accessToken, accessKey);
  return axios
    .get<INdcDfspConfiguration>(uri, {
      params: { dfspId },
      transformResponse: [parseJsonWithLargeIntegersAsStrings]
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

export const createNdcDfspConfiguration = async (
  data: ICreateNdcDfspConfigurationRequest
) => {
  const {
    user: { auth }
  } = store.getState();
  const uri = routes.createThresholdConfiguration;
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
    .post<ICreateNdcDfspConfigurationResponse>(uri, data, {
      transformResponse: [parseJsonWithLargeIntegersAsStrings]
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

export const modifyNdcDfspConfiguration = async (
  id: string,
  data: IModifyNdcSchemeConfigurationRequest
) => {
  const {
    user: { auth }
  } = store.getState();
  const uri = routes.modifyThresholdConfiguration;
  const accessKey = auth?.accessKey as string;
  const secretKey = auth?.secretKey as string;
  const accessToken = await generateAccessToken({
    method: 'PUT',
    uri,
    secret: secretKey,
    payload: data
  });
  const { axios } = AxiosRequest(accessToken, accessKey);
  return axios
    .put<IModifyNdcSchemeConfigurationResponse>(uri, data, {
      params: { id },
      transformResponse: [parseJsonWithLargeIntegersAsStrings]
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

export const getDeliveryLogs = async ({
  deliveryStatus,
  page,
  pageSize
}: INdcDeliveryLogsRequest) => {
  const {
    user: { auth }
  } = store.getState();
  const uri = routes.getDeliveryLogs;
  const accessKey = auth?.accessKey as string;
  const secretKey = auth?.secretKey as string;
  const accessToken = await generateAccessToken({
    method: 'GET',
    uri,
    secret: secretKey
  });
  const { axios } = AxiosRequest(accessToken, accessKey);
  return axios
    .get<INdcDeliveryLogsResponse>(uri, {
      params: {
        ...(deliveryStatus ? { deliveryStatus } : {}),
        page,
        pageSize
      },
      transformResponse: [parseJsonWithLargeIntegersAsStrings]
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
export const createNdcThresholdApproval = async (
  data: ICreateNdcThresholdApprovalRequest
) => {
  const {
    user: { auth }
  } = store.getState();
  const uri = routes.createNdcThresholdApproval;
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
    .post<ICreateNdcThresholdApprovalResponse>(uri, data, {
      transformResponse: [parseJsonWithLargeIntegersAsStrings]
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
export const getNdcThresholdApprovals = async (
  params: INdcThresholdApprovalsRequest
): Promise<INdcThresholdApprovalsResponse> => {
  const {
    user: { auth }
  } = store.getState();
  const uri = routes.getNdcThresholdApprovals;
  const accessKey = auth?.accessKey as string;
  const secretKey = auth?.secretKey as string;
  const accessToken = await generateAccessToken({
    method: 'GET',
    uri,
    secret: secretKey
  });
  const { axios } = AxiosRequest(accessToken, accessKey);
  return axios
    .get<INdcThresholdApprovalsResponse>(uri, {
      params,
      transformResponse: [parseJsonWithLargeIntegersAsStrings]
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

export const modifyNdcThresholdApprovalDecision = async (
  approvalRequestId: string,
  data: IModifyNdcThresholdApprovalDecisionRequest
) => {
  const {
    user: { auth }
  } = store.getState();
  const uri = `${routes.modifyNdcThresholdApprovalDecision}/${approvalRequestId}/decision`;
  const accessKey = auth?.accessKey as string;
  const secretKey = auth?.secretKey as string;
  const accessToken = await generateAccessToken({
    method: 'PUT',
    uri,
    secret: secretKey,
    payload: data
  });
  const { axios } = AxiosRequest(accessToken, accessKey);
  return axios
    .put<IModifyNdcThresholdApprovalDecisionResponse>(uri, data, {
      transformResponse: [parseJsonWithLargeIntegersAsStrings]
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

export const getThresholdDetailList = async (params: INdcThresholdDetailsRequest) => {
  const {
    user: { auth }
  } = store.getState();
  const uri = routes.getThresholdDetailList;
  const accessKey = auth?.accessKey as string;
  const secretKey = auth?.secretKey as string;
  const accessToken = await generateAccessToken({
    method: 'GET',
    uri,
    secret: secretKey
  });
  const { axios } = AxiosRequest(accessToken, accessKey);
  return axios
    .get<INdcThresholdDetailsResponse>(uri, {
      params,
      transformResponse: [parseJsonWithLargeIntegersAsStrings]
    })
    .then((d) => d.data.thresholdDetails)
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


