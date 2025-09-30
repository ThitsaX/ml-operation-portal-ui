import { store } from '@store';
import { type ActionId } from '../configs/action-ids';

export const hasMenuAccess = (allowedActionId: ActionId): boolean => {
  const {
    user: { data },
  } = store.getState();

  const actionList: string[] = data?.accessActionList ?? [];
  return actionList.includes(allowedActionId);
};
