export interface ISettlementDetailReport {
  fspId: string
  startDate: string
  endDate: string
  settlementId: string
  timezoneOffset: string
  fileType: string
}

export interface ISettlementSummaryReport {
  fspId: string
  startDate: string
  endDate: string
  settlementId: string
  timezoneOffset: string
  fileType: string
  currencyId: string
}

export interface ISettlementStatementReport {
  fspId: string
  startDate: string
  endDate: string
  settlementId: string
  currencyId: string
  timezoneOffset: string
  fileType: string
}
