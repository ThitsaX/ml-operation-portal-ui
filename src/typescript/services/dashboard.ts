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
