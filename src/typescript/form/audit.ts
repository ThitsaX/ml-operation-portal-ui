export interface IGetAuditByParticipantValues {
  from_date: number;
  to_date: number;
  participantId: string;
}

export interface IGetAuditByParticipant{
  user_name: string;
  action_name: string;
  action_date: number;
}
