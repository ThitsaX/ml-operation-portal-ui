import { type IExtraProperty } from '@typescript/services/company-info'

export interface ICompanyInfo {
  participant_id: string
  address: string
  mobile: string
  name: string

  business_contatct_id?: string
  business_contatct_name?: string
  business_contatct_title?: string
  business_contatct_email?: string
  business_contatct_mobile?: string

  technical_contatct_id?: string
  technical_contatct_name?: string
  technical_contatct_title?: string
  technical_contatct_email?: string
  technical_contatct_mobile?: string

  extra_property_list: IExtraProperty[]
}
