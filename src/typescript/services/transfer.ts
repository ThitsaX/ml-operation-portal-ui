export interface IGetOtherParticipants {
  participant_id: string;
  dfsp_code: string;
  dfsp_name: string;
}

export interface IGetOtherParticipantsArr {
  participant_info_list: IGetOtherParticipants[];
}

export interface IGetIdTypes {
  party_identifier_type_id: string;
  name: string;
}

export interface IGetIdTypesArr {
  id_type_list: IGetIdTypes[];
}

export interface IGetTransferStates {
  transfer_state: string;
  transfer_state_id: string;
}

export interface IGetTransferStatesArr {
  transfer_state_list: IGetTransferStates[];
}

export interface IGetTransferData {
  transfer_id: string;
  state: string;
  type: string;
  currency: string;
  amount: number;
  payer_dfsp: string;
  payee_dfsp: string;
  settlement_batch: string;
  submitted_on_date: string;
}

export interface IGetTransferDataArr {
  transfer_info_list: IGetTransferData[];
}

export interface IGetTransferDetails {
  transfer_details: {
    transfer_id: string;
    state: string;
    type: string;
    currency: string;
    amount: number;
    payer: string;
    payer_details: string;
    payer_dfsp: string;
    payee: string;
    payee_details: string;
    payee_dfsp: string;
    settlement_batch: string;
    submitted_on_date: string;
  };
}
