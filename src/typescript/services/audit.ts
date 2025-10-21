export interface IGetAuditByParticipant {
  auditInfoList: AuditInfo[];
  total: number,
  totalPages: number
}

export interface AuditInfo {
  auditId: string;
  date: string;
  action: string;
  madeBy: number;
}

export interface IMadeByList {
  userList: IGetMadeBy[];
}
export interface IGetMadeBy {
  userId: string,
  email: string
}

export interface IGetActionList {
  actionList: IGetAction[];
}
export interface IGetAction {
  actionId: string,
  actionName: string
}