export interface IFeeReport {
  start_date: string
  end_date: string
  fromFspId: string
  toFspId: string
  time_zone_offset: string
  file_type: string
}


export interface ISettlementBankReport {
  start_date: string
  end_date: string
  settlementId: string
  currency: string
}

export interface ISettlementReport {
  startDate: string
  endDate: string
}