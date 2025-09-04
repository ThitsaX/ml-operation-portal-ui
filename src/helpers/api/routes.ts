export const publicRoutes = {
  login: '/public/loginUserAccount',

  get_all_announcement: '/public/getAnnouncements'
};

export const privateRoutes = {
  get_participant_positions_data: '/secured/getParticipantPositionsData',
  get_dashboard_data: '/secured/get_dashboard_data',
  get_user_profile: '/secured/getUserProfile',
  change_password: '/secured/changePassword',

  get_participant: '/secured/get_participant',
  modify_participant: '/secured/modify_participant',
  get_all_other_participants: '/secured/get_all_other_participants',

  get_settlementIds: '/secured/get_settlement_id',
  generate_settlement_detail_report: '/secured/generate_detail_report',
  generate_settlement_report: '/secured/generate_settlement_report',
  generate_settlement_statement_report: '/secured/generate_statement_report',
  get_all_participant_users: '/secured/get_all_participant_users',
  generate_fee_report: '/secured/generate_fee_report',

  create_new_participant_user: '/secured/create_new_participant_user',
  modify_participant_user: '/secured/modify_participant_user',
  remove_participant_user: '/secured/remove_participant_user',
  reset_password: '/secured/reset_password',

  get_all_id_type: '/secured/get_all_id_type',
  get_all_transfer_state: '/secured/get_all_transfer_state',
  get_all_transfer: '/secured/get_all_transfer',
  get_transfer_detail: '/secured/get_transfer_detail',

  get_all_audit_by_participant: '/secured/get_all_audit_by_participant',

  generateAuditReport: '/secured/generateAuditReport',
  generateSettlementAuditReport: '/secured/generateSettlementAuditReport',

  getPendingApprovals: '/secured/getPendingApprovalList',
  createApprovalRequest: '/secured/createApprovalRequest',
  modifyApprovalAction: '/secured/modifyApprovalAction',


  getActionList: '/secured/getActionList',
  getMadeByList: '/secured/getMadeByList',
  getAuditList: '/secured/getAuditList',

  getParticipantList: '/secured/getParticipantList',
  removeLiquidityProfile: '/secured/removeLiquidityProfile',
  removeContact: '/secured/removeContact',
  modifyParticipant: '/secured/modifyParticipant',
  modifyContact: '/secured/modifyContact',
  modifyLiquidityProfile: '/secured/modifyLiquidityProfile',

  getParticipantProfile: '/secured/getParticipantProfile',
  getContactList: '/secured/getContactList',
  getLiquidityProfileList: '/secured/getLiquidityProfileList',
  createContact: '/secured/createContact',
  createLiquidityProfile: '/secured/createLiquidityProfile',
  getParticipantCurrency: '/secured/getParticipantCurrency',

};

const routes = {
  ...publicRoutes,
  ...privateRoutes
};

export default routes;
