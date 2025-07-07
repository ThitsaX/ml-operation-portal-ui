import {createSlice} from '@reduxjs/toolkit';
import { ITimezoneOption } from 'react-timezone-select';
import { defaultOption } from '@utils/constants';

export interface IAppState {
  onBoarding: boolean;
  selectedTimezone: ITimezoneOption;
}

const initialState: IAppState = {
  onBoarding: false, // whether the user is already read onboarding guide or not
  selectedTimezone: defaultOption,
};

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setOnBoarding: state => {
      return {
        ...state,
        onBoarding: true,
      };
    },
    setTimezone: (state, action) => {
      return {
        ...state,
        selectedTimezone: action.payload,
      };
    },
  },
});

export const {
  setOnBoarding,
  setTimezone,
} = appSlice.actions;

export default appSlice.reducer;
