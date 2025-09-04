export interface ISettlementModel {
    modelName: string;
    modelType: number;
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
    settlementId: string;
    windowId: [string];
    state: string;
    settlementCreatedDate: string;
    settlementFinalizeDate: string;
}
