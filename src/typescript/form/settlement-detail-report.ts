export interface ISettlementDetailReport {
  fspid: string
  start_date: string
  end_date: string
  settlement_id: string
  time_zone_offset: string
  file_type: string
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
  fspid: string
  start_date: string
  end_date: string
  settlement_id: string
  currency: string
  time_zone_offset: string
  file_type: string
}
