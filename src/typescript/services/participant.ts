import { type UserStatus, type RoleType } from '@typescript/form';

export interface IParticipantUser {
  participant_user_id: string;
  name: string;
  email: string;
  first_name: string;
  last_name: string;
  job_title: string;
  status: UserStatus;
  userRoleType: RoleType;
  created_date: number;
}

export interface IGetAllOtherParticipant {
  participant_info_list: IParticipantInfo[];
}

export interface IParticipantInfo {
  participant_id: string;
  dfsp_code: string;
  dfsp_name: string;
}
