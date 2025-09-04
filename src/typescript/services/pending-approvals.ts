
export interface IGetPendingApprovals {
    pendingApprovalList: IPendingApproval[];
}

export interface IPendingApproval {
    approvalRequestId: string,
    requestedAction: string,
    dfsp: string,
    currency: string,
    amount: number,
    requestedBy: string,
    requestedDateTime: number,
    action: string
}

export interface IApprovalRequest {
    requestedAction: string,
    dfsp: string,
    currency: string,
    amount: number,
}

export enum PendingApprovalStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}


