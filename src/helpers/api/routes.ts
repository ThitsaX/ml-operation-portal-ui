// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.

export const publicRoutes = {
  login: '/public/loginUserAccount',

  getAnnouncements: '/public/getAnnouncements',
  getGreetingMessages: '/public/getGeetingMessages',
};

export const privateRoutes = {
  getParticipantPositionList: '/secured/getParticipantPositionList',
  getUserProfile: '/secured/getUserProfile',
  changePassword: '/secured/changePassword',

  getOtherParticipantList: '/secured/getOtherParticipantList',

  getSettlementWindowStateList: '/secured/getSettlementWindowStateList',
  getSettlementModelList: '/secured/getSettlementModelList',
  modifySettlementModel: '/secured/modifySettlementModel',
  getSettlementStateList: '/secured/getSettlementStateList',
  getSettlementList: '/secured/getSettlementList',
  getSettlementWindowsList: '/secured/getSettlementWindowsList',
  closeSettlementWindow: '/secured/closeSettlementWindow',
  createSettlement: '/secured/createSettlement',
  finalizeSettlement: '/secured/finalizeSettlement',

  getSettlementSchedulerList: '/secured/getSettlementSchedulerList',
  createSettlementScheduler: '/secured/createSettlementScheduler',
  modifySettlementScheduler: '/secured/modifySettlementScheduler',
  removeSettlementScheduler: '/secured/removeSettlementScheduler',

  getNetTransferAmountByWindowId: '/secured/getNetTransferAmountByWindowId',
  getNetTransferAmountBySettlementId: '/secured/getNetTransferAmountBySettlementId',

  getSettlementId: '/secured/getSettlementId',
  getSettlementIdWithParentParticipant:'/secured/getSettlementIdWithParentParticipant',
  generateDetailReport: '/secured/generateDetailReport',
  generateAuditReport: '/secured/generateAuditReport',
  generateSettlementAuditReport: '/secured/generateSettlementAuditReport',
  generateSettlementReport: '/secured/generateSettlementReport',
  generateSettlementStatementReport: '/secured/generateSettlementStatementReport',
  generateTransactionDetailReport: '/secured/generateTransactionDetailReport',
  generateManagementSummaryReport: '/secured/generateManagementSummaryReport',
  getUserListByParticipant: '/secured/getUserListByParticipant',
  getRoleListByParticipant: '/secured/getRoleListByParticipant',
  getParticipantListByParticipant: '/secured/getParticipantListByParticipant',
  getParticipantListIncludingHub:'/secured/getParticipantListIncludingHub',
  getParticipantListByDirectIndirect: '/secured/getParticipantListByDirectIndirect',
  updateParticipantStatus: '/secured/updateParticipantStatus',

  createUser: '/secured/createUser',
  modifyUser: '/secured/modifyUser',
  modifyUserStatus: '/secured/modifyUserStatus',
  generateSettlementBankReport: '/secured/generateSettlementBankReport',
  generateTransactionAmountReport: '/secured/generateTransactionAmountReport',
  generateSettlementBankReportUseCase: '/secured/generateSettlementBankReportUseCase',
  generateSettlementBankOverviewReport: '/secured/generateSettlementBankOverviewReport',
  generateFeeAmountReport: '/secured/generateFeeAmountReport',
  generateFeeSummaryReport: '/secured/generateFeeSummaryReport',
  generateFeeSettlementSummaryReport: '/secured/generateFeeSettlementSummaryReport',
  generateRevenueSharingSummaryReport: '/secured/generateRevenueSharingSummaryReport',
  generateRevenueSharingDetailReport: '/secured/generateRevenueSharingDetailReport',

  resetPassword: '/secured/resetPassword',
  getAllIdType: '/secured/getAllIdType',
  getAllTransferState: '/secured/getAllTransferState',
  getAllTransfer: '/secured/getAllTransfer',
  getTransferDetail: '/secured/getTransferDetail',

  getParticipantProfile: '/secured/getParticipantProfile',
  getContactList: '/secured/getContactList',
  getLiquidityProfileList: '/secured/getLiquidityProfileList',
  createContact: '/secured/createContact',
  createLiquidityProfile: '/secured/createLiquidityProfile',
  getParticipantCurrency: '/secured/getParticipantCurrency',
  getHubCurrency: '/secured/getHubCurrency',

  removeLiquidityProfile: '/secured/removeLiquidityProfile',
  removeContact: '/secured/removeContact',
  modifyParticipant: '/secured/modifyParticipant',
  modifyContact: '/secured/modifyContact',
  modifyLiquidityProfile: '/secured/modifyLiquidityProfile',

  getPendingApprovals: '/secured/getPendingApprovalList',
  createApprovalRequest: '/secured/createApprovalRequest',
  modifyApprovalAction: '/secured/modifyApprovalAction',

  getActionList: '/secured/getActionListByUser',
  getMadeByList: '/secured/getParticipantUserListByParticipant',
  getAuditListByParticipant: '/secured/getAuditListByParticipant',
  getParticipantList: '/secured/getParticipantList',
  getAuditDetailById: '/secured/getAuditDetailById',
  getParticipantContactList: '/secured/getParticipantContactList',

  syncHubParticipantsToPortal: '/secured/syncHubParticipantsToPortal',

  getServiceRequestLink: '/secured/getServiceRequestLink',
  getDisputeLink: '/secured/getDisputeLink',
  getReportDownloadStatus: '/secured/getReportDownloadStatus',
  getReportDownloadUrl: '/secured/getReportDownloadUrl',

  getRoleList: '/secured/getRoleList',
  getActionListByRole: '/secured/getActionListByRole',
  createRole: '/secured/createRole',
  modifyRoleGrantList: '/secured/modifyRoleGrantList',

  getNdcSchemeConfiguration: '/secured/ndc/configurations/scheme',
  getNdcDfspConfiguration: '/secured/ndc/configurations/dfsp',
  modifyNdcConfiguration: '/secured/ndc/configurations',
  modifyNdcWorkerConfiguration: '/secured/ndc/worker-config',
  getNdcThresholdDetails: '/secured/ndc/thresholdDetails',
  getNdcDeliveryLogs: '/secured/ndc/delivery-logs',
  createNdcThresholdApproval: '/secured/ndc/threshold-approvals',
  getNdcThresholdApprovals: '/secured/ndc/threshold-approvals',
  modifyNdcThresholdApprovalDecision: '/secured/ndc/threshold-approvals',
  getThresholdDfspList: '/secured/threshold/dfspList',
  getSchedulerConfigById: '/secured/getSchedulerConfigById',
  getSchedulerConfigByJobName: '/secured/getSchedulerConfigByJobName',

  createRevenueParty: '/secured/createRevenueParty',
  modifyRevenueParty: '/secured/modifyRevenueParty',
  modifyRevenuePartyStatus: '/secured/modifyRevenuePartyStatus',
  getRevenuePartyList: '/secured/getRevenuePartyList',
  getRevenueConfigList: '/secured/getRevenueConfigList',
  createRevenueApprovalRequest: '/secured/createRevenueApprovalRequest',
  getPendingRevenueApprovalList: '/secured/getPendingRevenueApprovalList',
  modifyRevenueApprovalAction: '/secured/modifyRevenueApprovalAction',
  createRevenueRoundingPolicy: '/secured/createRevenueRoundingPolicy',
  getRevenueRoundingPolicy: '/secured/getRevenueRoundingPolicy'
};

const routes = {
  ...publicRoutes,
  ...privateRoutes
};

export default routes;

