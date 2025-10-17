export interface IFeeReport {
  start_date: string
  end_date: string
  fromFspId: string
  toFspId: string
  time_zone_offset: string
  file_type: string
}


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