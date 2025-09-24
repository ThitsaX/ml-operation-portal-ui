export interface ISignInValues {
  email: string;
  password: string;
}

export type RoleType = 'ADMIN' | 'OPERATION';
export enum UserStatus {
  INACTIVE = 'INACTIVE',
  ACTIVE = 'ACTIVE',
}
export interface ICreateUserValues extends ISignInValues {
  name: string;
  first_name: string;
  last_name: string;
  job_title: string;
  participant_id: string;
  userRoleType: RoleType;
  status: UserStatus;
}

export interface IModifyUserValues
  extends Omit<ICreateUserValues, 'password'> { }
export interface IResetPasswordValues {
  email: string;
  newPassword: string;
}

export interface IChangePwdValues {
  oldPassword: string;
  newPassword: string;
  confirmPassword?: string;
}

export interface IGetUserDataList {
  userInfoList: IGetUserData[];
}
export interface IGetUserData {
  email: string;
  name: string;
  role: string[];
  status: string;
}

export * from './audit';
