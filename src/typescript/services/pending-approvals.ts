
export interface IGetPendingApprovals {
    pendingApprovalList: IPendingApproval[];
}

export interface IPendingApproval {
    approvalRequestId: string,
    requestedAction: string,
    participantName: string,
    currency: string,
    amount: number,
    requestedBy: string,
    requestedDateTime: number,
    action: string
}

export enum PositionActionType {
    DEPOSIT = 'DEPOSIT',
    WITHDRAW = 'WITHDRAW',
    UPDATE_NDC_FIXED = 'UPDATE_NDC_FIXED',
    UPDATE_NDC_PERCENTAGE = 'UPDATE_NDC_PERCENTAGE'
}

export interface IApprovalRequest {
    requestedAction: PositionActionType,
    participantName: string,
    currencyId: number,
    currency: string,
    amount: number,
}

export enum PendingApprovalStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}


