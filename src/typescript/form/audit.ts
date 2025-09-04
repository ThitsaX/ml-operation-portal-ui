export interface IGetAuditByParticipantValues {
  fromDate: number;
  toDate: number;
  participantId: string;
  actionName: string;
  userId: string;
}

export interface IGetAuditReport {
  fromDate: string;
  toDate: string;
  participantId: string;
  action: string;
  userId: string;
  timezoneOffset: string;
  fileType: string;
}

export interface IGetAuditByParticipant {
  userName: string;
  actionName: string;
  actionDate: number;
}
