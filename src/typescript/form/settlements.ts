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
    currency?: string
    state?: string
}

export interface ISettlementScheduleForm {
    settlementModelId?: string, // id should available during modifying but not during creating new schedule. 
    name: string,
    jobName?: string,
    description: string,
    cronExpression: string,
    zoneId: string, // "+06:00"
} 

export interface ISettlementScheduleModifyForm extends ISettlementScheduleForm {
  schedulerConfigId: string;
  active: boolean;
}

export interface ISettlementScheduleRemoveForm{
  schedulerConfigId: string;
  settlementModelId: string,
}