export interface IGetAuditByParticipantValues {
  fromDate: string;
  toDate: string;
  page: number;
  pageSize: number;
}

export interface IGetAuditReport {
  fromDate: string;
  toDate: string;
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
