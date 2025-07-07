import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { type IAuthResponse, type IUserProfile, type IUserState } from './types'
import { login } from './api'

const initialState: IUserState = {
  auth: null,
  data: null,
  status: 'idle',
  error: null
}

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    updateAuth: (state, action: PayloadAction<IAuthResponse>) => {
      state.auth = action.payload
    },
    updateUser: (state, action: PayloadAction<IUserProfile | null>) => {
      state.data = action.payload
    },
    logout: (state) => {
      state.auth = null
      state.data = null
    }
  },
  extraReducers: (builder) => {
    builder.addCase(login.pending, (state) => {
      state.status = 'loading'
      state.auth = null
      state.error = null
    })
    builder.addCase(login.rejected, (state, action: PayloadAction<any>) => {
      state.status = 'error'
      state.auth = null
      state.error = action.payload
    })
    builder.addCase(login.fulfilled, (state, action: PayloadAction<any>) => {
      state.status = 'idle'
      state.auth = action.payload
      state.error = null
    })
  }
})

// Action creators are generated for each case reducer function
export const { updateAuth, updateUser, logout } = userSlice.actions

export default userSlice.reducer

export * from './api'
