export interface ISettlementModel {
    modelName: string;
    modelType: string;
    currency: string;
}
export interface ISettlementWindow {
    settlementId: string;
    windowId: number;
    state: string;
    openDate: string;
    closeDate: string;
}

export interface IFinalizeSettlement {
    settlementId: string
    windowId: string[]
    state: string
    settlementCreatedDate: string
    settlementFinalizeDate: string
    details: {
        dfsp: string
        currency: string
        debit: number | null
        credit: number | null
    }[]
}


