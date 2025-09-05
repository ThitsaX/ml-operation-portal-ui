export interface IFeeReport {
  start_date: string
  end_date: string
  fromFspId: string
  toFspId: string
  time_zone_offset: string
  file_type: string
}


export interface ISettlementBankReport {
  settlementId: string
}