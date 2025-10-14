export interface ISettlementModel {
    modelName: string;
    modelType: string;
    currency: string;
}

export interface ISettlementWindows {
    settlementWindowList: ISettlementWindow[];
}
export interface ISettlementWindow {
    settlementWindowId: string;
    state: string;
    reason: string;
    createdDate: string;
    changedDate: string;
    contentList: ISettlementWindowContent[];
}
export interface ISettlementWindowContent {
    contentId: number,
    state: string,
    ledgerAccountType: string,
    currencyId: string,
    createdDate: string,
    changedDate: string
}

export interface IFinalizeSettlements {
    settlementList: IFinalizeSettlement[];
}

export interface IFinalizeSettlement {
    settlementId: string
    state: string
    reason: string
    createdDate: string
    changedDate: string
    settlementWindowList: ISettlementWindow[];
    participantList: ISettlementParticipant[];
}

export interface ISettlementParticipant {
    participantId: string,
    accountList: ISettlementAccount[];
}
export interface ISettlementAccount {
    accountId: string,
    state: string,
    reason: string,
    externalReference: string | null,
    createdDate: string | null,
    netSettlementAmount: {
        amount: number,
        currency: string
    }
}

export interface INetTransferDetail {
    participantName: string;
    debitAmount: number;
    creditAmount: number;
    currency: string;
}

export interface INetTransferAmount {
    settlementWindowId?: string;
    settlementWindowIds?: string;
    settlementId?: string;
    windowOpenedDate: string;
    windowClosedDate: string;
    details: INetTransferDetail[];
}
