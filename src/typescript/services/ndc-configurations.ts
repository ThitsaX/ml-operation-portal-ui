// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
export interface INdcSchemeConfiguration {
  thresholdConfigurationId: string | number;
  thresholdScopeType: 'SCHEME' | string;
  dfspId: string | null;
  thresholdEnabled: boolean;
  ndcConfigurationStatus: 'ACTIVE' | 'INACTIVE' | string;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface IModifyNdcSchemeConfigurationRequest {
  thresholdEnabled: boolean;
  status: 'ACTIVE' | 'INACTIVE' | string;
}

export interface IModifyNdcSchemeConfigurationResponse {
  thresholdConfigurationId: string;
  modified: boolean;
}

export interface ISchedulerConfigId {
  id: string | number;
  entityId?: string | number;
}

export interface INdcWorkerConfiguration {
  schedulerConfigId: string | number | ISchedulerConfigId;
  name: string;
  jobName: string;
  cronExpression?: string;
  description: string;
  zoneId: string;
  active: boolean;
  runEvery?: string;
}

export interface INdcWorkerConfigurationResponse {
  config: INdcWorkerConfiguration;
}

export interface IModifyNdcWorkerConfigurationRequest {
  name: string;
  jobName: string;
  description: string;
  runEvery: string;
  zoneId: string;
  active: boolean;
}

export interface IModifyNdcWorkerConfigurationResponse {
  updated: boolean;
}

export interface INdcDfspConfiguration extends INdcSchemeConfiguration {
  thresholdScopeType: 'DFSP' | string;
  dfspId: string;
  schemeEnabled?: boolean;
  createBy?: string | null;
}

export interface ICreateNdcDfspConfigurationRequest {
  scopeType: 'DFSP';
  dfspId: string;
  thresholdEnabled: boolean;
}

export interface ICreateNdcDfspConfigurationResponse {
  thresholdConfigurationId: string | number;
}

export type NdcDeliveryStatus = 'PENDING' | 'SENT' | 'FAILED' | 'RETRYING';

export interface INdcDeliveryLog {
  ndcNotificationDispatchLogId: string | number;
  alertEventId: string;
  participantName: string;
  currency: string;
  recipientType: string;
  recipientUserId: string;
  recipientName: string;
  recipientEmail: string;
  deliveryStatus: NdcDeliveryStatus | string;
  attemptNo: number;
  lastAttemptAt: number;
  sentAt: number;
  errorMessage: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface INdcDeliveryLogsRequest {
  deliveryStatus?: NdcDeliveryStatus | string;
  page: number;
  pageSize: number;
}

export interface INdcDeliveryLogsResponse {
  deliveryLogs: INdcDeliveryLog[];
  total: number;
  totalPages: number;
}
export type NdcThresholdApprovalOperation =
  | 'CREATE_NDC_ALERT_THRESHOLD'
  | 'UPDATE_NDC_VISUAL_ALERT'
  | 'UPDATE_NDC_NOTIFICATION_ALERT'
  | 'UPDATE_NDC_VISUAL_AND_NOTIFICATION_ALERT'
  | 'DELETE_NDC_ALERT_THRESHOLD';

export interface ICreateNdcThresholdApprovalRequest {
  operation: NdcThresholdApprovalOperation;
  participantName: string;
  thresholdDetailId?: string;
  currency: string;
  visualConfig?: number;
  notificationConfig?: number;
}

export interface ICreateNdcThresholdApprovalResponse {
  approvalRequestId: string;
  status: 'PENDING' | string;
}

export type NdcThresholdApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface INdcThresholdApproval {
  approvalRequestId: string;
  operation: NdcThresholdApprovalOperation | string;
  participantName: string;
  currency: string;
  thresholdDetailId: string | number | null;
  previousVisualConfig: number | null;
  requestedVisualConfig: number | null;
  previousNotificationConfig: number | null;
  requestedNotificationConfig: number | null;
  requestedBy: string;
  requestedAt: string;
  respondedBy: string | null;
  respondedAt: string | null;
  status: NdcThresholdApprovalStatus | string;
}

export interface INdcThresholdApprovalsRequest {
  status: NdcThresholdApprovalStatus | string;
  page: number;
  pageSize: number;
}

export interface INdcThresholdApprovalsResponse {
  approvals: INdcThresholdApproval[];
  total?: number;
  totalPages?: number;
}

export interface IModifyNdcThresholdApprovalDecisionRequest {
  action: 'APPROVED' | 'REJECTED';
}

export interface IModifyNdcThresholdApprovalDecisionResponse {
  approvalRequestId: string;
  status: NdcThresholdApprovalStatus | string;
}
export interface INdcThresholdDetail {
  id: string | number;
  thresholdConfigurationId: string | number;
  currency: string;
  visualConfig: number;
  ndcConfig: number;
  status: boolean;
}

export interface INdcThresholdDetailsRequest {
  thresholdConfigurationId: string | number;
  status?: boolean;
}

export interface INdcThresholdDetailsResponse {
  thresholdDetails: INdcThresholdDetail[];
}


