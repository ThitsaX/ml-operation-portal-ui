
export const publicRoutes = {
  login: '/public/loginUserAccount',

  get_all_announcement: '/public/getAnnouncements',
  getGreetingMessages: '/public/getGeetingMessages',
};

export const privateRoutes = {
  getParticipantPositionList: '/secured/getParticipantPositionList',
  get_all_participants: '/secured/get_all_participants',
  get_user_profile: '/secured/getUserProfile',
  change_password: '/secured/changePassword',

  get_participant: '/secured/get_participant',
  modify_participant: '/secured/modify_participant',
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
  getUserListByParticipant: '/secured/getUserListByParticipant',
  getRoleListByParticipant: '/secured/getRoleListByParticipant',
  getParticipantListByParticipant: '/secured/getParticipantListByParticipant',
  updateParticipantStatus: '/secured/updateParticipantStatus',

  createUser: '/secured/createUser',
  modifyUser: '/secured/modifyUser',
  modifyUserStatus: '/secured/modifyUserStatus',
  generateSettlementBankReport: '/secured/generateSettlementBankReport',

  create_new_participant_user: '/secured/create_new_participant_user',
  modify_participant_user: '/secured/modify_participant_user',
  remove_participant_user: '/secured/remove_participant_user',
  resetPassword: '/secured/resetPassword',

  get_all_id_type: '/secured/getAllIdType',
  get_all_transfer_state: '/secured/getAllTransferState',
  get_all_transfer: '/secured/getAllTransfer',
  get_transfer_detail: '/secured/getTransferDetail',

  get_all_audit_by_participant: '/secured/get_all_audit_by_participant',


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
};

const routes = {
  ...publicRoutes,
  ...privateRoutes
};

export default routes;
