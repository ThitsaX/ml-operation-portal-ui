import { useSelector } from 'react-redux'
import { type IUserState } from '@store/features/user/types'
import { type RootState } from '@store/store'

export const useGetUserState = () =>
  useSelector<RootState, IUserState>((s) => s.user)
