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
  userId: string;
  name: string;
  email: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  participantName: string;
  description: string;
  roleList: string[];
  participantId: string;
  userRoleType: RoleType;
  createdDate: number;
  logoFileType: string | null;
  logo: string | null;
  accessMenuList: [];
  accessActionList: [];
}
