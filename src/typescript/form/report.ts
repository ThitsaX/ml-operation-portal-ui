export interface ISettlementBankReport {
  startDate: string
  endDate: string
  settlementId: string
  currency: string
  fileType: string
  timezoneOffset: string
}

export interface ISettlementReport {
  startDate: string
  endDate: string
}

export interface ISettlementAuditReport {
  dfspId: string
  startDate: string
  endDate: string
  currencyId: string
  timezoneOffset: string
  fileType: string
}

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

export interface ITransactionDetailReport {
  startDate: string
  endDate: string
  state: string
  timezoneOffset: string
  fileType: string
}

export interface IManagementSummaryReport {
  startDate: string
  endDate: string
  timezoneOffset: string
  fileType: string
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
