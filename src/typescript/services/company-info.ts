export interface IModifyParticipant {
  participant_id: string
  address?: string
  mobile?: string
  contact_info_list?: IContact[]
  extra_property_list?: IExtraProperty[]
}

export interface IGetParticipant {
  participant_id: string
  dfsp_code: string
  name: string
  address: string
  mobile: string
  created_date: number
  contact_info_list: IContact[]
  extra_property_list: IExtraProperty[]
}

export interface IContact {
  contact_id: string
  name: string
  title: string
  email: string
  mobile: string
  contact_type: 'Business' | 'Technical'
}

export interface IExtraProperty {
  extra_property_id: string
  property_key: string
  label: string
  property_value: string
}

export interface IModifyParticipantResponse {
  participant_id: string
  modified: boolean
}
