export interface ISettlementWindowForm {
    fromDate: string
    toDate: string
    currency?: string
    state?: string
}

export interface ISettlementWindowCreateForm {
    settlementModel: string;
    reason: string;
    settlementWindowIdList: { id: string }[];
}

export interface IFinalizeSettlementForm {
    fromDate: string
    toDate: string
    currency: string
    state: string
    timezoneOffset: string
}