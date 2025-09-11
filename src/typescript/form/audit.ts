export interface IGetAuditByParticipantValues {
  fromDate: string;
  toDate: string;
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
  date: string;
  action: string;
  madeBy: number;
}
