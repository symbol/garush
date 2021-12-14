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
import { fetchCollections } from '@services/collectionService';
import { useAppSelector } from '@store/hooks';

import type { AppState } from '@store/store';
import { LoadingState, LoadingStatus } from './baseSlice';

export interface Collection {
    id: string;
    name: string;
    description?: string;
    imageUrl?: string;
    isPublic?: boolean;
    isFeatured?: boolean;
    isArchived?: boolean;
    isDeleted?: boolean;
    createdAt?: string;
    updatedAt?: string;
    owner: string;
    floorPrice?: number;
}

export interface CollectionState extends LoadingState {
    collections: Collection[];
    loadingStatus: LoadingStatus;
}

const initialState: CollectionState = {
    collections: [],
    loadingStatus: LoadingStatus.idle,
};

const fetchCollectionsAsync: AsyncThunk<Collection[], void, {}> = createAsyncThunk('collections/fetchCollections', async () => {
    const response = await fetchCollections();
    return response;
});

export const collectionSlice = createSlice({
    name: 'collection',
    initialState,
    reducers: {
        setCollections: (state, action) => {
            state.collections = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCollectionsAsync.fulfilled, (state, action) => {
                state.collections = action.payload;
                state.loadingStatus = LoadingStatus.idle;
            })
            .addCase(fetchCollectionsAsync.pending, (state) => {
                state.loadingStatus = LoadingStatus.loading;
            })
            .addCase(fetchCollectionsAsync.rejected, (state) => {
                state.loadingStatus = LoadingStatus.failed;
                state.collections = [];
            });
    },
});

export const { setCollections } = collectionSlice.actions;

export const useGetterCollections = () => useAppSelector((state: AppState) => state.collection.collections);

export default collectionSlice.reducer;
