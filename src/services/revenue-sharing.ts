// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import AxiosRequest, { generateAccessToken, routes } from '@helpers/api';
import { axiosErrorHandler, getErrorMessageByCode } from '@helpers/errors';
import { store } from '@store';
import {
  type IApiErrorResponse,
  type ICreateRevenuePartyRequest,
  type IGetPendingRevenueApprovalListResponse,
  type IGetRevenueConfigListResponse,
  type IGetRevenuePartyListResponse,
  type IModifyRevenueApprovalActionRequest,
  type IModifyRevenueApprovalActionResponse,
  type IModifyRevenuePartyRequest,
  type IModifyRevenuePartyStatusRequest,
  type IRevenueApprovalRequestResponse,
  type IRevenueConfig,
  type IRevenueConfigApprovalRequest,
  type IRevenueParty,
  type IRevenuePartyMutationResponse,
  type IRevenuePendingApproval,
  type IRevenueRoundingPolicy,
  type IRevenueRoundingPolicyMutationResponse
} from '@typescript/services';
import { type AxiosError } from 'axios';

const parseRevenuePartyList = (
  response: IGetRevenuePartyListResponse | IRevenueParty[]
) => {
  if (Array.isArray(response)) return response;

  return (
    response.revenuePartyList ||
    response.revenueParties ||
    response.partyList ||
    response.data ||
    []
  );
};

const parseRevenueConfigList = (
  response: IGetRevenueConfigListResponse | IRevenueConfig[]
) => {
  if (Array.isArray(response)) return response;

  return (
    response.revenueConfigList ||
    response.revenueConfigs ||
    response.configList ||
    response.data ||
    []
  );
};

const parsePendingRevenueApprovalList = (
  response: IGetPendingRevenueApprovalListResponse | IRevenuePendingApproval[]
) => {
  if (Array.isArray(response)) return response;

  return (
    response.pendingApprovalList ||
    response.pendingRevenueApprovalList ||
    response.approvals ||
    response.data ||
    []
  );
};


export const getRevenuePartyList = async () => {
  const {
    user: { auth }
  } = store.getState();
  const uri = routes.getRevenuePartyList;
  const accessKey = auth?.accessKey as string;
  const secretKey = auth?.secretKey as string;
  const accessToken = await generateAccessToken({
    method: 'GET',
    uri,
    secret: secretKey
  });
  const { axios } = AxiosRequest(accessToken, accessKey);
  return axios
    .get<IGetRevenuePartyListResponse | IRevenueParty[]>(uri)
    .then((d) => parseRevenuePartyList(d.data))
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

export const createRevenueParty = async (
  data: ICreateRevenuePartyRequest
) => {
  const {
    user: { auth }
  } = store.getState();
  const uri = routes.createRevenueParty;
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
    .post<IRevenuePartyMutationResponse>(uri, data)
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

export const modifyRevenueParty = async (
  data: IModifyRevenuePartyRequest
) => {
  const {
    user: { auth }
  } = store.getState();
  const uri = routes.modifyRevenueParty;
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
    .post<IRevenuePartyMutationResponse>(uri, data)
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

export const modifyRevenuePartyStatus = async (
  data: IModifyRevenuePartyStatusRequest
) => {
  const {
    user: { auth }
  } = store.getState();
  const uri = routes.modifyRevenuePartyStatus;
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
    .post<IRevenuePartyMutationResponse>(uri, data)
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

export const getRevenueConfigList = async () => {
  const {
    user: { auth }
  } = store.getState();
  const uri = routes.getRevenueConfigList;
  const accessKey = auth?.accessKey as string;
  const secretKey = auth?.secretKey as string;
  const accessToken = await generateAccessToken({
    method: 'GET',
    uri,
    secret: secretKey
  });
  const { axios } = AxiosRequest(accessToken, accessKey);
  return axios
    .get<IGetRevenueConfigListResponse | IRevenueConfig[]>(uri)
    .then((d) => parseRevenueConfigList(d.data))
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

export const createRevenueApprovalRequest = async (
  data: IRevenueConfigApprovalRequest
) => {
  const {
    user: { auth }
  } = store.getState();
  const uri = routes.createRevenueApprovalRequest;
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
    .post<IRevenueApprovalRequestResponse>(uri, data)
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

export const getPendingRevenueApprovalList = async () => {
  const {
    user: { auth }
  } = store.getState();
  const uri = routes.getPendingRevenueApprovalList;
  const accessKey = auth?.accessKey as string;
  const secretKey = auth?.secretKey as string;
  const accessToken = await generateAccessToken({
    method: 'GET',
    uri,
    secret: secretKey
  });
  const { axios } = AxiosRequest(accessToken, accessKey);
  return axios
    .get<IGetPendingRevenueApprovalListResponse | IRevenuePendingApproval[]>(uri)
    .then((d) => parsePendingRevenueApprovalList(d.data))
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

export const modifyRevenueApprovalAction = async (
  data: IModifyRevenueApprovalActionRequest
) => {
  const {
    user: { auth }
  } = store.getState();
  const uri = routes.modifyRevenueApprovalAction;
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
    .post<IModifyRevenueApprovalActionResponse>(uri, data)
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

export const getRevenueRoundingPolicy = async () => {
  const {
    user: { auth }
  } = store.getState();
  const uri = routes.getRevenueRoundingPolicy;
  const accessKey = auth?.accessKey as string;
  const secretKey = auth?.secretKey as string;
  const accessToken = await generateAccessToken({
    method: 'GET',
    uri,
    secret: secretKey
  });
  const { axios } = AxiosRequest(accessToken, accessKey);
  return axios
    .get<IRevenueRoundingPolicy>(uri)
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

export const createRevenueRoundingPolicy = async (
  data: IRevenueRoundingPolicy
) => {
  const {
    user: { auth }
  } = store.getState();
  const uri = routes.createRevenueRoundingPolicy;
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
    .post<IRevenueRoundingPolicyMutationResponse>(uri, data)
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
