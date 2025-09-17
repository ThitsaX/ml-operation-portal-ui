export interface ISettlementDetailReport {
  fspId: string
  startDate: string
  endDate: string
  settlementId: string
  timezoneOffset: string
  fileType: string
}

export interface ISettlementSummaryReport {
  fspid: string
  start_date: string
  end_date: string
  settlement_id: string
  time_zone_offset: string
  file_type: string
}

export interface ISettlementStatementReport {
  fspId: string
  startDate: string
  endDate: string
  settlementId: string
  currency: string
  timezoneOffset: string
  fileType: string
}
