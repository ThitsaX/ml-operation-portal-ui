export interface IGetAuditByParticipant {
  audit_info_list: AuditInfo[];
}

export interface AuditInfo {
  userName: string;
  actionName: string;
  actionDate: number;
}
