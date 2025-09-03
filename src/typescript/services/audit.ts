export interface IGetAuditByParticipant {
  auditInfoList: AuditInfo[];
}

export interface AuditInfo {
  userName: string;
  actionName: string;
  actionDate: number;
}

export interface IMadeByList {
  madeByList: IGetMadeBy;
}
export interface IGetMadeBy {
  userId: string,
  name: string
}

export interface IGetActionList {
  actionNames: IGetAction;
}
export interface IGetAction {
  actionId: string,
  actionName: string
}