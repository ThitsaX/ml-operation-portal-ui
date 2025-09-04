import { RootState, useAppDispatch } from '@store';
import { UserActions } from '@store/features/user';
import { IAuthResponse } from '@typescript/services';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from "@tanstack/react-query";

export const useAuth = () => {
  const navigate = useNavigate();

  /* Redux */
  const isAuth = useSelector<RootState, boolean>((s) => s.user.auth !== null);
  const dispatch = useAppDispatch();

  // must be called at top-level
  const queryClient = useQueryClient();

  const logout = useCallback(() => {
    dispatch(UserActions.logout());

    // remove persisted user data
    localStorage.removeItem('persist:root');

    queryClient.clear(); //
    navigate('/auth/login', { replace: true });
  }, [dispatch, navigate]);

  return { isAuth, logout };
};
