export interface IGetParticipantPositionData {
  participantPositionsData: IParticipantPositionData[]
}

export interface IParticipantPositionData {
  participantName: string,
  description: string,
  currency: string,
  balance: number,
  currentPosition: number,
  ndcPercent: string,
  ndc: number,
  ndcUsed: number,
  participantSettlementCurrencyId: number,
  participantPositionCurrencyId: number
}

export interface IGetAllParticipants {
  participantInfoList: IParticipant[]
}
export interface IParticipant {
  participantId: string,
  participantName: string,
  description: string
}