
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
  generateDetailReport: '/secured/generateDetailReport',
  generateAuditReport: '/secured/generateAuditReport',
  generateSettlementAuditReport: '/secured/generateSettlementAuditReport',
  generateSettlementReport: '/secured/generateSettlementReport',
  generateSettlementStatementReport: '/secured/generateSettlementStatementReport',
  generateTransactionDetailReport: '/secured/generateTransactionDetailReport',
  downloadTransactionDetailReport: '/secured/downloadTransactionDetailReport',
  generateManagementSummaryReport: '/secured/generateManagementSummaryReport',
  getUserListByParticipant: '/secured/getUserListByParticipant',
  getRoleListByParticipant: '/secured/getRoleListByParticipant',
  getParticipantListByParticipant: '/secured/getParticipantListByParticipant',
  getParticipantListIncludingHub:'/secured/getParticipantListIncludingHub',
  updateParticipantStatus: '/secured/updateParticipantStatus',

  createUser: '/secured/createUser',
  modifyUser: '/secured/modifyUser',
  modifyUserStatus: '/secured/modifyUserStatus',
  generateSettlementBankReport: '/secured/generateSettlementBankReport',

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
};

const routes = {
  ...publicRoutes,
  ...privateRoutes
};

export default routes;
