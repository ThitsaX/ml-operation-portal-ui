export interface IGetDashboardData {
  financial_data: FinancialData
}

export interface FinancialData {
  dfsp_name: string
  currency: string
  balance: number
  current_position: number
  ndc: number
  ndc_used: number
}

export interface IGetParticipantPositionData {
  participantPositionsData: IParticipantPositionData[]
}

export interface IParticipantPositionData {
  dfspId: string,
  dfspName: string,
  currency: string,
  balance: number,
  currentPosition: number,
  ndcPercent: string,
  ndc: number,
  ndcUsed: number,
  participantSettlementCurrencyId: number,
  participantPositionCurrencyId: number
}
