export interface IGetAuditByParticipant {
  audit_info_list: AuditInfo[];
}

export interface AuditInfo {
  user_name: string;
  action_name: string;
  action_date: number;
}
