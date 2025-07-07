import { RootState, useAppDispatch } from '@store';
import { UserActions } from '@store/features/user';
import { IAuthResponse } from '@typescript/services';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const navigate = useNavigate();

  /* Redux */
  const isAuth = useSelector<RootState, boolean>((s) => s.user.auth !== null);
  const dispatch = useAppDispatch();

  const logout = useCallback(() => {
    dispatch(UserActions.logout());

    // remove persisted user data
    localStorage.removeItem('persist:root');

    navigate('/auth/login', { replace: true });
  }, [dispatch, navigate]);

  return { isAuth, logout };
};
