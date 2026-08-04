// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.

export type RevenuePartyStatus = 'ACTIVE' | 'INACTIVE';
export type RevenuePartyType = 'Responsible Ministry' | '3rd Party' | string;

export interface IRevenueParty {
  revenuePartyId?: string;
  partyCode?: string;
  partyName?: string;
  partyType?: RevenuePartyType;
  description?: string | null;
  partyId?: string;
  name?: string;
  type?: RevenuePartyType;
  status?: RevenuePartyStatus | string;
  isActive?: boolean | string | null;
  lastUpdatedDate?: string | number | null;
  updatedAt?: string | number | null;
  modifiedBy?: string | null;
  updatedBy?: string | null;
  createdBy?: string | null;
}

export interface IRevenuePartyFormValues {
  revenuePartyId?: string;
  partyCode: string;
  partyName: string;
  partyType: RevenuePartyType;
  description: string;
  status: RevenuePartyStatus;
}

export interface IGetRevenuePartyListResponse {
  revenuePartyList?: IRevenueParty[];
  revenueParties?: IRevenueParty[];
  partyList?: IRevenueParty[];
  data?: IRevenueParty[];
}

export type ICreateRevenuePartyRequest = Omit<IRevenuePartyFormValues, 'revenuePartyId'>;

export interface IModifyRevenuePartyRequest {
  revenuePartyId: string;
  partyCode: string;
  partyName: string;
  partyType: RevenuePartyType;
  description: string;
}

export interface IModifyRevenuePartyStatusRequest {
  revenuePartyId: string;
  status: RevenuePartyStatus;
}

export interface IRevenuePartyMutationResponse {
  is_created?: true;
  isModified?: true;
  modified?: true;
}

export type RevenueConfigCategory = 'DOMESTIC' | 'CROSS_BORDER' | string;
export type RevenueConfigStatus = 'CURRENT' | 'FUTURE' | 'INACTIVE' | string;
export enum RevenueConfigRequestedActionEnum {
  CREATE = 'CREATE_REVENUE_CONFIG',
  UPDATE = 'UPDATE_REVENUE_CONFIG',
  DELETE = 'DELETE_REVENUE_CONFIG',
  DEACTIVATE = 'DEACTIVATE_REVENUE_CONFIG'
}

export type RevenueConfigRequestedAction = `${RevenueConfigRequestedActionEnum}`;

export interface IRevenueSplitPercentages {
  GOL: number | string;
  MINISTRY: number | string;
  '3PP': number | string;
  SENDING_DFSP: number | string;
}

export interface IRevenueConfig {
  revenueConfigId: string;
  taxCodeId: string;
  taxCodeDescription: string;
  responsibleMinistryCode: string;
  responsibleMinistryName?: string | null;
  thirdPartyProviderCode?: string | null;
  thirdPartyProviderName?: string | null;
  category: RevenueConfigCategory;
  effectiveDate: string;
  effectiveTimezone: string;
  effectiveDateDisplay?: string | null;
  effective_date?: string | null;
  effective_date_display?: string | null;
  effective_timezone?: string | null;
  percentages?: IRevenueSplitPercentages;
  golPercentage?: number;
  ministryPercentage?: number;
  thirdPartyPercentage?: number;
  sendingDfspPercentage?: number;
  lastUpdatedDate?: string | number | null;
  modifiedBy?: string | null;
  status?: RevenueConfigStatus;
}

export interface IRevenueConfigFormValues {
  revenueConfigId?: string;
  taxCodeId: string;
  taxCodeDescription: string;
  responsibleMinistryCode: string;
  thirdPartyProviderCode: string;
  category: RevenueConfigCategory;
  effectiveDate: string;
  effectiveTimezone: string;
  percentages: IRevenueSplitPercentages;
}

export type IRevenueConfigApprovalRequest = IRevenueConfigFormValues & {
  requestedAction: RevenueConfigRequestedAction;
  revenueConfigId?: string;
};

export interface IGetRevenueConfigListResponse {
  revenueConfigList?: IRevenueConfig[];
  revenueConfigs?: IRevenueConfig[];
  configList?: IRevenueConfig[];
  data?: IRevenueConfig[];
}

export interface IRevenueApprovalRequestResponse {
  is_created?: true;
  submitted?: true;
  approvalRequestId?: string;
}


export type RevenueApprovalAction = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface IRevenueApprovalDetail {
  tabCode?: string | null;
  fieldKey: string;
  fieldLabel: string;
  fieldValue?: string | number | null;
  beforeValue?: string | number | null;
  afterValue?: string | number | null;
  valueType?: string | null;
  displayOrder?: number | null;
}

export interface IRevenuePendingApproval {
  approvalRequestId: string;
  requestedAction: RevenueConfigRequestedAction | string;
  participantName?: string | null;
  currency?: string | null;
  amount?: number | null;
  requestedBy: string;
  requestedDateTime: number;
  respondedBy?: string | null;
  respondedDateTime?: number | null;
  action: RevenueApprovalAction | string;
  reason?: string | null;
  requestCategory?: string | null;
  details?: IRevenueApprovalDetail[];
}

export interface IGetPendingRevenueApprovalListResponse {
  pendingApprovalList?: IRevenuePendingApproval[];
  pendingRevenueApprovalList?: IRevenuePendingApproval[];
  approvals?: IRevenuePendingApproval[];
  data?: IRevenuePendingApproval[];
}

export interface IModifyRevenueApprovalActionRequest {
  approvalRequestId: string;
  action: Exclude<RevenueApprovalAction, 'PENDING'>;
  reason?: string;
}

export interface IModifyRevenueApprovalActionResponse {
  is_created?: true;
  isModified?: true;
  modified?: true;
}

export type RevenueRoundingMode = 'UP' | 'DOWN';
export type RevenueRemainderRecipient = 'GOL_GRA' | 'MINISTRY' | 'THIRD_PARTY' | 'DFSP';

export interface IRevenueRoundingPolicy {
  revenueRoundingPolicyId?: string;
  roundingMode: RevenueRoundingMode;
  remainderRecipient: RevenueRemainderRecipient;
  createdAt?: number | string | null;
  createdBy?: string | null;
  updatedAt?: number | string | null;
  updatedBy?: string | null;
}


export interface IRevenueRoundingPolicyMutationResponse {
  is_created?: true;
  isModified?: true;
  modified?: true;
}
