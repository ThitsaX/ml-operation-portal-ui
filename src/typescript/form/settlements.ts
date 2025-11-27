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
    description: string,
    cronExpression: string,
} 

export interface ISettlementScheduleFormResponse { 
  is_created: boolean, 
  schedulerConfigId: string 
}

export interface ISettlementScheduleModifyForm extends ISettlementScheduleForm {
  schedulerConfigId: string;
  active: boolean;
}

export interface ISettlementScheduleRemoveForm{
  schedulerConfigId: string;
  settlementModelId: string,
}

export interface IModifySettlementModelPayload {
  settlementModelId: string;
  name: string;
  modelType: string;
  currencyID: string;
  active: boolean;
  autoCloseWindow?: boolean;
  manualCloseWindow?: boolean; 
  zoneId?: string;             
}