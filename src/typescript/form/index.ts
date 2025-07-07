export interface ISignInValues {
  email: string;
  password: string;
}

export type RoleType = 'ADMIN' | 'OPERATION';
export type UserStatus = 'INACTIVE' | 'ACTIVE';
export interface ICreateUserValues extends ISignInValues {
  name: string;
  first_name: string;
  last_name: string;
  job_title: string;
  participant_id: string;
  user_role_type: RoleType;
  status: UserStatus;
}

export interface IModifyUserValues
  extends Omit<ICreateUserValues, 'password'> {}
export interface IResetPasswordValues {
  email: string;
  new_password: string;
}

export interface IChangePwdValues {
  old_password: string;
  new_password: string;
  confirm_password?: string;
}

export * from './audit';
