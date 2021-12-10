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

import type { ChangeEvent } from 'react';
import { useEffect, useRef } from 'react';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import type { AppDispatch, AppState } from './store';

export const useForm =
    <TContent>(defaultValues: TContent) =>
    (handler: (content: TContent) => void) =>
    async (event: ChangeEvent<HTMLFormElement>) => {
        event.preventDefault();
        event.persist();

        const form = event.target as HTMLFormElement;
        const elements = Array.from(form.elements) as HTMLInputElement[];
        const data = elements
            .filter((element) => element.hasAttribute('name'))
            .reduce(
                (object, element) => ({
                    ...object,
                    [`${element.getAttribute('name')}`]: element.value,
                }),
                defaultValues
            );
        await handler(data);
        form.reset();
    };

// https://overreacted.io/making-setinterval-declarative-with-react-hooks/
export const useInterval = (callback: Function, delay: number) => {
    const savedCallback = useRef<Function>();
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);
    useEffect(() => {
        const handler = (...args: any) => savedCallback.current?.(...args);

        if (delay !== null) {
            const id = setInterval(handler, delay);
            return () => clearInterval(id);
        }
    }, [delay]);
};

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();

export const useAppSelector: TypedUseSelectorHook<AppState> = useSelector;
