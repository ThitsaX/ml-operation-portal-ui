export interface IGetOtherParticipants {
  participantId: string;
  participantName: string;
  description: string;
}

export interface IGetOtherParticipantsArr {
  participantInfoList: IGetOtherParticipants[];
}

export interface IGetIdTypes {
  partyIdentifierTypeId: string;
  name: string;
}

export interface IGetIdTypesArr {
  idTypeInfoList: IGetIdTypes[];
}

export interface IGetTransferStates {
  transferState: string;
  transferStateId: string;
}

export interface IGetTransferStatesArr {
  transferStateInfoList: IGetTransferStates[];
}

export interface IGetTransferData {
  transferId: string;
  state: string;
  type: string;
  currency: string;
  amount: number;
  payerDfsp: string;
  payeeDfsp: string;
  settlementBatch: string;
  submittedOnDate: string;
}

export interface IGetTransferDataArr {
  transferInfoList: IGetTransferData[];
  totalPage: number;
}

interface ITransferDetails {
  transferId: string;
  quoteId: string;
  transferState: string;
  transferType: string;
  subScenario: string;
  currency: string;
  amountType: string;
  quoteAmount: number;
  transferAmount: number;
  payeeReceivedAmount: number;
  payeeDfspFeeAmount: number;
  payeeDfspCommissionAmount: number;
  submittedOnDate: string;
  windowId: string;
  settlementId: string;
}

interface IPersonInfo {
  idType: string;
  idValue: string
  dfspId: string;
  name: string;
}

interface IErrorInfo {
  errorCode: string;
  errorDescription: string;
}
export interface IGetTransferDetails {
  transferDetails: ITransferDetails
  payerInformation: IPersonInfo,
  payeeInformation: IPersonInfo,
  errorInformation: IErrorInfo
}
