export const publicRoutes = {
  login: '/public/loginUserAccount',

  get_all_announcement: '/public/getAnnouncements'
};

export const privateRoutes = {
  get_participant_positions_data: '/secured/getParticipantPositionsData',
  get_all_participants: '/secured/get_all_participants',
  get_user_profile: '/secured/getUserProfile',
  change_password: '/secured/changePassword',

  get_participant: '/secured/get_participant',
  modify_participant: '/secured/modify_participant',
  get_all_other_participants: '/secured/getAllOtherParticipants',

  get_settlementIds: '/secured/get_settlement_id',
  generate_settlement_detail_report: '/secured/generate_detail_report',
  generateAuditReport: '/secured/generateAuditReport',
  generateSettlementAuditReport: '/secured/generateSettlementAuditReport',
  generate_settlement_report: '/secured/generate_settlement_report',
  generate_settlement_statement_report: '/secured/generate_statement_report',
  get_all_participant_users: '/secured/get_all_participant_users',
  generate_fee_report: '/secured/generate_fee_report',

  create_new_participant_user: '/secured/create_new_participant_user',
  modify_participant_user: '/secured/modify_participant_user',
  remove_participant_user: '/secured/remove_participant_user',
  reset_password: '/secured/reset_password',

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

  removeLiquidityProfile: '/secured/removeLiquidityProfile',
  removeContact: '/secured/removeContact',
  modifyParticipant: '/secured/modifyParticipant',
  modifyContact: '/secured/modifyContact',
  modifyLiquidityProfile: '/secured/modifyLiquidityProfile',

  getPendingApprovals: '/secured/getPendingApprovalList',
  createApprovalRequest: '/secured/createApprovalRequest',
  modifyApprovalAction: '/secured/modifyApprovalAction',

  getActionList: '/secured/getActionList',
  getMadeByList: '/secured/getMadeByList',
  getAuditList: '/secured/getAuditList',
  getParticipantList: '/secured/getParticipantList',
  getParticipantContactList: '/secured/getParticipantContactList',


};

const routes = {
  ...publicRoutes,
  ...privateRoutes
};

export default routes;
