export interface IGetAuditByParticipantValues {
  fromDate: number;
  toDate: number;
  participantId: string;
  actionName: string;
  userId: string;
}

export interface IGetAuditByParticipant {
  userName: string;
  actionName: string;
  actionDate: number;
}
