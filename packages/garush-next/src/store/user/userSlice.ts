/*
 * (C) Symbol Contributors 2021
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 *
 */

import { AsyncThunk, createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { useAppSelector } from '../hooks';

import type { AppState, AppThunk } from '../store';
import { fetchUserByEmail } from '../../services/userService';

export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    walletAddress?: string;
    isActive?: boolean;
    loggedIn?: boolean;
}
export enum LoadingStatus {
    idle = 'idle',
    loading = 'loading',
    failed = 'failed',
}
export interface UserState {
    user?: User;
    status: LoadingStatus;
}

const initialState: UserState = {
    user: undefined,
    status: LoadingStatus.idle,
};

// The function below is called a thunk and allows us to perform async logic. It
// can be dispatched like a regular action: `dispatch(incrementAsync(10))`. This
// will call the thunk with the `dispatch` function as the first argument. Async
// code can then be executed and other actions can be dispatched. Thunks are
// typically used to make async requests.
export const fetchUserAsync: AsyncThunk<User, string, {}> = createAsyncThunk('user/fetchUserByEmail', async (email: string) => {
    const response = await fetchUserByEmail(email);
    // The value we return becomes the `fulfilled` action payload
    return response;
});

export const userSlice = createSlice({
    name: 'user',
    initialState,
    // The `reducers` field lets us define reducers and generate associated actions
    reducers: {
        // Redux Toolkit allows us to write "mutating" logic in reducers. It
        // doesn't actually mutate the state because it uses the Immer library,
        // which detects changes to a "draft state" and produces a brand new
        // immutable state based off those changes
        logout: (state) => {
            state.user = undefined;
        },
    },
    // The `extraReducers` field lets the slice handle actions defined elsewhere,
    // including actions generated by createAsyncThunk or in other slices.
    extraReducers: (builder) => {
        builder
            .addCase(fetchUserAsync.pending, (state) => {
                state.status = LoadingStatus.loading;
            })
            .addCase(fetchUserAsync.fulfilled, (state, action) => {
                state.status = LoadingStatus.idle;
                state.user = action.payload;
            })
            .addCase(fetchUserAsync.rejected, (state) => {
                state.status = LoadingStatus.failed;
                state.user = undefined;
            });
    },
});

export const { logout } = userSlice.actions;

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state: RootState) => state.counter.value)`
// all custom selector hooks should start with useGetter
export const useGetterUser = () => useAppSelector((state: AppState) => state.user);

export default userSlice.reducer;
