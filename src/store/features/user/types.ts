import { type RoleType } from '@typescript/form';
import { type IApiErrorResponse } from '@typescript/services';

export interface IUserState {
  auth: IAuthResponse | null;
  data: IUserProfile | null;
  status: 'loading' | 'idle' | 'error';
  error: IApiErrorResponse | null;
}

export interface IAuthResponse {
  accessKey: string;
  secretKey: string;
}

export interface IUserProfile {
  user_id: string;
  name: string;
  email: string;
  first_name: string;
  last_name: string;
  job_title: string;
  dfsp_code: string;
  dfsp_name: string;
  participant_id: string;
  user_role_type: RoleType;
  created_date: number;
}
