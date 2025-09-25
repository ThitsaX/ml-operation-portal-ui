import { type UserStatus, type RoleType } from '@typescript/form';

export interface IParticipantUser {
  userId: string;
  name: string;
  email: string;
  firstName: string;
  lastName: string;
  roleList: string[];
  participantId: string;
  jobTitle: string;
  status: UserStatus;
  password: string;
  confirmPassword?: string;
}

export type IParticipantUserForm = Omit<IParticipantUser, 'roleList'> & {
  roleIdList: string[];
};
export interface IModifyUser {
  userId: string;
  name: string;
  email: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  status: UserStatus;
}

export interface IUserRoleList {
  roleList: IParticipantUserRole[];
}

export interface IParticipantUserRole {
  roleId: string,
  name: string,
  active: boolean
}

export interface IParticipantOrganizationList {
  participantInfoList: IParticipantOrganization[];
}

export interface IParticipantOrganization {
  participantId: string,
  participantName: string,
  participantDescription: string
}

export interface IGetAllOtherParticipant {
  participantInfoList: IParticipantInfo[];
}

export interface IParticipantInfo {
  participant_id: string;
  dfsp_code: string;
  dfsp_name: string;
}

export interface IParticipantProfile {
  participantId: string;
  participantName: string;
  description: string;
  address?: string;
  mobile?: string;
  logoFileType: string | null;
  logo: string | null;
  createdDate?: number;
}

export interface IGetParticipantList {
  participantInfoList: IParticipantProfile[];
}

export interface IGetAllLiquidityProfile {
  liquidityProfileInfoList: ILiquidityProfile[];
}

export interface IGetAllBusinessContact {
  contactInfoList: IBusinessContact[];
}

export interface IGetAllCurrency {
  hubCurrencyList: ICurrency[];
}

export interface ICurrency {
  currency: string;
}

export interface ILiquidityProfile {
  bankName: string | null;
  accountName: string;
  accountNumber: string;
  currency: string;
  participantId: string;
  liquidityProfileId?: string;
  isActive?: boolean;
}

export interface IBusinessContact {
  participantId: string;
  contactId?: string;
  name: string;
  position: string;
  email: string;
  mobile: string;
  contactType: BusinessContactType;
}

export enum BusinessContactType {
  BUSINESS = 'BUSINESS',
  TECHNICAL = 'TECHNICAL',
  LEVEL1 = 'LEVEL1',
  LEVEL2 = 'LEVEL2',
  LEVEL3 = 'LEVEL3',
  LEVEL4 = 'LEVEL4',
}